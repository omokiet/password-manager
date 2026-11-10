# SPEC-002: Google Drive Encrypted Cloud Backup

| Metadata             | Description                                                         |
| :------------------- | :------------------------------------------------------------------ |
| **Spec ID**          | SPEC-002                                                            |
| **Feature Name**     | Google Drive Encrypted Cloud Backup & Restore                      |
| **Target Version**   | v2.1.0                                                              |
| **Status**           | `ACCEPTED / READY FOR IMPLEMENTATION`                               |
| **Author**           | Antigravity AI & System Owner                                       |
| **Dependencies**     | Core Schema v1.1.6 (`vault.db`, `vault.salt`, `.vaultbak` format)   |

---

## 1. Bối cảnh & Mục tiêu (Context & Problem Statement)

### 1.1 Vấn đề
- Hiện tại bản sao lưu `.vaultbak` chỉ lưu trên bộ nhớ cục bộ của máy tính hoặc truyền thủ công qua QR Code / USB.
- Nếu thiết bị bị mất, hỏng ổ cứng hoặc format mà người dùng chưa kịp chép file backup ra ngoài, toàn bộ mật khẩu sẽ bị mất vĩnh viễn.
- Người dùng cần một giải pháp sao lưu lên cloud cá nhân vừa tiện lợi vừa an toàn tuyệt đối mà không phụ thuộc vào hạ tầng máy chủ trung gian của bên thứ ba.

### 1.2 Mục tiêu
- Tích hợp tính năng sao lưu và khôi phục trực tiếp với **Google Drive** của chính người dùng.
- **Bảo toàn nguyên tắc Zero-Knowledge**: Chỉ tải lên file `.vaultbak` đã được mã hóa toàn phần bằng SQLCipher + Argon2id. Google Drive hoàn toàn đóng vai trò là kho lưu trữ thụ động ("dumb storage"), Google không thể đọc được nội dung mật khẩu.
- Hoạt động độc lập bằng luồng **OAuth 2.0 PKCE** phía client (Desktop & Mobile), không cần backend server trung gian.
- Chi phí hạ tầng vận hành: `0đ`.

---

## 2. Phạm vi chức năng cốt lõi (In-Scope Features)

1. **Kết nối tài khoản Google (OAuth 2.0 PKCE)**:
   - Nút "Kết nối Google Drive" trong màn hình Cài đặt (`SettingsPanel`).
   - Mở trình duyệt hệ thống để người dùng xác thực và cấp quyền cho app.
   - Nhận mã ủy quyền thông qua loopback server cục bộ (`http://127.0.0.1:<port>/oauth/callback`) trên Desktop hoặc custom deep link trên Mobile.
   - Trao đổi lấy Access Token và Refresh Token để duy trì phiên làm việc.
2. **Không gian lưu trữ thư mục ẩn (`appDataFolder`)**:
   - Sử dụng phạm vi quyền (Scope): `https://www.googleapis.com/auth/drive.appdata`.
   - Toàn bộ file sao lưu được lưu trữ trong thư mục dữ liệu ẩn của ứng dụng trên Google Drive.
   - Tránh việc người dùng nhìn thấy các file cơ sở dữ liệu trên giao diện web `drive.google.com` và tránh rủi ro bấm xóa/sửa nhầm.
3. **Sao lưu thủ công 1-chạm (Manual Backup on Demand)**:
   - Nút "Sao lưu lên Google Drive" trong Cài đặt.
   - Đặt tên file theo định dạng có mốc thời gian: `vault_backup_YYYYMMDD_HHmmss.vaultbak`.
   - Mỗi lần bấm tạo ra một bản sao lưu độc lập trên Drive (không ghi đè bản cũ).
4. **Khôi phục từ Cloud (Cloud Restore)**:
   - Nút "Khôi phục từ Google Drive".
   - Tải danh sách các file backup hiện có trong `appDataFolder` kèm ngày giờ tạo và dung lượng.
   - Hiển thị danh sách để người dùng chọn bản muốn khôi phục.
   - Tải về và áp dụng quy trình thay thế nguyên tử (tương tự local restore: tạo `.bak` tạm thời, chỉ apply khi kiểm tra tính toàn vẹn thành công).
5. **Hướng dẫn sử dụng & Cảnh báo trong App (In-App Guidance)**:
   - Hiển thị pop-up/tooltip hướng dẫn rõ ràng:
     - Vì sao Google cảnh báo *"Ứng dụng chưa được xác minh"* (do app cá nhân mã nguồn mở, không phải app thương mại).
     - Hướng dẫn các bước bấm: *Nâng cao (Advanced) $\rightarrow$ Tiếp tục (Go to Password Manager)*.
     - Cam kết bảo mật: Dữ liệu đã mã hóa 100% trước khi rời khỏi máy.
