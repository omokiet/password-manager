# Quản Lý Mật Khẩu Zero-Knowledge

## Tổng Quan
Một ứng dụng desktop quản lý mật khẩu offline hoàn toàn, được thiết kế chú trọng vào độ bảo mật cao và giao diện cao cấp. Ứng dụng sử dụng kiến trúc Zero-Knowledge: mật khẩu chủ (master password) không bao giờ được lưu lại trên ổ cứng. Toàn bộ dữ liệu được mã hóa cục bộ bằng AES-256-GCM và Argon2id.

## Công Nghệ (Tech Stack)
- Frontend: React 18, TypeScript, Tailwind CSS v4
- Backend: Rust, Tauri v2
- Database: SQLite với SQLCipher (thuộc tính `bundled-sqlcipher-vendored-openssl`)
- Mã hóa: Argon2id (Key Derivation), AES-256-GCM (Mã hóa dữ liệu), Zeroize (Xóa sạch bộ nhớ)

## Kiến Trúc Bảo Mật
- Zero-Knowledge: Mật khẩu chủ tuyệt đối không được lưu.
- In-Memory Keys: Key mã hóa chỉ tồn tại trên RAM trong khoảng thời gian vault đang mở khóa.
- Lưu Trữ An Toàn: File vault (`vault.db`) và salt (`vault.salt`) được lưu ngầm định an toàn trong thư mục `app_data_dir` của hệ điều hành.
- Xóa Bộ Nhớ (Memory Sanitization): Key mã hóa và các struct nhạy cảm bị xóa hoàn toàn khỏi bộ nhớ RAM bằng thư viện `zeroize` ngay khi không còn sử dụng hoặc khi vault bị khóa.

## Các Tính Năng Cốt Lõi (v1.1)
- **Quản lý Mật Khẩu (CRUD)**: Lưu trữ, chỉnh sửa, xóa và tạo mật khẩu ngẫu nhiên an toàn.
- **Phân loại (Category & Favorite)**: Đánh dấu sao mật khẩu quan trọng và phân loại theo nhóm.
- **Lưu Trữ Lịch Sử**: Tự động lưu tối đa 5 lần đổi mật khẩu gần nhất của mỗi mục.
- **Đổi Mật Khẩu Chủ**: Cơ chế rekey dữ liệu an toàn trên SQLite sử dụng các giao dịch atomic (file temporary).
- **Sao Lưu & Khôi Phục**: Hỗ trợ xuất (export) toàn bộ DB và Salt dưới dạng mã hóa Base64Hex (định dạng `.vaultbak`) và khôi phục (import) một cách an toàn.
- **Phân Tích Mật Khẩu**: Chấm điểm Health Score, phát hiện mật khẩu yếu, trùng lặp hoặc đã quá hạn (>90 ngày).
- **Tìm Kiếm & Lọc**: Công cụ tìm kiếm tức thời theo tiêu đề hoặc lọc danh sách theo danh mục (Category).
- **Tự Động Khóa & Xóa Clipboard**: Tự động lock vault sau 5 phút không hoạt động (hoặc khi thu nhỏ). Xóa sạch Clipboard sau 30 giây khi copy mật khẩu.
- **Tiện Ích Nhanh**: Nhấn `Ctrl+C` (hoặc `Cmd+C`) để copy nhanh mật khẩu của mục đang chọn.
- **Bảo Vệ Đa Luồng**: Chống khởi chạy nhiều phiên bản ứng dụng (Single-instance lock).

## Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- Node.js
- Rust toolchain
- Visual Studio Code với extension rust-analyzer và Tauri
- Windows (Bắt buộc cài Strawberry Perl để build openssl/sqlcipher)

### Khởi chạy ứng dụng
Cài đặt thư viện frontend:
```bash
npm install
```

Chạy server dev:
```bash
npm run tauri dev
```

Build file cài đặt:
```bash
npm run tauri build
```
