use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use base64::prelude::{Engine as _, BASE64_URL_SAFE_NO_PAD};
use rand::RngExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::error::{AppError, Result};

pub const GDRIVE_APP_DATA_SCOPE: &str = "https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.appdata";

/// Thông tin token OAuth nhận từ Google.
/// Tại sao: Triển khai Zeroize để xóa token truy cập khỏi RAM khi drop.
#[derive(Debug, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
}

/// Dữ liệu lưu trữ thông tin phiên Google Drive trong app_data_dir.
#[derive(Debug, Serialize, Deserialize)]
pub struct StoredGoogleAuth {
    pub refresh_token: String,
    pub client_id: String,
    pub client_secret: Option<String>,
    pub connected_at: i64,
}

/// Tính toán S256 code_challenge từ code_verifier theo chuẩn RFC 7636 Section 4.2.
/// Tại sao: PKCE bắt buộc mã hóa SHA-256 không padding để chứng minh tính hợp lệ
/// của client mà không cần Client Secret.
pub fn derive_code_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let digest = hasher.finalize();
    BASE64_URL_SAFE_NO_PAD.encode(digest)
}

/// Tạo cặp PKCE (code_verifier, code_challenge) ngẫu nhiên.
/// Tại sao: Chuỗi ngẫu nhiên 64 ký tự nằm trong dải 43..128 ký tự unreserved theo RFC 7636.
pub fn generate_pkce_pair() -> (String, String) {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let mut rng = rand::rng();
    let verifier: String = (0..64)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();

    let challenge = derive_code_challenge(&verifier);
    (verifier, challenge)
}

/// Xây dựng URL mở trình duyệt để người dùng đăng nhập Google.
pub fn build_auth_url(client_id: &str, redirect_uri: &str, challenge: &str) -> String {
    format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        client_id,
        redirect_uri,
        GDRIVE_APP_DATA_SCOPE,
        challenge
    )
}

/// Phân tích dòng HTTP request từ trình duyệt callback để trích xuất mã authorization code.
pub fn parse_oauth_callback(request_line: &str) -> Result<String> {
    if request_line.contains("error=") {
        let err_part = request_line
            .split("error=")
            .nth(1)
            .and_then(|s| s.split(['&', ' ']).next())
            .unwrap_or("unknown_error");
        return Err(AppError::OAuthError(format!("Google từ chối ủy quyền: {}", err_part)));
    }

    if let Some(code_part) = request_line.split("code=").nth(1) {
        if let Some(code) = code_part.split(['&', ' ']).next() {
            if !code.is_empty() {
                return Ok(code.to_string());
            }
        }
    }

    Err(AppError::OAuthError("Không tìm thấy authorization code trong callback".into()))
}

/// Lắng nghe trên cổng loopback cục bộ để nhận redirect OAuth code từ trình duyệt.
/// Tại sao: Dùng cổng ngẫu nhiên 127.0.0.1:0 tránh đụng độ port, kết hợp non-blocking polling
/// với timeout và cờ AtomicBool cancel_flag để người dùng có thể bấm Hủy bất kỳ lúc nào mà không bị treo UI.
pub fn listen_for_auth_code(
    listener: TcpListener,
    timeout_secs: u64,
    cancel_flag: Arc<AtomicBool>,
) -> Result<String> {
    listener.set_nonblocking(true)
        .map_err(|e| AppError::OAuthError(format!("Lỗi cấu hình socket: {}", e)))?;

    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(timeout_secs);

    let (mut stream, _) = loop {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err(AppError::OAuthError("Người dùng đã hủy đăng nhập".into()));
        }

        match listener.accept() {
            Ok(res) => break res,
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                if start.elapsed() > timeout {
                    return Err(AppError::OAuthError("Quá thời gian chờ ủy quyền từ Google (timeout)".into()));
                }
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(e) => return Err(AppError::OAuthError(format!("Lỗi chờ kết nối: {}", e))),
        }
    };

    let _ = stream.set_nonblocking(false);
    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(10)));

    let mut buffer = [0u8; 2048];
    let bytes_read = stream.read(&mut buffer)
        .map_err(|e| AppError::OAuthError(format!("Lỗi đọc dữ liệu callback: {}", e)))?;

    let request_str = String::from_utf8_lossy(&buffer[..bytes_read]);
    let first_line = request_str.lines().next().unwrap_or_default();

    let code_result = parse_oauth_callback(first_line);

    let (status_line, body_content) = match &code_result {
        Ok(_) => (
            "HTTP/1.1 200 OK",
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Xác thực thành công</title><style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}.box{background:#111;padding:40px;border-radius:24px;border:1px solid #222;text-align:center;}h2{color:#4ade80;margin-top:0;}p{color:#888;}</style></head><body><div class='box'><h2>Đăng nhập thành công!</h2><p>Bạn có thể đóng tab này và quay lại Password Manager.</p></div><script>setTimeout(function(){window.close();}, 1500);</script></body></html>"
        ),
        Err(_err) => (
            "HTTP/1.1 400 Bad Request",
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Lỗi xác thực</title><style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}.box{background:#111;padding:40px;border-radius:24px;border:1px solid #222;text-align:center;}h2{color:#f87171;margin-top:0;}p{color:#888;}</style></head><body><div class='box'><h2>Xác thực thất bại</h2><p>Đã xảy ra lỗi khi nhận quyền từ Google. Vui lòng thử lại.</p></div></body></html>"
        )
    };

    let response = format!(
        "{}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status_line,
        body_content.len(),
        body_content
    );

    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();

    code_result
}

/// Trao đổi authorization code và code_verifier lấy Access Token & Refresh Token từ Google.
pub async fn exchange_code_for_tokens(
    client_id: &str,
    client_secret: Option<&str>,
    code: &str,
    code_verifier: &str,
    redirect_uri: &str,
) -> Result<OAuthTokenResponse> {
    let client = reqwest::Client::new();
    let mut params = HashMap::new();
    params.insert("client_id", client_id);
    if let Some(secret) = client_secret {
        params.insert("client_secret", secret);
    }
    params.insert("code", code);
    params.insert("code_verifier", code_verifier);
    params.insert("redirect_uri", redirect_uri);
    params.insert("grant_type", "authorization_code");

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Không thể kết nối máy chủ Google: {}", e)))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(AppError::OAuthError(format!("Lỗi cấp token từ Google: {}", err_text)));
    }

    let token_resp: OAuthTokenResponse = response
        .json()
        .await
        .map_err(|e| AppError::OAuthError(format!("Lỗi parse token response: {}", e)))?;

    Ok(token_resp)
}

/// Làm mới Access Token bằng Refresh Token khi Access Token hết hạn sau 1 giờ.
pub async fn refresh_access_token(
    client_id: &str,
    client_secret: Option<&str>,
    refresh_token: &str,
) -> Result<OAuthTokenResponse> {
    let client = reqwest::Client::new();
    let mut params = HashMap::new();
    params.insert("client_id", client_id);
    if let Some(secret) = client_secret {
        params.insert("client_secret", secret);
    }
    params.insert("refresh_token", refresh_token);
    params.insert("grant_type", "refresh_token");

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi kết nối khi làm mới token: {}", e)))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(AppError::OAuthError(format!("Lỗi refresh token: {}", err_text)));
    }

    let token_resp: OAuthTokenResponse = response
        .json()
        .await
        .map_err(|e| AppError::OAuthError(format!("Lỗi parse refreshed token: {}", e)))?;

    Ok(token_resp)
}

