#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tauri::Manager;

pub mod commands;
pub mod crypto;
pub mod db;
pub mod error;
pub mod gdrive;
pub mod models;
pub mod oauth;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(commands::AppState::default())
        .plugin(tauri_plugin_opener::init());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .invoke_handler(tauri::generate_handler![
            commands::check_vault_exists,
            commands::create_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::change_master_password,
            commands::add_entry,
            commands::update_entry,
            commands::delete_entry,
            commands::delete_all_entries,
            commands::get_all_entries,
            commands::export_backup,
            commands::import_backup,
            commands::read_file_content,
            commands::gdrive_start_auth,
            commands::gdrive_get_status,
            commands::gdrive_disconnect,
            commands::gdrive_upload_backup,
            commands::gdrive_list_backups,
            commands::gdrive_restore_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
