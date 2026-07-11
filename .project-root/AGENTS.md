# Project: Offline Desktop Password Manager

## Mục đích dự án
Xây dựng một ứng dụng desktop quản lý mật khẩu cá nhân, chạy offline hoàn toàn (không đồng bộ cloud). 
Ứng dụng hướng đến sự an toàn tuyệt đối với kiến trúc Zero-Knowledge cục bộ, nơi master password không bao giờ được lưu trữ.

## Tech Stack
- **Framework**: Tauri v2
- **Backend (Core Logic & Security)**: Rust
- **Frontend (UI)**: React + TypeScript + Tailwind CSS
- **Database**: SQLite + SQLCipher
- **Mã hóa**: AES-256-GCM (Dữ liệu), Argon2id (Key Derivation)

## Kiến trúc bảo mật
- **Zero-Knowledge**: Master password không bao giờ được lưu trực tiếp dưới bất kỳ hình thức nào. Mất master password đồng nghĩa mất toàn bộ dữ liệu. (Master Password yêu cầu tối thiểu 8 ký tự).
- **Key Derivation**: Master Password + Salt (lưu kèm metadata) → Argon2id → Encryption Key.
- **Database Encryption**: Encryption Key được sử dụng để mở SQLCipher database (`PRAGMA key`). Toàn bộ file DB được mã hóa.
- **In-Memory Key Management**: Encryption key chỉ tồn tại trong memory (RAM) khi vault đang mở khóa. Sử dụng `zeroize` để xóa key khỏi bộ nhớ một cách an toàn ngay khi khóa vault hoặc thoát ứng dụng.
- **Auto-lock**: Tự động xóa key khỏi memory và khóa vault sau một khoảng thời gian không hoạt động (mặc định 5 phút).
- **Clipboard Management**: Tự động xóa password khỏi clipboard sau 30 giây khi user copy. (Nếu OS chặn quyền xóa, bắt buộc cảnh báo cho user).
- **No Logging**: Tuyệt đối không log plaintext password ở bất kỳ đâu (kể cả debug/dev).
- **Known Limitation**: App không thể đảm bảo an toàn tuyệt đối 100% nếu bị force-kill (do OS có thể ghi RAM ra swap file). Tính năng khóa memory (mlock) sẽ được xem xét ở phase sau.

## Cấu trúc thư mục (Dự kiến)
- `.project-root/`: Chứa các tài liệu hướng dẫn và quy tắc.
- `src-tauri/`: Code Rust backend.
  - `src/crypto.rs`: Xử lý mã hóa, giải mã, key derivation.
  - `src/db.rs`: Xử lý tương tác với SQLite thông qua SQLCipher.
  - `src/commands.rs`: Tauri IPC commands (expose backend functionality cho frontend).
  - `src/models.rs`: Định nghĩa struct dữ liệu.
  - `src/error.rs`: Custom error handling.
- `src/`: Code React frontend.

## Vai trò của các Module
- **Rust Backend**: Chịu trách nhiệm bảo mật, lưu trữ, và logic nghiệp vụ cốt lõi. Tuyệt đối không rò rỉ dữ liệu nhạy cảm ra ngoài.
- **React Frontend**: Chỉ đảm nhiệm hiển thị UI. Gọi IPC commands để xử lý, không tự mã hóa ở trình duyệt.
