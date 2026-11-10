use tauri_app_lib::gdrive::{build_multipart_body, format_utc_timestamp, parse_drive_files_list, validate_cloud_backup_payload};

#[test]
fn test_format_utc_timestamp() {
    assert_eq!(format_utc_timestamp(0), "19700101_000000");
    assert_eq!(format_utc_timestamp(1700000000), "20231114_221320");
}

#[test]
fn test_build_multipart_body() {
    let file_name = "vault_backup_20261110_120000.vaultbak";
    let content = b"{\"db\":\"010203\",\"salt\":\"040506\"}";

    let (content_type, body) = build_multipart_body(file_name, content);

    assert!(content_type.starts_with("multipart/related; boundary="));
    let body_str = String::from_utf8_lossy(&body);
    
    assert!(body_str.contains("Content-Type: application/json; charset=UTF-8"));
    assert!(body_str.contains(file_name));
    assert!(body_str.contains("appDataFolder"));
    assert!(body_str.contains("Content-Type: application/octet-stream"));
    assert!(body_str.contains("{\"db\":\"010203\",\"salt\":\"040506\"}"));
}

#[test]
fn test_parse_drive_files_list() {
    let mock_json = r#"{
        "kind": "drive#fileList",
        "incompleteSearch": false,
        "files": [
            {
                "id": "file_id_1",
                "name": "vault_backup_20261110_120000.vaultbak",
                "size": "45056",
                "createdTime": "2026-11-10T12:00:00.000Z"
            },
            {
                "id": "file_id_2",
                "name": "vault_backup_20261109_083000.vaultbak",
                "size": "40960",
                "createdTime": "2026-11-09T08:30:00.000Z"
            }
        ]
    }"#;

    let items = parse_drive_files_list(mock_json).expect("Failed to parse files list");
    assert_eq!(items.len(), 2);
    assert_eq!(items[0].id, "file_id_1");
    assert_eq!(items[0].name, "vault_backup_20261110_120000.vaultbak");
    assert_eq!(items[0].size, Some(45056));
    assert_eq!(items[0].created_time, "2026-11-10T12:00:00.000Z");

    assert_eq!(items[1].id, "file_id_2");
    assert_eq!(items[1].size, Some(40960));
}

#[test]
fn test_validate_cloud_backup_payload_valid() {
    let valid_payload = r#"{"db":"deadbeef","salt":"cafe01"}"#;
    assert!(validate_cloud_backup_payload(valid_payload).is_ok());
}

#[test]
fn test_validate_cloud_backup_payload_invalid_json() {
    let invalid_json = "not-json-content";
    assert!(validate_cloud_backup_payload(invalid_json).is_err());
}

#[test]
fn test_validate_cloud_backup_payload_invalid_hex() {
    let invalid_hex = r#"{"db":"not-hex-chars!","salt":"cafe01"}"#;
    assert!(validate_cloud_backup_payload(invalid_hex).is_err());
}