6. **Ngắt kết nối (Disconnect / Revoke)**:
   - Nút "Ngắt kết nối Google Drive": Xóa Access Token, Refresh Token khỏi bộ nhớ cục bộ, chuyển app về trạng thái offline thuần túy.

---

## 3. Không làm (Non-Goals / Out of Scope)

1. **Không Auto-Sync âm thầm theo thời gian thực (Realtime Multi-Master Sync)**:
   - Không tự động sync mỗi khi gõ phím. Giữ cơ chế thủ công có chủ đích của người dùng để loại bỏ rủi ro xung đột dữ liệu (data conflict / split-brain) khi dùng nhiều thiết bị cùng lúc.
2. **Không tải lên dữ liệu dạng Plaintext**:
   - Tuyệt đối không upload file JSON hay bảng dữ liệu thô. Chỉ upload file nhị phân mã hóa chuẩn `.vaultbak`.
3. **Không xây dựng Server xác thực trung gian**:
   - Mọi luồng OAuth và gọi API REST diễn ra trực tiếp giữa client và máy chủ `googleapis.com`.

---

## 4. Phân tích Edge Cases & Phương án xử lý (Khám bệnh trước)

| STT | Tình huống (Edge Case) | Rủi ro | Hướng xử lý đề xuất |
| :-- | :--------------------- | :----- | :------------------ |
| 1 | **Access Token hết hạn sau 1 giờ** | Gọi API Google Drive thất bại với mã lỗi HTTP 401 | Tự động sử dụng Refresh Token để lấy Access Token mới trong nền mà không bắt người dùng đăng nhập lại. |
| 2 | **Người dùng thu hồi quyền trên Google Account** | Refresh Token bị vô hiệu hóa (HTTP 400/401 `invalid_grant`) | Xóa sạch token đã lưu, chuyển UI về trạng thái "Chưa kết nối" và thông báo người dùng đăng nhập lại. |
| 3 | **Mất mạng khi đang upload hoặc download** | File backup trên cloud bị cụt hoặc hỏng dở dang | Upload: Sử dụng upload multipart/resumable; nếu lỗi hủy file rác. Download: Tải về file `.tmp` cục bộ, kiểm tra giải mã hex & JSON hợp lệ mới tiến hành restore DB. |
| 4 | **Người dùng tích lũy quá nhiều file backup làm chậm query** | Danh sách file trong `appDataFolder` tăng lên hàng trăm file | Giới hạn hiển thị 10–20 bản mới nhất; cung cấp nút "Dọn dẹp bản sao lưu cũ" (xóa các bản quá 30 ngày). |
| 5 | **Đồng hồ hệ thống của máy tính bị sai lệch** | Timestamp trên tên file bị lệch mốc thời gian | Lấy thêm trường `createdTime` do chính Google Drive API trả về khi hiển thị danh sách khôi phục để đảm bảo thứ tự thời gian luôn đúng. |
| 6 | **Cổng Loopback HTTP bị chiếm dụng (Port Conflict trên PC)** | Không nhận được callback redirect OAuth từ trình duyệt | Sử dụng cổng động ngẫu nhiên (ephemeral port `127.0.0.1:0`) và truyền chính xác port đó vào `redirect_uri` gửi cho Google. |

---

## 5. Quyết định đã chốt từ Người dùng (Finalized Decisions)

1. **Vị trí lưu trữ**: Chọn **Thư mục ẩn (`drive.appdata` / `appDataFolder`)**. Không gây rác giao diện web Google Drive của người dùng, không lo người dùng lỡ tay bấm xóa file.
2. **Cơ chế sao lưu**: Chọn **Phương án A (Thủ công 1-chạm)**. Người dùng chủ động bấm "Sao lưu lên Drive" và "Khôi phục từ Drive" trong Cài đặt.
3. **Định dạng tên file**: Đặt tên có timestamp: `vault_backup_YYYYMMDD_HHmmss.vaultbak`. Mỗi lần sao lưu là một file độc lập.
4. **Google Client ID & Hướng dẫn**: Chọn **Cách 1 (Nhúng Client ID cấu hình sẵn)** kèm theo màn hình hướng dẫn từng bước ngay trong ứng dụng để người dùng hiểu và vượt qua màn hình cảnh báo "Ứng dụng chưa xác minh" của Google.

---

## 6. Kiến trúc Kỹ thuật (Technical Architecture)

