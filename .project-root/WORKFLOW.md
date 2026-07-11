# Development Workflow & Testing

## Cách chạy dự án
- **Dev mode**: `cargo tauri dev`
- **Build release**: `cargo tauri build`

## Quy trình phát triển
1. **Thiết kế**: Xác định input/output và rủi ro bảo mật.
2. **Backend**: Viết logic trong module tương ứng (`crypto.rs` / `db.rs`).
3. **Unit Test**: Viết test Rust cho hàm vừa thêm.
4. **IPC**: Tạo Tauri command expose logic.
5. **Integration Test**: Viết test command với DB thật tạo trong thư mục `tmp` (không mock).
6. **Frontend**: Xây dựng UI kết nối command.
7. **UI Test**: Viết test Vitest/RTL cho frontend.
8. **E2E Test**: Bổ sung WebdriverIO nếu luồng thay đổi nhiều.

## Yêu cầu Testing Bắt buộc
### 1. Rust Unit Test (`cargo test`)
- Encrypt → Decrypt trả về đúng plaintext.
- Sai master password → vault không thể mở.
- Cùng input (password + salt) → tạo ra cùng key.
- SQLCipher DB không đọc được bằng công cụ ngoài nếu sai key.

### 2. Rust Integration Test
- Chạy thử các lệnh như `create_vault`, `add_entry` với luồng I/O DB thực tế.

### 3. Frontend Test (Vitest + RTL)
- Kiểm tra Generator config, form validation.

### 4. E2E Test (WebdriverIO)
- Luồng chính: Mở app → Tạo vault → Thêm entry → Khóa → Mở → Thấy data.

### 5. Automation
- Sử dụng script 1 chạm để chạy toàn bộ suite test.

## Quy trình/Luồng đặc biệt
- **Create Vault**: Nếu file DB đã tồn tại, báo lỗi `VaultAlreadyExists`. KHÔNG ghi đè ngầm. User muốn reset phải có flow riêng yêu cầu gõ "DELETE".
- **Concurrency**: `busy_timeout` set là 5000ms. Kết hợp với `tauri-plugin-single-instance` để chặn mở nhiều cửa sổ cùng lúc.
- **Auto-lock**: Hủy toàn bộ nội dung đang gõ dở trên RAM. Có thể thêm cảnh báo UX trước khi khóa.

## Git Commit Convention (Conventional Commits)
- `feat:` Tính năng mới
- `fix:` Vá lỗi
- `test:` Test code
- `docs:` Tài liệu
- `refactor:` Tối ưu code
- `chore:` Cấu hình

## Checklist Bảo mật (Bắt buộc duyệt trước khi Merge)
- [ ] Master password KHÔNG lưu xuống đĩa.
- [ ] Các biến nhạy cảm đã dùng `zeroize`.
- [ ] Không có `println!`, `dbg!` in ra password.
- [ ] Sử dụng SQLCipher `PRAGMA key`.
- [ ] Đã comment giải thích "Tại sao" cho các hàm Security.
