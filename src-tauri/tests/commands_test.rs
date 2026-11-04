use std::fs;
use tauri_app_lib::crypto::{derive_key, generate_salt};
use tauri_app_lib::db::{add_entry, create_vault, get_all_entries, open_vault, update_entry};
use tauri_app_lib::models::{CustomField, CustomFieldType, PasswordEntry};

fn get_temp_test_db(name: &str) -> String {
    let id = uuid::Uuid::new_v4().to_string();
    let path = format!("./{}_{}.db", id, name);
    let _ = fs::remove_file(&path);
    path
}

#[test]
fn test_password_history_capped_at_five() {
    let path = get_temp_test_db("test_history");
    let key = vec![1u8; 32];
    create_vault(&path, &key).expect("Vault creation failed");
    let conn = open_vault(&path, &key).expect("Vault open failed");

    let entry = PasswordEntry {
        id: String::new(),
        title: "Test History".into(),
        username: "user".into(),
        password: "pass_initial".into(),
        url: "".into(),
        notes: "".into(),
        category: "General".into(),
        created_at: 0,
        updated_at: 0,
        is_favorite: false,
        password_history: vec![],
        custom_fields: vec![],
    };

    let mut current = add_entry(&conn, entry).expect("Add entry failed");

    // Thay đổi mật khẩu 7 lần liên tiếp
    for i in 1..=7 {
        current.password = format!("pass_updated_{}", i);
        current = update_entry(&conn, current).expect("Update entry failed");
    }

    assert_eq!(current.password_history.len(), 5);
    assert_eq!(current.password_history.last().unwrap().old_password, "pass_updated_6");
    assert_eq!(current.password, "pass_updated_7");

    let _ = fs::remove_file(&path);
}

#[test]
fn test_rekey_workflow() {
    let path = get_temp_test_db("test_rekey");
    let old_salt = generate_salt();
    let old_key = derive_key("OldSecretPassword123!", &old_salt).unwrap();

    create_vault(&path, old_key.as_ref()).expect("Create vault failed");
    let conn = open_vault(&path, old_key.as_ref()).expect("Open vault failed");

    let entry = PasswordEntry {
        id: String::new(),
        title: "Test Rekey".into(),
        username: "user".into(),
        password: "secret_value".into(),
        url: "".into(),
        notes: "".into(),
        category: "General".into(),
        created_at: 0,
        updated_at: 0,
        is_favorite: false,
        password_history: vec![],
        custom_fields: vec![CustomField {
            id: "cf1".into(),
            label: "Pin".into(),
            value: "1234".into(),
            field_type: CustomFieldType::Text,
        }],
    };
    add_entry(&conn, entry).expect("Add entry failed");

    // Thực hiện Rekey sang key mới
    let new_salt = generate_salt();
    let new_key = derive_key("NewSecretPassword456!", &new_salt).unwrap();
    let hex_new_key = hex::encode(new_key.as_slice());

    conn.execute_batch(&format!("PRAGMA rekey = \"x'{}'\";", hex_new_key))
        .expect("PRAGMA rekey failed");
    drop(conn);

    // Mở lại bằng key cũ phải thất bại
    let fail_result = open_vault(&path, old_key.as_ref());
    assert!(fail_result.is_err());

    // Mở lại bằng key mới phải thành công và toàn vẹn dữ liệu
    let new_conn = open_vault(&path, new_key.as_ref()).expect("Open with new key failed");
    let all = get_all_entries(&new_conn).expect("Fetch entries failed");
    assert_eq!(all.len(), 1);
    assert_eq!(all[0].title, "Test Rekey");
    assert_eq!(all[0].custom_fields[0].value, "1234");

    let _ = fs::remove_file(&path);
}

#[test]
fn test_backup_data_format_and_integrity() {
    let path = get_temp_test_db("test_backup");
    let salt_path = format!("{}.salt", path);
    let key = vec![42u8; 32];

    create_vault(&path, &key).expect("Create vault failed");
    fs::write(&salt_path, "sample_salt_value").expect("Write salt failed");

    let db_bytes = fs::read(&path).expect("Read db failed");
    let salt_bytes = fs::read(&salt_path).expect("Read salt failed");

    #[derive(serde::Serialize, serde::Deserialize)]
    struct BackupData {
        db: String,
        salt: String,
    }

    let backup = BackupData {
        db: hex::encode(db_bytes),
        salt: hex::encode(salt_bytes),
    };

    let serialized = serde_json::to_string(&backup).expect("Serialize failed");
    assert!(!serialized.is_empty());

    // Test deserialize
    let deserialized: BackupData = serde_json::from_str(&serialized).expect("Deserialize failed");
    let decoded_salt = hex::decode(&deserialized.salt).expect("Decode salt failed");
    assert_eq!(String::from_utf8(decoded_salt).unwrap(), "sample_salt_value");

    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(&salt_path);
}

