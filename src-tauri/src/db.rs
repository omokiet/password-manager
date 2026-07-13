use rusqlite::{params, Connection};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::error::{AppError, Result};
use crate::models::PasswordEntry;

fn get_current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// Khởi tạo một Vault (database file) mới với một key nhất định.
/// Tại sao: Phải khóa DB ngay từ lúc khởi tạo. Nếu file đã tồn tại sẽ trả về lỗi
/// để tránh ghi đè nhầm làm mất dữ liệu của người dùng.
pub fn create_vault<P: AsRef<Path>>(path: P, key: &[u8]) -> Result<()> {
    if path.as_ref().exists() {
        return Err(AppError::VaultAlreadyExists);
    }

    let conn = open_connection(&path, key)?;

    conn.execute(
        "CREATE TABLE entries (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            url TEXT NOT NULL,
            notes TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            password_history TEXT NOT NULL DEFAULT '[]',
            custom_fields TEXT NOT NULL DEFAULT '[]'
        )",
        [],
    )
    .map_err(|e| AppError::DatabaseError(format!("Lỗi tạo bảng: {}", e)))?;

    Ok(())
}

/// Mở một Vault đã có bằng key.
/// Tại sao: Chỉ cung cấp đúng key mới vượt qua được PRAGMA key.
/// Nếu sai key, lệnh đọc đầu tiên sẽ trả về error.
pub fn open_vault<P: AsRef<Path>>(path: P, key: &[u8]) -> Result<Connection> {
    if !path.as_ref().exists() {
        return Err(AppError::DatabaseError("File Vault không tồn tại".into()));
    }

    let conn = open_connection(&path, key)?;

    // Test key bằng cách query schema. Nếu sai key, SQLCipher sẽ báo file bị hỏng/mã hóa.
    conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(()))
        .map_err(|_| AppError::DatabaseError("Sai mật khẩu hoặc file hỏng".into()))?;

    Ok(conn)
}

/// Mở kết nối và áp dụng cấu hình PRAGMA chung.
/// Tại sao: `busy_timeout=5000` theo yêu cầu MVP để tránh lock file khi nhiều thread truy cập.
fn open_connection<P: AsRef<Path>>(path: P, key: &[u8]) -> Result<Connection> {
    let hex_key = hex::encode(key); // SQLCipher PRAGMA key yêu cầu hex string

    let conn = Connection::open(path)
        .map_err(|e| AppError::DatabaseError(format!("Không thể mở file DB: {}", e)))?;

    conn.execute_batch(&format!("PRAGMA key = \"x'{}'\";", hex_key))
        .map_err(|e| AppError::DatabaseError(format!("Lỗi cài đặt key SQLCipher: {}", e)))?;

    conn.execute_batch("PRAGMA busy_timeout = 5000;")
        .map_err(|e| AppError::DatabaseError(format!("Lỗi cấu hình busy_timeout: {}", e)))?;

    // Thực hiện migration an toàn (Task 6)
    let _ = migrate_db(&conn);

    Ok(conn)
}

fn migrate_db(conn: &Connection) -> Result<()> {
    // Bỏ qua lỗi nếu cột đã tồn tại trên DB cũ
    let _ = conn.execute(
        "ALTER TABLE entries ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE entries ADD COLUMN password_history TEXT NOT NULL DEFAULT '[]'",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE entries ADD COLUMN custom_fields TEXT NOT NULL DEFAULT '[]'",
        [],
    );
    Ok(())
}

/// Thêm mới một Password Entry vào vault
pub fn add_entry(conn: &Connection, mut entry: PasswordEntry) -> Result<PasswordEntry> {
    entry.id = Uuid::new_v4().to_string();
    entry.created_at = get_current_timestamp();
    entry.updated_at = entry.created_at;

    conn.execute(
        "INSERT INTO entries (id, title, username, password, url, notes, category, created_at, updated_at, is_favorite, password_history, custom_fields) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            entry.id, entry.title, entry.username, entry.password,
            entry.url, entry.notes, entry.category, entry.created_at, entry.updated_at,
            entry.is_favorite as i32,
            serde_json::to_string(&entry.password_history).unwrap_or_else(|_| "[]".to_string()),
            serde_json::to_string(&entry.custom_fields).unwrap_or_else(|_| "[]".to_string())
        ],
    )
    .map_err(|e| AppError::DatabaseError(format!("Lỗi lưu entry: {}", e)))?;

    Ok(entry)
}

