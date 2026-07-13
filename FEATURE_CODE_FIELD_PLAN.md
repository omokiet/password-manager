# Kế hoạch chi tiết: Tính năng Custom Fields (Recovery Codes / Multiline)

## 1. Database & Schema Migration
- **File**: `src-tauri/src/db.rs`
- **Thực hiện**:
  - Cập nhật hàm `migrate_db`: Thêm lệnh `ALTER TABLE entries ADD COLUMN custom_fields TEXT NOT NULL DEFAULT '[]'`. Bỏ qua lỗi nếu cột đã tồn tại.
  - Cập nhật `INSERT INTO` trong `add_entry` và `UPDATE` trong `update_entry` để lưu mảng JSON của `custom_fields`.
  - Cập nhật `SELECT` trong `get_all_entries` để đọc và parse mảng JSON, fallback về `[]` nếu lỗi.

## 2. Backend Models
- **File**: `src-tauri/src/models.rs`
- **Thực hiện**:
  - Tạo Enum `CustomFieldType` gồm các loại: `Text`, `Password`, `Multiline`.
  - Tạo Struct `CustomField { id: String, label: String, value: String, field_type: CustomFieldType }`.
  - Thêm thuộc tính `#[serde(default)] pub custom_fields: Vec<CustomField>` vào `PasswordEntry`. Việc thêm `#[serde(default)]` giúp tương thích ngược khi deserialize dữ liệu cũ.

## 3. Frontend Types
- **File**: Chứa định nghĩa interface (ví dụ `src/types/index.ts` hoặc tương đương).
- **Thực hiện**: Cập nhật interface `PasswordEntry` để chứa `custom_fields?: CustomField[]`.

## 4. UI: Form Thêm/Sửa (Add/Edit Entry)
- **Thực hiện**:
  - Bổ sung section "Custom Fields".
  - Thêm nút "Add Field" cho phép người dùng chọn loại trường (Text, Password, Multiline).
  - Component tự động render input tương ứng (Input type text, type password, hoặc Textarea).
  - Ràng buộc độ dài (Max length: 10KB) để tránh crash UI khi paste quá nhiều text.
  - **Tính năng "Import from File"**: Thêm nút (kế bên trường Multiline) gọi `@tauri-apps/plugin-dialog` để chọn file `.txt`/`.md` và `@tauri-apps/plugin-fs` để đọc nội dung đưa vào field.

## 5. UI: Xem chi tiết (View Entry)
- **Thực hiện**:
  - Render danh sách các Custom Fields dưới phần thông tin cơ bản.
  - Với loại `Multiline`: Hiển thị bên trong khối code block để dễ đọc (VD: mã Recovery).
  - Tích hợp nút "Copy" cho từng field. Đảm bảo nút copy gọi IPC command copy an toàn (tự động xóa clipboard sau 30 giây).

## 6. Tính năng Search
- **Thực hiện**: Cập nhật logic filter tìm kiếm ở Frontend. Ngoài việc check `title`, `username`, cần duyệt qua mảng `custom_fields` để xem có chứa keyword không.

## 7. Khám bệnh (Edge Cases)
- **DB cũ không có cột**: Đã xử lý bằng `migrate_db` và `DEFAULT '[]'`.
- **Dữ liệu lớn**: Giới hạn ở frontend 10KB (áp dụng cả khi gõ tay và khi Import File).
- **Bảo mật clipboard đa dòng**: Cơ chế auto-clear của hệ thống vẫn hoạt động bất kể chuỗi có kí tự xuống dòng hay không.

## 8. Checklist Triển khai
- [x] 1. Rust: Cập nhật struct `models.rs` (`CustomField`, `CustomFieldType`).
- [ ] 2. Rust: Cập nhật `db.rs` thêm cột `custom_fields` (Migration, Insert, Update, Select).
- [ ] 3. Rust: Viết/Cập nhật unit test để đảm bảo lưu và lấy custom field đúng.
- [ ] 4. Frontend: Cập nhật Type/Interface.
- [ ] 5. Frontend: Giao diện Form thêm/sửa, xử lý mảng động Custom Field.
- [ ] 6. Frontend: Tích hợp Tauri dialog & fs để đọc file text vào trường Multiline.
- [ ] 7. Frontend: Giao diện xem chi tiết Entry, hiển thị Code Block, nút Copy.
- [ ] 8. Frontend: Cập nhật chức năng Search.
