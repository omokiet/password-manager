use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Lỗi mã hóa/giải mã: {0}")]
    CryptoError(String),

    #[error("Lỗi cơ sở dữ liệu: {0}")]
    DatabaseError(String),

    #[error("Vault đã tồn tại")]
    VaultAlreadyExists,
}

// Serialize cho AppError để truyền qua Tauri IPC (trả về message an toàn cho frontend)
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        // Trả về chuỗi mô tả lỗi, frontend chỉ nhận được string message, không rò rỉ stack trace
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
