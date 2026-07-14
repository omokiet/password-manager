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

## Các Tính Năng Cốt Lõi (v1.1.5)
- **Quản lý Mật Khẩu (CRUD)**: Lưu trữ, chỉnh sửa, xóa và tạo mật khẩu ngẫu nhiên an toàn.
- **Trường Dữ Liệu Tùy Chỉnh (Custom Fields)**: Thêm các trường Text (hỗ trợ nhập từ file) và Mật khẩu phụ động, không giới hạn.
- **Hướng Dẫn Sử Dụng In-App**: Tích hợp sách hướng dẫn sử dụng ngay bên trong ứng dụng, thân thiện với người không chuyên.
- **Phân loại Tab thông minh (Category & Favorite)**: Gõ "Tên danh mục" lúc tạo mật khẩu, ứng dụng tự động tạo ra một tab phân loại ở Sidebar. Mật khẩu đánh dấu sao (Favorite) luôn được ghim lên đầu.
- **Lưu Trữ Lịch Sử**: Tự động lưu tối đa 5 lần đổi mật khẩu gần nhất của mỗi mục.
- **Đổi Mật Khẩu Chủ & Wipe Data**: Cơ chế rekey dữ liệu an toàn trên SQLite. Tích hợp Danger Zone cho phép xóa vĩnh viễn toàn bộ dữ liệu khi cần.
- **Sao Lưu & Khôi Phục Native**: Khôi phục (Restore) an toàn từ màn hình khóa. Hỗ trợ xuất (Export Backup) lưu trực tiếp ra file `.vaultbak` bằng chính hộp thoại lưu file của hệ điều hành (Native OS Dialog).
- **Phân Tích Độ Mạnh Mật Khẩu**: Chấm Điểm Độ Mạnh, phát hiện mật khẩu yếu, trùng lặp hoặc đã quá hạn (>90 ngày). Cho phép click trực tiếp vào cảnh báo để chuyển nhanh sang trang sửa mật khẩu.
- **Tìm Kiếm & Lọc**: Công cụ tìm kiếm tức thời theo tiêu đề hoặc lọc danh sách theo danh mục (Category).
- **Tự Động Khóa & Xóa Clipboard**: Tự động lock vault sau 5 phút không hoạt động (hoặc khi thu nhỏ). Xóa sạch Clipboard sau 30 giây khi copy mật khẩu.
- **Tiện Ích Nhanh**: Nhấn `Ctrl+C` (hoặc `Cmd+C`) để copy nhanh mật khẩu của mục đang chọn.
- **Điều hướng dạng Stack**: Nút Trở Về (Back) và Trang Chủ (Home) mượt mà cho trải nghiệm liền mạch.
- **Bảo Vệ Đa Luồng**: Chống khởi chạy nhiều phiên bản ứng dụng (Single-instance lock).
- **CI/CD Tự Động**: Đóng gói tự động ra file `.exe` / `.msi` thông qua GitHub Actions khi tạo Tag mới.

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
