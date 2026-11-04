# PROBLEMS & CHECKLIST LỖI — Desktop Password Manager

Bảng theo dõi các vấn đề kỹ thuật, lỗ hổng bảo mật, lỗi logic và nợ kiểm thử của dự án, sắp xếp theo mức độ nghiêm trọng từ cao đến thấp.

---

## Danh Sách Checklist Lỗi

### Mức độ P0: Lỗi Nghiêm Trọng (Bảo Mật, Vỡ Tính Năng, Nguy Cơ Mất Dữ Liệu)

- [x] **1. Lỗi ACL chặn ghi file khi Export Backup**
  - **Vị trí:** `src/components/SettingsPanel.tsx:L53-L75`, `src-tauri/src/commands.rs`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Bỏ gọi `writeTextFile` từ JavaScript. Truyền đường dẫn đích `targetPath` từ hộp thoại `save()` xuống command Rust `export_backup(target_path: String)`. Rust backend dùng `std::fs::write` trực tiếp, không cần quyền write scope nguy hiểm ở WebView ACL.

- [x] **2. Nguy cơ hỏng Vault vĩnh viễn khi Restore thất bại nửa chừng (Non-atomic Restore)**
  - **Vị trí:** `src-tauri/src/commands.rs:L280-L288`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Tạo backup an toàn (`.bak`) cho cả DB và Salt hiện tại trước khi ghi đè. Nếu đổi tên file salt thất bại, tự động rollback DB cũ từ `.bak`. Chỉ xóa `.bak` khi cả hai file đã ở trạng thái đồng bộ thành công.

- [x] **3. Lệch đơn vị thời gian (Seconds vs Milliseconds) làm sai điểm bảo mật**
  - **Vị trí:** `src/components/HealthDashboard.tsx:L30-L33`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Chuẩn hóa timestamp `e.updated_at` từ giây sang mili-giây (`e.updated_at * 1000`). Mật khẩu mới tạo không còn bị trừ 20 điểm oan.

- [x] **4. Plaintext Password trong struct `PasswordEntry` không được Zeroize khỏi bộ nhớ**
  - **Vị trí:** `src-tauri/src/models.rs:L4-L20`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Cập nhật `Cargo.toml` bật feature `derive` của crate `zeroize`. Derive `Zeroize, ZeroizeOnDrop` cho `PasswordEntry`, `PasswordHistoryEntry`, và `CustomField`. Plaintext được xóa về `0x00` khi drop.

---

### Mức độ P1: Thiếu Test Nghiêm Trọng & Rò Rỉ Tài Nguyên

- [x] **5. Tầng IPC Commands có 0% Test Coverage**
  - **Vị trí:** `src-tauri/tests/commands_test.rs`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Bổ sung integration test suite kiểm tra quy trình Rekey đổi master password, giới hạn 5 bản ghi `password_history`, và tính toàn vẹn của cấu trúc dữ liệu Backup.

- [x] **6. Màn hình Cài đặt `SettingsPanel.tsx` không có bài test nào**
  - **Vị trí:** `src/components/__tests__/SettingsPanel.test.tsx` & `HealthDashboard.test.tsx`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Viết 4 unit tests cho `SettingsPanel` (validate mật khẩu mới, gọi dialog save & invoke `export_backup`, xử lý khi user hủy dialog) và 2 tests cho `HealthDashboard`.

- [x] **7. Rò rỉ file rác `salt.tmp` khi đổi mật khẩu chủ thất bại**
  - **Vị trí:** `src-tauri/src/commands.rs:L158-L171`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Thêm `fs::remove_file(&temp_salt_path)` trong nhánh lỗi của `change_master_password`.

---

### Mức độ P2: Nợ Kỹ Thuật & Tối Ưu Hiệu Năng

- [x] **8. Dead Code: Mã hóa AES-256-GCM không sử dụng**
  - **Vị trí:** `src-tauri/src/crypto.rs`, `src-tauri/Cargo.toml`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Gỡ bỏ `encrypt_data` và `decrypt_data` thừa, gỡ dependency `aes-gcm` khỏi `Cargo.toml`. Tinh gọn binary và giảm thời gian compile.

- [x] **9. Lãng phí RAM khi gửi toàn bộ chuỗi Hex DB qua WebView**
  - **Vị trí:** `src-tauri/src/commands.rs`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Giải quyết đồng thời cùng lỗi 1: ghi trực tiếp từ backend xuống ổ đĩa, không truyền payload hex DB khổng lồ qua IPC WebView.

---

### Mức độ P3: Cải Thiện Trải Nghiệm Giao Diện (UX)

- [x] **10. Chưa vô hiệu hóa nút bấm (disabled) khi đang xử lý tác vụ**
  - **Vị trí:** `src/components/SettingsPanel.tsx`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Bổ sung `disabled={status === 'loading'}` và hiển thị label tương ứng ("Đang đổi...", "Đang sao lưu...", "Đang xử lý...").
