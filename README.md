# Offline Zero-Knowledge Password Manager

Ứng dụng quản lý mật khẩu cá nhân cục bộ, chạy hoàn toàn offline trên Desktop (Windows/macOS/Linux) và Mobile (Android Companion). 

Mật khẩu chủ không bao giờ lưu trên đĩa. Toàn bộ cơ sở dữ liệu được mã hóa bằng SQLCipher và thuật toán phái sinh khóa Argon2id.

---

## Kiến trúc Bảo mật

- **Zero-Knowledge**: Master Password không ghi xuống file hay gửi qua mạng. Mất mật khẩu chủ đồng nghĩa mất toàn bộ dữ liệu.
- **Key Derivation (Argon2id)**: Memory 64MB, Iterations 3, Parallelism 4, Salt 16-byte ngẫu nhiên chống Rainbow Table và tấn công GPU offline.
- **Database Encryption**: Toàn bộ file SQLite (`vault.db`) được mã hóa mức block thông qua SQLCipher (`PRAGMA key`).
- **Memory Zeroization**: Khóa giải mã và plaintext mật khẩu được bọc trong các struct thực thi `zeroize`. RAM được xóa sạch về `0x00` ngay khi drop hoặc khi vault bị khóa.
- **Auto-lock**: Tự động khóa vault và xóa key khỏi RAM sau 5 phút không tương tác, hoặc khi app chuyển sang chế độ nền (60s grace period).
- **Chống rò rỉ giao diện (Privacy Overlay)**: Tự động che mờ màn hình khi chuyển ứng dụng (chống chụp trộm màn hình trên App Switcher).
- **Clipboard Sanitization**: Tự động xóa nội dung sao chép sau 30 giây.

---

## Tính năng

- **Quản lý mật khẩu**: Thêm, sửa, xóa, tìm kiếm tức thời, phân loại danh mục và đánh dấu yêu thích.
- **Trường dữ liệu tùy biến**: Thêm trường văn bản, mật khẩu phụ, hoặc import file nhỏ (tối đa 10KB).
- **Lịch sử mật khẩu**: Lưu trữ 5 mật khẩu cũ gần nhất cho mỗi mục.
- **Kiểm tra độ mạnh (Health Dashboard)**: Phân tích mật khẩu yếu, dùng lặp lại, hoặc quá 90 ngày chưa đổi.
- **Trao đổi & Sao lưu Dữ liệu**:
  - Export/Import file sao lưu mã hóa `.vaultbak` cục bộ.
  - Quét mã QR mã hóa trực tiếp giữa Desktop và Mobile (xác thực bằng PIN 4 chữ số, giải mã AES-256-GCM trên RAM).
  - **Sao lưu Đám mây Cá nhân (Google Drive Encrypted Backup)**:
    - Sao lưu 1-chạm vào thư mục ẩn an toàn của người dùng (`appDataFolder`).
    - Xác thực OAuth 2.0 PKCE trực tiếp với Google, không qua máy chủ trung gian.
    - Zero-Knowledge: Chỉ tải lên bản sao lưu đã mã hóa hoàn toàn.
    - Khôi phục nguyên tử (Atomic Restore Rollback) với cơ chế bảo vệ chống lỗi mạng.

---

## Cài đặt & Phát triển

### Yêu cầu
- Node.js 18+
- Rust 1.75+
- Windows: Strawberry Perl (để biên dịch OpenSSL / SQLCipher)

### Chạy chế độ Dev
```bash
npm install
npm run tauri dev
```

### Chạy Test
```bash
# Frontend tests (Vitest)
npm test

# Backend tests (Cargo)
cargo test --manifest-path src-tauri/Cargo.toml
```

### Đóng gói ứng dụng
```bash
npm run tauri build
```
