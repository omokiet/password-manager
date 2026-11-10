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

---

### Mức độ P0 / P1: Lỗi Nghiêm Trọng & Lỗ Hổng Bảo Mật Mới (Từ Ponytail Audit)

- [x] **11. useVault không cập nhật ID sau khi thêm entry mới, gây trùng lặp bản ghi khi sửa tiếp**
  - **Vị trí:** `src/shared/hooks/useVault.ts:L106-L114`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Cập nhật `selectedEntry` bằng object trả về từ `add_entry` và `update_entry`.

- [ ] **12. Mất điện hoặc crash trong khi đổi Master Password làm hỏng vĩnh viễn khóa Vault**
  - **Vị trí:** `src-tauri/src/commands.rs:L147-L168`
  - **Trạng thái:** CHƯA XỬ LÝ (Must Fix).
  - **Vấn đề:** Sau `PRAGMA rekey`, DB dùng salt mới (`vault.salt.tmp`), nhưng nếu crash trước `fs::rename`, đĩa chỉ còn `vault.salt` cũ. Khi mở lại, cả pass cũ lẫn mới đều không mở được.
  - **Giải pháp:** Trong `unlock_vault`, nếu thấy `vault.salt.tmp` tồn tại và mở bằng `vault.salt` thất bại, thử mở với `vault.salt.tmp` và hoàn tất rename để khôi phục.

- [ ] **13. Đọc file tuỳ ý và Export Backup hoạt động ngay cả khi Vault đang bị khóa**
  - **Vị trí:** `src-tauri/src/commands.rs:L226-L235, L246-L271`
  - **Trạng thái:** CHƯA XỬ LÝ (Must Fix).
  - **Vấn đề:** `read_file_content` và `export_backup` không gọi `get_connection(&state)`, cho phép đọc file hệ thống hoặc dump DB blob khi app chưa mở khóa.
  - **Giải pháp:** Thêm `let _ = get_connection(&state)?;` vào đầu hai hàm để khóa cổng khi vault chưa mở.

---

### Mức độ P2 / P3: Cải Thiện UX & Trùng Lặp Code (Should Fix Từ Ponytail Audit)

- [x] **14. Màn hình Desktop bị che đen (Privacy Overlay) mỗi khi click sang cửa sổ khác**
  - **Vị trí:** `src/App.tsx:L35-L40`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Bỏ bắt sự kiện `window.blur`, chỉ kích hoạt che màn hình khi `document.visibilityState === 'hidden'`.

- [x] **15. `window.prompt()` chặn thread và không hoạt động trên Mobile WebView**
  - **Vị trí:** `src/components/SettingsPanel.tsx:L75-L87`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Thay bằng custom in-app React modal yêu cầu gõ chuỗi CONFIRM. Bổ sung unit test kiểm chứng.

- [x] **16. Trùng lặp hơn 500 dòng markup form chi tiết giữa DesktopDashboard và MobileDashboard**
  - **Vị trí:** `src/desktop/DesktopDashboard.tsx`, `src/mobile/MobileDashboard.tsx`
  - **Trạng thái:** ĐÃ XỬ LÝ.
  - **Giải pháp:** Đã tạo component dùng chung `src/shared/components/EntryDetailForm.tsx`, giảm ròng 203 dòng code trùng lặp.
