use std::fs;
use std::net::TcpListener;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;

use crate::crypto::{derive_key, generate_salt};
use crate::db::{create_vault as db_create_vault, open_vault as db_open_vault};
use crate::error::{AppError, Result};
use crate::gdrive::{
    delete_stored_auth, download_file, format_utc_timestamp, get_fresh_access_token,
    list_appdata_backups, load_stored_auth, save_stored_auth, upload_to_appdata,
    validate_cloud_backup_payload, CloudBackupItem, DEFAULT_CLIENT_ID,
};
use crate::oauth::{
    build_auth_url, exchange_code_for_tokens, generate_pkce_pair, listen_for_auth_code,
    StoredGoogleAuth,
};

const VAULT_FILENAME: &str = "vault.db";

pub struct AppState {
    pub db_conn: Mutex<Option<rusqlite::Connection>>,
    pub vault_path: Mutex<Option<PathBuf>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db_conn: Mutex::new(None),
            vault_path: Mutex::new(None),
        }
    }
}

fn get_salt_path(vault_path: &PathBuf) -> PathBuf {
    let mut path = vault_path.clone();
    path.set_extension("salt");
    path
}

fn resolve_vault_path(app: &AppHandle) -> Result<PathBuf> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    fs::create_dir_all(&data_dir)
        .map_err(|e| AppError::DatabaseError(format!("Không thể tạo thư mục dữ liệu: {}", e)))?;

    Ok(data_dir.join(VAULT_FILENAME))
}

#[tauri::command]
pub fn check_vault_exists(app: AppHandle) -> Result<bool> {
    let path = resolve_vault_path(&app)?;
    Ok(path.exists())
}

