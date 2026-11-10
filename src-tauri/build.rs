use std::fs;
use std::path::Path;

fn load_env_file(path: &Path) {
    if !path.exists() {
        return;
    }

    if let Ok(content) = fs::read_to_string(path) {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }
            if let Some((key, val)) = trimmed.split_once('=') {
                let key = key.trim();
                let mut val = val.trim();
                if (val.starts_with('"') && val.ends_with('"'))
                    || (val.starts_with('\'') && val.ends_with('\''))
                {
                    val = &val[1..val.len() - 1];
                }
                println!("cargo:rustc-env={}={}", key, val);
            }
        }
    }
}

fn main() {
    println!("cargo:rerun-if-changed=../.env");
    println!("cargo:rerun-if-changed=.env");

    load_env_file(Path::new("../.env"));
    load_env_file(Path::new(".env"));

    for var in &["GDRIVE_CLIENT_ID", "GDRIVE_CLIENT_SECRET"] {
        if let Ok(val) = std::env::var(var) {
            println!("cargo:rustc-env={}={}", var, val);
        }
    }

    tauri_build::build();
}
