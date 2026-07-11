use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng as ArgonOsRng, PasswordHasher, SaltString},
    Argon2, Params,
};
use zeroize::{Zeroizing};

use crate::error::{AppError, Result};

/// Tạo salt ngẫu nhiên cho Argon2id.
/// Tại sao: Cần một salt độc nhất cho mỗi vault (được lưu cùng DB file) để chống tấn công Rainbow Table.
pub fn generate_salt() -> String {
    let salt = SaltString::generate(&mut ArgonOsRng);
    salt.as_str().to_string()
}

/// Derive encryption key từ master password và salt bằng thuật toán Argon2id.
/// Tại sao: Argon2id chống brute-force.
/// Hàm trả về Zeroizing<Vec<u8>> để tự xóa key khỏi RAM khi biến drop, chống rò rỉ bộ nhớ.
pub fn derive_key(password: &str, salt: &str) -> Result<Zeroizing<Vec<u8>>> {
    let parsed_salt = SaltString::from_b64(salt)
        .map_err(|_| AppError::CryptoError("Salt không hợp lệ".into()))?;

    // Threat model: Kẻ tấn công sao chép file vault.db và vault.salt ra máy khác để brute-force offline.
    // Việc tăng memory_cost (64MB) và time_cost (3) làm tăng chi phí tính toán trên GPU/ASIC,
    // đảm bảo mỗi lần thử mật khẩu mất ~500ms - 1000ms trên máy bình thường, khiến brute-force bất thi.
    let params = Params::new(65536, 3, 4, Some(32))
        .map_err(|e| AppError::CryptoError(format!("Lỗi cấu hình Argon2: {}", e)))?;
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    
    let password_hash = argon2
        .hash_password(password.as_bytes(), &parsed_salt)
        .map_err(|e| AppError::CryptoError(format!("Lỗi tạo key Argon2: {}", e)))?;

    let hash = password_hash.hash.ok_or_else(|| {
        AppError::CryptoError("Không thể trích xuất hash từ Argon2".into())
    })?;
    
    let mut key_bytes = hash.as_bytes().to_vec();
    key_bytes.truncate(32);
    
    Ok(Zeroizing::new(key_bytes))
}

/// Mã hóa dữ liệu byte array bằng thuật toán AES-256-GCM.
/// Tại sao: AES-GCM cung cấp Authenticated Encryption, vừa mã hóa vừa bảo vệ toàn vẹn dữ liệu.
pub fn encrypt_data(key: &[u8], plaintext: &[u8]) -> Result<Vec<u8>> {
    if key.len() != 32 {
        return Err(AppError::CryptoError("Key phải dài 32 bytes".into()));
    }
    
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng); // 12 bytes
    
    let mut ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|_| AppError::CryptoError("Lỗi mã hóa dữ liệu".into()))?;
        
    let mut result = nonce.to_vec();
    result.append(&mut ciphertext);
    
    Ok(result)
}

/// Giải mã dữ liệu bằng thuật toán AES-256-GCM.
/// Tại sao: GCM kiểm tra Authentication Tag để phát hiện ciphertext bị giả mạo/chỉnh sửa.
pub fn decrypt_data(key: &[u8], encrypted_data: &[u8]) -> Result<Vec<u8>> {
    if key.len() != 32 {
        return Err(AppError::CryptoError("Key phải dài 32 bytes".into()));
    }
    
    if encrypted_data.len() < 12 {
        return Err(AppError::CryptoError("Dữ liệu mã hóa không hợp lệ (quá ngắn)".into()));
    }
    
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| AppError::CryptoError("Lỗi giải mã (sai key hoặc data bị hỏng)".into()))?;
        
    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_argon2id_derivation() {
        let password = "my_super_secret_password";
        let salt = generate_salt();
        
        let key1 = derive_key(password, &salt).unwrap();
        let key2 = derive_key(password, &salt).unwrap();
        
        assert_eq!(key1.as_ref(), key2.as_ref());
        assert_eq!(key1.len(), 32);
    }
    
    #[test]
    fn test_argon2id_wrong_password() {
        let salt = generate_salt();
        let key1 = derive_key("password123", &salt).unwrap();
        let key2 = derive_key("password124", &salt).unwrap();
        
        assert_ne!(key1.as_ref(), key2.as_ref());
    }

    #[test]
    fn test_aes_gcm_encrypt_decrypt() {
        let salt = generate_salt();
        let key = derive_key("master_password_8chars", &salt).unwrap();
        
        let plaintext = b"Hello, Zero-Knowledge World!";
        let ciphertext = encrypt_data(&key, plaintext).unwrap();
        
        assert_ne!(plaintext.to_vec(), ciphertext);
        
        let decrypted = decrypt_data(&key, &ciphertext).unwrap();
        assert_eq!(plaintext.to_vec(), decrypted);
    }
    
    #[test]
    fn test_aes_gcm_wrong_key() {
        let salt = generate_salt();
        let key1 = derive_key("password_a", &salt).unwrap();
        let key2 = derive_key("password_b", &salt).unwrap();
        
        let plaintext = b"Secret Message";
        let ciphertext = encrypt_data(&key1, plaintext).unwrap();
        
        let result = decrypt_data(&key2, &ciphertext);
        assert!(result.is_err());
    }

    #[test]
    fn test_argon2id_benchmark() {
        use std::time::Instant;
        let password = "benchmark_password";
        let salt = generate_salt();
        
        let start = Instant::now();
        let _key = derive_key(password, &salt).unwrap();
        let duration = start.elapsed();
        
        println!("Argon2id derive time: {:?}", duration);
        // TODO_BENCHMARK_RESULT
    }
}