#[tauri::command]
pub fn create_vault(password: &str, app: AppHandle, state: State<'_, AppState>) -> Result<()> {
    if password.len() < 8 {
        return Err(AppError::CryptoError(
            "Mật khẩu phải từ 8 ký tự trở lên".into(),
        ));
    }

    let path = resolve_vault_path(&app)?;
    if path.exists() {
        return Err(AppError::VaultAlreadyExists);
    }

    let salt = generate_salt();
    let salt_path = get_salt_path(&path);
    fs::write(&salt_path, &salt)
        .map_err(|e| AppError::DatabaseError(format!("Không thể lưu salt: {}", e)))?;

    let key = derive_key(password, &salt)?;

    db_create_vault(&path, key.as_ref())?;

    let conn = db_open_vault(&path, key.as_ref())?;

    *state.db_conn.lock().unwrap() = Some(conn);
    *state.vault_path.lock().unwrap() = Some(path);

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(password: &str, app: AppHandle, state: State<'_, AppState>) -> Result<()> {
    let path = resolve_vault_path(&app)?;
    let salt_path = get_salt_path(&path);

    if !path.exists() || !salt_path.exists() {
        return Err(AppError::DatabaseError(
            "Không tìm thấy Vault hoặc file Salt".into(),
        ));
    }

    let salt = fs::read_to_string(&salt_path)
        .map_err(|_| AppError::DatabaseError("Không thể đọc file Salt".into()))?;

    let key = derive_key(password, &salt)?;

    let conn = db_open_vault(&path, key.as_ref())?;

    *state.db_conn.lock().unwrap() = Some(conn);
    *state.vault_path.lock().unwrap() = Some(path);

    Ok(())
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<()> {
    *state.db_conn.lock().unwrap() = None;
    *state.vault_path.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
pub fn change_master_password(
    old_password: &str,
    new_password: &str,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<()> {
    if new_password.len() < 8 {
        return Err(AppError::CryptoError(
            "Mật khẩu mới phải từ 8 ký tự trở lên".into(),
        ));
    }

    let path = resolve_vault_path(&app)?;
    let salt_path = get_salt_path(&path);

    let old_salt = fs::read_to_string(&salt_path)
        .map_err(|_| AppError::DatabaseError("Không thể đọc file Salt cũ".into()))?;

    // 1. Verify old password
    let old_key = derive_key(old_password, &old_salt)?;
    let _ = db_open_vault(&path, old_key.as_ref())
        .map_err(|_| AppError::CryptoError("Mật khẩu cũ không chính xác".into()))?;

    // 2. Generate new salt and key
    let new_salt = generate_salt();
    let new_key = derive_key(new_password, &new_salt)?;

    // 3. Write temp salt to avoid corrupting current state
    let temp_salt_path = salt_path.with_extension("salt.tmp");
    fs::write(&temp_salt_path, &new_salt)
        .map_err(|e| AppError::DatabaseError(format!("Không thể lưu salt tạm: {}", e)))?;

    let conn_guard = get_connection(&state)?;
    let conn = conn_guard.as_ref().unwrap();

    // 4. Rekey SQLCipher
    let hex_new_key = hex::encode(new_key.as_slice());
    if let Err(e) = conn.execute_batch(&format!("PRAGMA rekey = \"x'{}'\";", hex_new_key)) {
        let _ = fs::remove_file(&temp_salt_path);
        return Err(AppError::DatabaseError(format!(
            "Lỗi SQLCipher rekey: {}",
            e
        )));
    }

    // 5. Atomic rename to finalize
    if let Err(e) = fs::rename(&temp_salt_path, &salt_path) {
        // Rollback rekey if file operation failed
        let hex_old_key = hex::encode(old_key.as_slice());
        let _ = conn.execute_batch(&format!("PRAGMA rekey = \"x'{}'\";", hex_old_key));
        let _ = fs::remove_file(&temp_salt_path);
        return Err(AppError::DatabaseError(format!(
            "Lỗi ghi đè salt mới, đã rollback: {}",
            e
        )));
    }

    Ok(())
}

// ==========================================
// CRUD Commands cho Entries
// ==========================================

fn ensure_vault_unlocked(state: &State<'_, AppState>) -> Result<()> {
    let conn = state.db_conn.lock().unwrap();
    if conn.is_none() {
        return Err(AppError::DatabaseError("Vault đang bị khóa".into()));
    }
    Ok(())
}

fn get_connection<'a>(
    state: &'a State<'_, AppState>,
) -> Result<std::sync::MutexGuard<'a, Option<rusqlite::Connection>>> {
    let conn = state.db_conn.lock().unwrap();
    if conn.is_none() {
        return Err(AppError::DatabaseError("Vault đang bị khóa".into()));
    }
    Ok(conn)
}

#[tauri::command]
pub fn add_entry(
    entry: crate::models::PasswordEntry,
    state: State<'_, AppState>,
) -> Result<crate::models::PasswordEntry> {
    let conn_guard = get_connection(&state)?;
    crate::db::add_entry(conn_guard.as_ref().unwrap(), entry)
}

#[tauri::command]
pub fn update_entry(
    entry: crate::models::PasswordEntry,
    state: State<'_, AppState>,
) -> Result<crate::models::PasswordEntry> {
    let conn_guard = get_connection(&state)?;
    crate::db::update_entry(conn_guard.as_ref().unwrap(), entry)
}

#[tauri::command]
pub fn delete_entry(id: &str, state: State<'_, AppState>) -> Result<()> {
    let conn_guard = get_connection(&state)?;
    crate::db::delete_entry(conn_guard.as_ref().unwrap(), id)
}

#[tauri::command]
pub fn delete_all_entries(state: State<'_, AppState>) -> Result<()> {
    let conn_guard = get_connection(&state)?;
    let conn = conn_guard.as_ref().unwrap();
    conn.execute("DELETE FROM entries", [])
        .map_err(|e| AppError::DatabaseError(format!("Lỗi xóa toàn bộ mật khẩu: {}", e)))?;
    Ok(())
}

#[tauri::command]
pub fn get_all_entries(state: State<'_, AppState>) -> Result<Vec<crate::models::PasswordEntry>> {
    let conn_guard = get_connection(&state)?;
    crate::db::get_all_entries(conn_guard.as_ref().unwrap())
}

#[tauri::command]
pub fn read_file_content(file_path: String) -> Result<String> {
    let metadata = fs::metadata(&file_path)
        .map_err(|e| AppError::DatabaseError(format!("Không thể đọc thông tin tệp: {}", e)))?;
    if metadata.len() > 10240 {
        return Err(AppError::DatabaseError("Tệp quá lớn (vượt quá 10KB)".into()));
    }
    fs::read_to_string(&file_path)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi đọc tệp: {}", e)))
}

// ==========================================
// Backup & Restore
// ==========================================
#[derive(serde::Serialize, serde::Deserialize)]
struct BackupData {
    db: String,
    salt: String,
}

#[tauri::command]
pub fn export_backup(target_path: String, app: AppHandle) -> Result<()> {
    let path = resolve_vault_path(&app)?;
    let salt_path = get_salt_path(&path);

    if !path.exists() || !salt_path.exists() {
        return Err(AppError::DatabaseError("Không tìm thấy dữ liệu Vault để sao lưu".into()));
    }

    let db_bytes =
        fs::read(&path).map_err(|e| AppError::DatabaseError(format!("Lỗi đọc DB: {}", e)))?;
    let salt_bytes = fs::read(&salt_path)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi đọc Salt: {}", e)))?;

    let backup = BackupData {
        db: hex::encode(db_bytes),
        salt: hex::encode(salt_bytes),
    };

    let backup_json = serde_json::to_string(&backup)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi tạo backup: {}", e)))?;

    fs::write(&target_path, backup_json)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi ghi file sao lưu: {}", e)))?;

    Ok(())
}

#[tauri::command]
pub fn import_backup(
    backup_json: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<()> {
    let backup: BackupData = serde_json::from_str(&backup_json)
        .map_err(|_| AppError::DatabaseError("Dữ liệu backup không hợp lệ".into()))?;

    let db_bytes =
        hex::decode(&backup.db).map_err(|_| AppError::DatabaseError("Lỗi giải mã DB".into()))?;
    let salt_bytes = hex::decode(&backup.salt)
        .map_err(|_| AppError::DatabaseError("Lỗi giải mã Salt".into()))?;

    let path = resolve_vault_path(&app)?;
    let salt_path = get_salt_path(&path);

    // Đóng kết nối DB để nhả file handle trước khi ghi đè
    *state.db_conn.lock().unwrap() = None;
    *state.vault_path.lock().unwrap() = None;

    let tmp_db = path.with_extension("db.tmp");
    let tmp_salt = salt_path.with_extension("salt.tmp");

    fs::write(&tmp_db, &db_bytes)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi ghi file DB tạm: {}", e)))?;
    if let Err(e) = fs::write(&tmp_salt, &salt_bytes) {
        let _ = fs::remove_file(&tmp_db);
        return Err(AppError::DatabaseError(format!("Lỗi ghi file Salt tạm: {}", e)));
    }

    // Tạo bản sao lưu an toàn trước khi rename để tránh hỏng dữ liệu nửa chừng
    let bak_db = path.with_extension("db.bak");
    let bak_salt = salt_path.with_extension("salt.bak");

    if path.exists() {
        let _ = fs::copy(&path, &bak_db);
    }
    if salt_path.exists() {
        let _ = fs::copy(&salt_path, &bak_salt);
    }

    if let Err(e) = fs::rename(&tmp_db, &path) {
        let _ = fs::remove_file(&tmp_db);
        let _ = fs::remove_file(&tmp_salt);
        let _ = fs::remove_file(&bak_db);
        let _ = fs::remove_file(&bak_salt);
        return Err(AppError::DatabaseError(format!("Lỗi restore DB: {}", e)));
    }
    if let Err(e) = fs::rename(&tmp_salt, &salt_path) {
        if bak_db.exists() {
            let _ = fs::copy(&bak_db, &path);
        }
        let _ = fs::remove_file(&tmp_salt);
        let _ = fs::remove_file(&bak_db);
        let _ = fs::remove_file(&bak_salt);
        return Err(AppError::DatabaseError(format!(
            "Lỗi restore Salt, đã rollback: {}",
            e
        )));
    }

    let _ = fs::remove_file(&bak_db);
    let _ = fs::remove_file(&bak_salt);

    Ok(())
}

// ==========================================
// Google Drive Cloud Backup & Restore
// ==========================================

#[derive(serde::Serialize, serde::Deserialize)]
pub struct GDriveStatusResponse {
    pub is_connected: bool,
    pub connected_at: Option<i64>,
    pub client_id: Option<String>,
}

/// Khởi chạy luồng xác thực Google Drive OAuth 2.0 PKCE và mở trình duyệt hệ thống.
#[tauri::command]
pub async fn gdrive_start_auth(client_id: Option<String>, app: AppHandle) -> Result<()> {
    let cid = client_id
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_CLIENT_ID.to_string());

    let (verifier, challenge) = generate_pkce_pair();

    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| AppError::OAuthError(format!("Không thể mở cổng loopback: {}", e)))?;
    let port = listener
        .local_addr()
        .map_err(|e| AppError::OAuthError(format!("Không lấy được port cục bộ: {}", e)))?
        .port();

    let redirect_uri = format!("http://127.0.0.1:{}/oauth/callback", port);
    let auth_url = build_auth_url(&cid, &redirect_uri, &challenge);

    app.opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| AppError::OAuthError(format!("Không thể mở trình duyệt: {}", e)))?;

    let code = tauri::async_runtime::spawn_blocking(move || {
        listen_for_auth_code(listener, 180)
    })
    .await
    .map_err(|e| AppError::OAuthError(format!("Lỗi luồng OAuth listener: {}", e)))??;

    let tokens = exchange_code_for_tokens(&cid, &code, &verifier, &redirect_uri).await?;

    let refresh_token = tokens.refresh_token.clone().ok_or_else(|| {
        AppError::OAuthError("Google không trả về Refresh Token. Vui lòng thử lại.".into())
    })?;

    let now_secs = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let stored = StoredGoogleAuth {
        refresh_token,
        client_id: cid,
        connected_at: now_secs,
    };

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    save_stored_auth(&data_dir, &stored)?;

    Ok(())
}

