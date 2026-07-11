# Coding Rules & Security Guidelines

## Quy ước đặt tên
- **Rust**: `snake_case` cho biến, hàm, module; `PascalCase` cho struct, enum.
- **TypeScript**: `camelCase` cho biến, hàm; `PascalCase` cho component, interface.
- **Tauri Commands**: `snake_case`.

## Cấu trúc Module Rust Bắt buộc
- `crypto.rs`: Crypto logic (Argon2id, AES).
- `db.rs`: Database logic (SQLCipher).
- `commands.rs`: Tauri IPC handlers (lớp trung gian kết nối crypto/db với frontend).
- `models.rs`: Structs.
- `error.rs`: Xử lý lỗi.

## Yêu cầu Comment (BẮT BUỘC)
- Mọi hàm Rust liên quan đến `crypto`, `security`, `IPC` phải có doc comment (`///`).
- Phải giải thích TẠI SAO thực hiện cách đó, đặc biệt là các quyết định bảo mật (vd: clone/drop memory, zeroize).

## Xử lý Lỗi
- KHÔNG sử dụng `unwrap()` hoặc `expect()` trong mã nguồn liên quan bảo mật/DB.
- Sử dụng `Result<T, E>` với custom error types trong `error.rs`.

## Quy tắc Bảo mật Cốt lõi
- **Không Log Plaintext**: Không ghi log plaintext password (kể cả debug).
- **Zeroize**: Mọi struct/biến lưu mật khẩu, key, salt phải gọi `zeroize` để xóa khỏi bộ nhớ ngay khi xong việc. (Draft password khi auto-lock cũng phải xóa, KHÔNG giữ lại RAM hay ghi ra đĩa).
- **Stateless Frontend**: Không mã hóa/giải mã bằng JavaScript/TypeScript.
- **Độ dài Master Password**: Tối thiểu 8 ký tự (ưu tiên length hơn complexity).

## Format Code
- **Rust**: `cargo fmt`
- **Frontend**: Prettier/ESLint.
