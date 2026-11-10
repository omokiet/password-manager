use std::fs;
use std::path::{Path, PathBuf};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, Result};
use crate::oauth::{refresh_access_token, StoredGoogleAuth};

pub const DEFAULT_CLIENT_ID: &str = match option_env!("GDRIVE_CLIENT_ID") {
    Some(val) => val,
    None => "",
};
pub const DEFAULT_CLIENT_SECRET: &str = match option_env!("GDRIVE_CLIENT_SECRET") {
    Some(val) => val,
    None => "",
};
pub const GDRIVE_TOKEN_FILE: &str = "gdrive_token.json";

/// Định dạng Unix timestamp (giây) thành chuỗi ngày giờ UTC `YYYYMMDD_HHmmss`.
/// Tại sao: Triển khai thuật toán lịch Gregory chuẩn (Howard Hinnant) trực tiếp từ stdlib
/// để giữ mã nguồn gọn nhẹ (Ponytail principle), không phụ thuộc thêm crate bên ngoài.
pub fn format_utc_timestamp(secs: u64) -> String {
    let mut days = secs / 86400;
    let day_secs = secs % 86400;
    let hour = day_secs / 3600;
    let min = (day_secs % 3600) / 60;
    let sec = day_secs % 60;

    days += 719468;
    let era = days / 146097;
    let doe = days - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    format!("{:04}{:02}{:02}_{:02}{:02}{:02}", y, m, d, hour, min, sec)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CloudBackupItem {
    pub id: String,
    pub name: String,
    pub size: Option<u64>,
    pub created_time: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DriveFileListResponse {
    files: Option<Vec<DriveFileItem>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DriveFileItem {
    id: String,
    name: String,
    size: Option<String>,
    #[serde(rename = "createdTime")]
    created_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DriveUploadResponse {
    id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupPayloadEnvelope {
    pub db: String,
    pub salt: String,
}

/// Xây dựng payload multipart upload theo chuẩn Google Drive v3 REST API.
/// Tại sao: appDataFolder yêu cầu metadata JSON khai báo parents:["appDataFolder"]
/// đi kèm file nhị phân trong cùng một request multipart/related để tạo file nguyên tử.
pub fn build_multipart_body(file_name: &str, content: &[u8]) -> (String, Vec<u8>) {
    let boundary = format!("-------boundary_{}", uuid::Uuid::new_v4().simple());
    let metadata_json = format!(
        "{{\"name\":\"{}\",\"parents\":[\"appDataFolder\"]}}",
        file_name
    );

    let mut body = Vec::new();
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(b"Content-Type: application/json; charset=UTF-8\r\n\r\n");
    body.extend_from_slice(metadata_json.as_bytes());
    body.extend_from_slice(b"\r\n");

    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(b"Content-Type: application/octet-stream\r\n\r\n");
    body.extend_from_slice(content);
    body.extend_from_slice(b"\r\n");

    body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

    let content_type = format!("multipart/related; boundary={}", boundary);
    (content_type, body)
}

/// Phân tích danh sách file JSON trả về từ Google Drive API files.list.
pub fn parse_drive_files_list(json_str: &str) -> Result<Vec<CloudBackupItem>> {
    let resp: DriveFileListResponse = serde_json::from_str(json_str)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi parse danh sách file Google Drive: {}", e)))?;

    let items = resp.files.unwrap_or_default().into_iter().map(|f| {
        let size = f.size.and_then(|s| s.parse::<u64>().ok());
        let created_time = f.created_time.unwrap_or_default();
        CloudBackupItem {
            id: f.id,
            name: f.name,
            size,
            created_time,
        }
    }).collect();

    Ok(items)
}

/// Kiểm tra tính toàn vẹn của payload sao lưu đám mây trước khi khôi phục.
/// Tại sao: Đảm bảo dữ liệu tải về từ Google Drive là JSON hợp lệ chứa các trường mã hóa hex
/// của db và salt, ngăn chặn ghi đè làm hỏng database cục bộ nếu file tải về bị lỗi mạng.
pub fn validate_cloud_backup_payload(payload: &str) -> Result<()> {
    let envelope: BackupPayloadEnvelope = serde_json::from_str(payload)
        .map_err(|_| AppError::DatabaseError("File sao lưu không hợp lệ: cấu trúc JSON sai".into()))?;

    hex::decode(&envelope.db)
        .map_err(|_| AppError::DatabaseError("File sao lưu không hợp lệ: dữ liệu DB bị lỗi hex".into()))?;
    hex::decode(&envelope.salt)
        .map_err(|_| AppError::DatabaseError("File sao lưu không hợp lệ: dữ liệu Salt bị lỗi hex".into()))?;

    Ok(())
}

/// Đường dẫn file lưu trữ refresh token trong thư mục app data.
pub fn get_token_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(GDRIVE_TOKEN_FILE)
}

/// Lưu thông tin phiên xác thực Google vào thư mục dữ liệu cục bộ.
pub fn save_stored_auth(app_data_dir: &Path, auth: &StoredGoogleAuth) -> Result<()> {
    let token_path = get_token_path(app_data_dir);
    let json = serde_json::to_string(auth)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi serialize Google Auth: {}", e)))?;
    fs::write(&token_path, json)
        .map_err(|e| AppError::DatabaseError(format!("Không thể lưu file token: {}", e)))?;
    Ok(())
}

/// Đọc thông tin phiên xác thực Google từ thư mục dữ liệu cục bộ nếu có.
pub fn load_stored_auth(app_data_dir: &Path) -> Result<Option<StoredGoogleAuth>> {
    let token_path = get_token_path(app_data_dir);
    if !token_path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&token_path)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi đọc file token: {}", e)))?;
    let auth: StoredGoogleAuth = serde_json::from_str(&content)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi parse file token: {}", e)))?;
    Ok(Some(auth))
}

/// Xóa phiên xác thực Google khi người dùng ngắt kết nối.
pub fn delete_stored_auth(app_data_dir: &Path) -> Result<()> {
    let token_path = get_token_path(app_data_dir);
    if token_path.exists() {
        fs::remove_file(&token_path)
            .map_err(|e| AppError::DatabaseError(format!("Không thể xóa file token: {}", e)))?;
    }
    Ok(())
}

/// Lấy Access Token còn hiệu lực bằng cách tự động refresh nếu cần.
pub async fn get_fresh_access_token(app_data_dir: &Path) -> Result<String> {
    let auth = load_stored_auth(app_data_dir)?
        .ok_or_else(|| AppError::OAuthError("Chưa kết nối tài khoản Google Drive".into()))?;

    let fallback_secret = if DEFAULT_CLIENT_SECRET.is_empty() {
        None
    } else {
        Some(DEFAULT_CLIENT_SECRET)
    };
    let secret = auth.client_secret.as_deref().or(fallback_secret);
    let refreshed = refresh_access_token(&auth.client_id, secret, &auth.refresh_token).await
        .map_err(|e| {
            let err_str = e.to_string();
            if err_str.contains("invalid_grant") {
                let _ = delete_stored_auth(app_data_dir);
                AppError::OAuthError("Phiên đăng nhập Google đã hết hạn hoặc bị thu hồi. Vui lòng kết nối lại.".into())
            } else {
                e
            }
        })?;

    Ok(refreshed.access_token.clone())
}

/// Tải file sao lưu lên không gian ẩn appDataFolder trên Google Drive.
pub async fn upload_to_appdata(
    access_token: &str,
    file_name: &str,
    content: &[u8],
) -> Result<String> {
    let client = reqwest::Client::new();
    let (content_type, body) = build_multipart_body(file_name, content);

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", access_token))
            .map_err(|_| AppError::OAuthError("Access token không hợp lệ".into()))?,
    );
    headers.insert(
        CONTENT_TYPE,
        HeaderValue::from_str(&content_type)
            .map_err(|_| AppError::OAuthError("Header Content-Type không hợp lệ".into()))?,
    );

    let res = client
        .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
        .headers(headers)
        .body(body)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi kết nối khi upload Google Drive: {}", e)))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(AppError::NetworkError(format!("Google Drive API từ chối upload: {}", err_text)));
    }

    let upload_resp: DriveUploadResponse = res
        .json()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi đọc kết quả upload từ Google: {}", e)))?;

    Ok(upload_resp.id)
}

/// Lấy danh sách các bản sao lưu hiện có trong không gian appDataFolder.
pub async fn list_appdata_backups(access_token: &str) -> Result<Vec<CloudBackupItem>> {
    let client = reqwest::Client::new();

    let res = client
        .get("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(access_token)
        .query(&[
            ("spaces", "appDataFolder"),
            ("fields", "files(id,name,size,createdTime)"),
            ("orderBy", "createdTime desc"),
            ("q", "name contains 'vault_backup_' and trashed = false"),
        ])
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi kết nối khi lấy danh sách sao lưu: {}", e)))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(AppError::NetworkError(format!("Google Drive API trả lỗi: {}", err_text)));
    }

    let json_text = res
        .text()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi đọc dữ liệu phản hồi: {}", e)))?;

    parse_drive_files_list(&json_text)
}

/// Tải nội dung bản sao lưu từ Google Drive theo file ID.
pub async fn download_file(access_token: &str, file_id: &str) -> Result<String> {
    let client = reqwest::Client::new();

    let url = format!("https://www.googleapis.com/drive/v3/files/{}?alt=media", file_id);
    let res = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi kết nối khi tải bản sao lưu: {}", e)))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(AppError::NetworkError(format!("Lỗi tải file từ Google: {}", err_text)));
    }

    let content = res
        .text()
        .await
        .map_err(|e| AppError::NetworkError(format!("Lỗi đọc nội dung file: {}", e)))?;

    Ok(content)
}