/// Lấy trạng thái kết nối Google Drive hiện tại của ứng dụng.
#[tauri::command]
pub fn gdrive_get_status(app: AppHandle) -> Result<GDriveStatusResponse> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    match load_stored_auth(&data_dir)? {
        Some(auth) => Ok(GDriveStatusResponse {
            is_connected: true,
            connected_at: Some(auth.connected_at),
            client_id: Some(auth.client_id),
        }),
        None => Ok(GDriveStatusResponse {
            is_connected: false,
            connected_at: None,
            client_id: None,
        }),
    }
}

/// Ngắt kết nối và xóa refresh token khỏi thiết bị.
#[tauri::command]
pub fn gdrive_disconnect(app: AppHandle) -> Result<()> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    delete_stored_auth(&data_dir)?;
    Ok(())
}

/// Tạo bản sao lưu đã mã hóa và tải lên không gian appDataFolder của người dùng trên Google Drive.
/// Tại sao: Chỉ tải dữ liệu đã mã hóa (Zero-Knowledge Invariant) và yêu cầu vault mở khóa
/// để xác nhận người dùng sở hữu quyền hợp pháp trước khi tạo backup.
#[tauri::command]
pub async fn gdrive_upload_backup(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String> {
    ensure_vault_unlocked(&state)?;

    let path = resolve_vault_path(&app)?;
    let salt_path = get_salt_path(&path);

    if !path.exists() || !salt_path.exists() {
        return Err(AppError::DatabaseError("Không tìm thấy dữ liệu Vault để sao lưu".into()));
    }

    let db_bytes = fs::read(&path)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi đọc DB: {}", e)))?;
    let salt_bytes = fs::read(&salt_path)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi đọc Salt: {}", e)))?;

    let backup = BackupData {
        db: hex::encode(db_bytes),
        salt: hex::encode(salt_bytes),
    };

    let backup_json = serde_json::to_string(&backup)
        .map_err(|e| AppError::DatabaseError(format!("Lỗi tạo backup: {}", e)))?;

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    let access_token = get_fresh_access_token(&data_dir).await?;

    let now_secs = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let filename = format!("vault_backup_{}.vaultbak", format_utc_timestamp(now_secs));

    let file_id = upload_to_appdata(&access_token, &filename, backup_json.as_bytes()).await?;

    Ok(file_id)
}

/// Lấy danh sách các bản sao lưu trong không gian appDataFolder.
#[tauri::command]
pub async fn gdrive_list_backups(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<CloudBackupItem>> {
    ensure_vault_unlocked(&state)?;

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    let access_token = get_fresh_access_token(&data_dir).await?;

    list_appdata_backups(&access_token).await
}

/// Tải bản sao lưu từ Google Drive và thực hiện thay thế nguyên tử với cơ sở dữ liệu hiện tại.
/// Tại sao: Kiểm tra tính toàn vẹn và JSON trước khi ghi đè để bảo vệ cơ sở dữ liệu
/// khỏi rủi ro đứt đoạn kết nối mạng.
#[tauri::command]
pub async fn gdrive_restore_backup(
    file_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<()> {
    ensure_vault_unlocked(&state)?;

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::DatabaseError("Không thể lấy thư mục dữ liệu ứng dụng".into()))?;

    let access_token = get_fresh_access_token(&data_dir).await?;

    let content = download_file(&access_token, &file_id).await?;

    validate_cloud_backup_payload(&content)?;

    import_backup(content, app, state)?;

    Ok(())
}