```
+--------------------------------------------------------------------------+
|                          Client Application                              |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |                 React Frontend (SettingsPanel)                     |  |
|  |  - Nút "Kết nối / Ngắt kết nối Google Drive"                       |  |
|  |  - Hộp thoại hướng dẫn đăng nhập & vượt màn hình Chưa xác minh     |  |
|  |  - Nút "Sao lưu ngay" & Danh sách bản sao lưu Cloud để khôi phục  |  |
|  +-----------------------------------+--------------------------------+  |
|                                      | IPC Invoke                        |
|  +-----------------------------------v--------------------------------+  |
|  |                 Rust Core (tauri backend)                          |  |
|  |  1. OAuth Manager:                                                 |  |
|  |     - Sinh code_verifier + code_challenge (PKCE SHA-256)           |  |
|  |     - Mở cổng HTTP Loopback tạm thời nhận auth_code                |  |
|  |     - Gọi https://oauth2.googleapis.com/token                      |  |
|  |     - Lưu Refresh Token an toàn trong app_data                     |  |
|  |  2. Google Drive API Client:                                       |  |
|  |     - Multipart Upload file .vaultbak vào spaces: 'appDataFolder'  |  |
|  |     - Query danh sách file từ 'appDataFolder'                      |  |
|  |     - Download file blob về bộ nhớ tạm                             |  |
|  |  3. Safe Atomic Restore:                                           |  |
|  |     - Tạo .bak, thay thế file vault.db và vault.salt               |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
                                     |
                          HTTPS REST API (Direct)
                                     |
+------------------------------------v-------------------------------------+
|                      Google Cloud Identity & Drive                       |
|  - https://accounts.google.com/o/oauth2/v2/auth                          |
|  - https://oauth2.googleapis.com/token                                   |
|  - https://www.googleapis.com/upload/drive/v3/files (appDataFolder)      |
+--------------------------------------------------------------------------+
```

---

## 7. Kế hoạch triển khai kỹ thuật (Phased Implementation Plan)

- **Phase 1: Chuẩn bị Cấu hình Google Cloud & Luồng OAuth PKCE**
  - Đăng ký OAuth 2.0 Client ID (loại Desktop Application) trên Google Cloud Console với scope `drive.appdata`.
  - Viết module Rust `src-tauri/src/oauth.rs`: Sinh PKCE challenge, mở server HTTP loopback nhận callback, trao đổi token và tự động làm mới token (refresh).
- **Phase 2: Xây dựng Google Drive API Service trên Rust**
  - Viết module `src-tauri/src/gdrive.rs`:
    - `upload_backup(backup_data)` $\rightarrow$ tạo file trong `appDataFolder`.
    - `list_backups()` $\rightarrow$ lấy danh sách file kèm metadata.
    - `download_backup(file_id)` $\rightarrow$ tải nội dung file.
  - Expose các Tauri IPC commands tương ứng.
- **Phase 3: Tích hợp Giao diện Cài đặt & Hướng dẫn sử dụng**
  - Bổ sung tab/khối "Google Drive Backup" vào `SettingsPanel.tsx`.
  - Hiển thị trạng thái kết nối, nút đăng nhập kèm Modal hướng dẫn chi tiết vượt qua màn hình "Ứng dụng chưa xác minh".
  - Hiển thị danh sách các bản backup cloud kèm nút Khôi phục và nút Sao lưu ngay.
- **Phase 4: Kiểm thử Tự động & Nghiệm thu**
  - Unit tests cho luồng PKCE và xử lý dữ liệu backup.
  - Integration test với mock Google Drive API.

---

## 8. Tiêu chí nghiệm thu BDD (Acceptance Criteria)

```gherkin
Feature: Google Drive Encrypted Backup

  Scenario: Người dùng kết nối Google Drive lần đầu thành công
    Given Người dùng đang mở màn hình Cài đặt
    When Bấm vào nút "Kết nối Google Drive"
    Then Trình duyệt mở ra trang đăng nhập Google
    And Ứng dụng hiển thị hướng dẫn cách chấp nhận quyền ứng dụng chưa xác minh
    When Người dùng hoàn tất cấp quyền trên trình duyệt
    Then Ứng dụng nhận mã xác thực và chuyển trạng thái sang "Đã kết nối: user@gmail.com"

  Scenario: Sao lưu Vault lên Google Drive thành công
    Given Ứng dụng đã kết nối với tài khoản Google Drive
    When Người dùng bấm nút "Sao lưu ngay"
    Then Ứng dụng xuất dữ liệu Vault mã hóa thành file dạng vault_backup_YYYYMMDD_HHmmss.vaultbak
    And Tải file lên thư mục ẩn appDataFolder của Google Drive
    And Hiển thị thông báo "Sao lưu lên Google Drive thành công!"

  Scenario: Khôi phục Vault từ bản sao lưu trên Google Drive
    Given Người dùng mở danh sách sao lưu Cloud trong Cài đặt
    When Người dùng chọn một bản sao lưu và bấm "Khôi phục"
    Then Ứng dụng hiển thị hộp thoại xác nhận cảnh báo
    When Người dùng xác nhận
    Then Ứng dụng tải file backup từ Google Drive về
    And Thực hiện kiểm tra tính toàn vẹn và thay thế an toàn Vault cục bộ
    And Yêu cầu người dùng đăng nhập bằng mật khẩu chủ tương ứng với bản sao lưu đó
```