/// Cập nhật Entry đã tồn tại
pub fn update_entry(conn: &Connection, mut entry: PasswordEntry) -> Result<PasswordEntry> {
    entry.updated_at = get_current_timestamp();

    // Lấy thông tin history cũ (Task 6)
    if let Ok((old_password, old_history_str)) = conn.query_row(
        "SELECT password, password_history FROM entries WHERE id = ?1",
        params![entry.id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
    ) {
        if old_password != entry.password {
            let mut history: Vec<crate::models::PasswordHistoryEntry> =
                serde_json::from_str(&old_history_str).unwrap_or_default();
            history.push(crate::models::PasswordHistoryEntry {
                old_password,
                changed_at: entry.updated_at,
            });
            if history.len() > 5 {
                history.remove(0); // Chỉ giữ 5 bản ghi mới nhất
            }
            entry.password_history = history;
        } else {
            entry.password_history = serde_json::from_str(&old_history_str).unwrap_or_default();
        }
    }

    let rows_affected = conn.execute(
        "UPDATE entries 
         SET title = ?1, username = ?2, password = ?3, url = ?4, notes = ?5, category = ?6, updated_at = ?7, is_favorite = ?8, password_history = ?9, custom_fields = ?10
         WHERE id = ?11",
        params![
            entry.title, entry.username, entry.password, entry.url,
            entry.notes, entry.category, entry.updated_at, 
            entry.is_favorite as i32,
            serde_json::to_string(&entry.password_history).unwrap_or_else(|_| "[]".to_string()),
            serde_json::to_string(&entry.custom_fields).unwrap_or_else(|_| "[]".to_string()),
            entry.id
        ],
    )
    .map_err(|e| AppError::DatabaseError(format!("Lỗi cập nhật entry: {}", e)))?;

    if rows_affected == 0 {
        return Err(AppError::DatabaseError("Không tìm thấy entry".into()));
    }

    Ok(entry)
}

/// Xóa một Entry
pub fn delete_entry(conn: &Connection, id: &str) -> Result<()> {
    let rows_affected = conn
        .execute("DELETE FROM entries WHERE id = ?1", params![id])
        .map_err(|e| AppError::DatabaseError(format!("Lỗi xóa entry: {}", e)))?;

    if rows_affected == 0 {
        return Err(AppError::DatabaseError("Không tìm thấy entry".into()));
    }

    Ok(())
}

/// Lấy tất cả Entry
pub fn get_all_entries(conn: &Connection) -> Result<Vec<PasswordEntry>> {
    let mut stmt = conn
        .prepare("SELECT id, title, username, password, url, notes, category, created_at, updated_at, is_favorite, password_history, custom_fields FROM entries")
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let entry_iter = stmt
        .query_map([], |row| {
            Ok(PasswordEntry {
                id: row.get(0)?,
                title: row.get(1)?,
                username: row.get(2)?,
                password: row.get(3)?,
                url: row.get(4)?,
                notes: row.get(5)?,
                category: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_favorite: row.get::<_, i32>(9)? != 0,
                password_history: serde_json::from_str(&row.get::<_, String>(10)?)
                    .unwrap_or_default(),
                custom_fields: serde_json::from_str(&row.get::<_, String>(11)?)
                    .unwrap_or_default(),
            })
        })
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let mut entries = Vec::new();
    for entry in entry_iter {
        entries.push(entry.map_err(|e| AppError::DatabaseError(e.to_string()))?);
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{derive_key, generate_salt};
    use std::fs;

    fn get_temp_db_path(name: &str) -> String {
        let uuid = uuid::Uuid::new_v4().to_string();
        let path = format!("./{}_{}", uuid, name);
        let _ = fs::remove_file(&path); // Dọn dẹp trước khi test
        path
    }

    #[test]
    fn test_create_and_open_vault() {
        let path = get_temp_db_path("test_vault.db");
        let salt = generate_salt();
        let key = derive_key("password12345", &salt).unwrap();

        // 1. Tạo mới vault thành công
        assert!(create_vault(&path, key.as_ref()).is_ok());

        // 2. Tạo lại trên file đã tồn tại phải báo lỗi (tránh ghi đè)
        let create_err = create_vault(&path, key.as_ref()).unwrap_err();
        assert!(matches!(create_err, AppError::VaultAlreadyExists));

        // 3. Mở với đúng key phải thành công
        assert!(open_vault(&path, key.as_ref()).is_ok());

        // 4. Mở với sai key phải thất bại
        let wrong_key = derive_key("wrong_password", &salt).unwrap();
        let open_err = open_vault(&path, wrong_key.as_ref()).unwrap_err();
        assert!(matches!(open_err, AppError::DatabaseError(_)));

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_crud_entries() {
        let path = get_temp_db_path("test_crud.db");
        let key = vec![0u8; 32];
        create_vault(&path, &key).unwrap();
        let conn = open_vault(&path, &key).unwrap();

        let entry = PasswordEntry {
            id: String::new(),
            title: "Github".into(),
            username: "user1".into(),
            password: "super_secret_password".into(),
            url: "https://github.com".into(),
            notes: "".into(),
            category: "Work".into(),
            created_at: 0,
            updated_at: 0,
            is_favorite: false,
            password_history: vec![],
        };

        // Add
        let saved_entry = add_entry(&conn, entry).unwrap();
        assert!(!saved_entry.id.is_empty());

        // Get
        let all = get_all_entries(&conn).unwrap();
        assert_eq!(all.len(), 1);

        // Update
        let mut to_update = saved_entry.clone();
        to_update.title = "Github Updated".into();
        let updated = update_entry(&conn, to_update).unwrap();
        assert_eq!(updated.title, "Github Updated");

        // Delete
        assert!(delete_entry(&conn, &updated.id).is_ok());
        assert_eq!(get_all_entries(&conn).unwrap().len(), 0);

        let _ = fs::remove_file(&path);
    }
}
