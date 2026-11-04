# SPEC-001: Offline Mobile Password Manager

| Metadata             | Description                                          |
| :------------------- | :--------------------------------------------------- |
| **Spec ID**          | SPEC-001                                             |
| **Feature Name**     | Offline Mobile Password Manager Client               |
| **Target Version**   | v2.0.0-mobile.alpha                                  |
| **Status**           | `ACCEPTED / READY FOR TECH ARCHITECTURE`             |
| **Author**           | Antigravity AI & System Owner                        |
| **Dependencies**     | Desktop v1.1.6 Core Schema (`vault.db`, `vault.salt`)|

---

## 1. Bối cảnh & Mục tiêu (Context & Problem Statement)

### 1.1 Vấn đề
- Phiên bản Desktop (v1.1.6) chạy offline hoàn chỉnh trên Windows/macOS/Linux.
- Người dùng cần truy cập mật khẩu khi di chuyển trên thiết bị di động mà không phụ thuộc vào hạ tầng cloud hay máy chủ trung gian.
- Môi trường mobile có nhiều rủi ro đặc thù: mất máy, chụp trộm màn hình qua app switcher, memory dump khi OS kill app ngầm, và rò rỉ clipboard sang các bàn phím bên thứ ba.

### 1.2 Mục tiêu
- Xây dựng bản Mobile tương thích 100% định dạng mã hóa và cấu trúc dữ liệu của Desktop (`SQLCipher` + `Argon2id` + `vault.salt`).
- Bảo tồn nguyên tắc Zero-Knowledge: Master password không bao giờ lưu trên đĩa.
- Tối ưu trải nghiệm chạm (touch-first UI) trên nền tảng Android trước (iOS triển khai sau).
- Bật cờ bảo mật chống chụp màn hình (`FLAG_SECURE`) tuyệt đối.

---

## 2. Phạm vi chức năng cốt lõi (In-Scope Features)

1. **Nền tảng mục tiêu**:
   - Triển khai **Android** trước (Android 10+ / API 29+).
   - Kiến trúc module hóa để sẵn sàng port sang iOS ở giai đoạn tiếp theo.
2. **Khởi tạo & Mở khóa Vault**:
   - Tạo vault mới với Master Password ($\ge 8$ ký tự).
   - Mở khóa bằng Master Password duy nhất ở Phase 1. Không dùng sinh trắc học để đảm bảo an toàn tuyệt đối.
3. **Quản lý Mục mật khẩu (CRUD)**:
   - Danh sách phân loại (All, Favorites, Logins, Cards, Secure Notes).
   - Tìm kiếm nhanh tức thời (local in-memory filter).
   - Thêm, sửa, xóa mềm (Trash) và xóa vĩnh viễn.
   - Custom fields và file đính kèm nhỏ ($\le 10\text{KB}$).
4. **Bộ sinh mật khẩu (Password Generator)**:
   - Tùy chỉnh độ dài, chữ hoa, thường, số, ký tự đặc biệt.
   - Copy 1 chạm với bộ đếm tự hủy clipboard sau 30 giây.
5. **Trao đổi dữ liệu Vault (Kết hợp 2 Option)**:
   - **Option A (File-based)**: Nhập/xuất file sao lưu mã hóa `.vaultbak` qua bộ nhớ thiết bị / USB / file manager. Quy trình thay thế nguyên tử (tạo file `.bak` tạm, chỉ apply khi giải mã thành công).
   - **Option B (QR Code-based)**: Quét mã QR mã hóa trực tiếp giữa Desktop và Mobile để chuyển nhanh từng entry hoặc tập dữ liệu nhỏ mà không cần cắm dây.
6. **Bảo mật giao diện & Vòng đời Mobile**:
   - Chặn chụp màn hình & quay video màn hình tuyệt đối (`FLAG_SECURE`).
   - Che mờ giao diện (Privacy Blur/Blank Overlay) tức thì ($0\text{s}$) khi app chuyển sang chế độ đa nhiệm (App Switcher).
   - Hẹn giờ tự động khóa khi app ở chế độ nền (Grace period mặc định 60 giây).
   - Tự động xóa clipboard sau 30 giây kèm cờ `EXTRA_IS_SENSITIVE`.

---

## 3. Không làm (Non-Goals / Out of Scope)

1. **Không Cloud Sync / Server Relay**:
   - Không máy chủ trung gian, không API cloud. Mọi trao đổi diễn ra offline qua file hoặc mã QR.
2. **Không Multi-User / Không Chia sẻ Vault qua mạng**:
   - Mỗi cài đặt mobile chỉ phục vụ 1 người dùng sở hữu 1 vault hoạt động tại 1 thời điểm.
3. **Không Biometric Unlock trong Phase 1**:
   - Đã chuyển ý tưởng tích hợp vân tay/Face ID vào [`docs/IDEAS.md`](file:///d:/repositary/password-manager/docs/IDEAS.md).
4. **Không OS Autofill Service trong Phase 1**:
   - Lưu trữ tại [`docs/IDEAS.md`](file:///d:/repositary/password-manager/docs/IDEAS.md), triển khai ở Phase 2.
5. **Không xuất dữ liệu dạng Plaintext (CSV / JSON trần)**:
   - Chỉ xuất file `.vaultbak` mã hóa AES-256-GCM.

---

## 4. Phân tích Edge Cases & Phương án xử lý (Khám bệnh trước)

| STT | Tình huống (Edge Case) | Rủi ro | Hướng xử lý đề xuất |
| :-- | :--------------------- | :----- | :------------------ |
| 1 | **OS kill app do thiếu RAM (OOM) hoặc Battery Saver** | Dữ liệu nhạy cảm có thể bị flush ra swap/zRAM | Zeroize key ngay khi vào background; không lưu plaintext state vào local storage/saved state. |
| 2 | **Người dùng bật App Switcher / Chụp màn hình** | Lộ plaintext mật khẩu trong ảnh chụp snapshot của OS | Bật cờ cấm chụp (`FLAG_SECURE` trên Android, Privacy Blur Cover trên iOS). |
| 3 | **Clipboard Manager của bàn phím bên thứ ba lưu lén** | Mật khẩu copy tồn tại vĩnh viễn trong lịch sử Gboard/SwiftKey | Đánh dấu cờ `ClipDescription.EXTRA_IS_SENSITIVE` trên Android; hẹn giờ xóa clipboard sau 30s. |
| 4 | **Đang import backup thì mất nguồn / tắt app** | Vault hỏng nửa chừng dẫn đến mất dữ liệu | Sử dụng quy trình copy `.bak` tạm thời tương tự Desktop: chỉ thay thế file chính khi giải mã kiểm tra thành công. |
| 5 | **Múi giờ & Định dạng thời gian giữa các thiết bị** | Lệch mốc thời gian `created_at`, `updated_at` | Thống nhất tuyệt đối sử dụng Unix Timestamp (giây) `i64` trên toàn bộ DB, client chỉ format hiển thị. |
| 6 | **Xoay màn hình / Đổi theme hệ thống** | Trạng thái nhập liệu bị reset hoặc hiển thị sai | Lưu draft state an toàn trên bộ nhớ RAM; xóa draft khi vault bị lock. |
| 7 | **Quét QR Code bị giới hạn dung lượng** | Dữ liệu vault quá lớn không thể render đủ trong 1 mã QR tiêu chuẩn | Giới hạn Option B chỉ dùng cho Single Entry Transfer hoặc chia nhỏ payload thành chuỗi QR động (Animated QR / multipart payloads). File `.vaultbak` vẫn là kênh chính cho full vault. |

---

## 5. Quyết định đã chốt từ Người dùng (Finalized Decisions)

1. **Target Platform**: Android trước. iOS làm sau khi Android hoàn thiện và ổn định.
2. **Tech Stack**: **Tauri v2 Mobile (Rust Backend + React/TS Frontend)**.
3. **Data Exchange**: Kết hợp cả File `.vaultbak` và Mã QR mã hóa trực tiếp giữa màn hình.
4. **Biometrics**: Chọn phương án B (Chỉ dùng Master Password, không lưu key vào Keystore). Ý tưởng Biometrics lưu vào `docs/IDEAS.md`.
5. **Auto-lock Grace Period**: Chọn phương án B (Grace period 60s khi app chạy nền).
6. **Screen Protection**: Chọn phương án A (Kích hoạt `FLAG_SECURE` chặn chụp màn hình 100%).

---

## 6. Kiến trúc Kỹ thuật (Technical Architecture - Tauri v2 Mobile)

```
+--------------------------------------------------------------------------+
|                          Android Device Screen                           |
|  +--------------------------------------------------------------------+  |
|  |                 React 19 + TypeScript + Tailwind                   |  |
|  |  - Mobile View / Responsive Breakpoint (< 768px)                   |  |
|  |  - Bottom Navigation Bar (Vault, Favorites, Generator, Settings)   |  |
|  |  - Privacy Overlay (Blur / Black screen when app is backgrounded)  |  |
|  |  - QR Code Scanner Component (Camera via Web/Native API)           |  |
|  +-----------------------------------+--------------------------------+  |
|                                      | Tauri IPC Bridge                  |
|  +-----------------------------------v--------------------------------+  |
|  |                 Rust Core (`src-tauri` Shared)                     |  |
|  |  - `crypto.rs`: Argon2id KDF + AES-256-GCM Backup Import/Export    |  |
|  |  - `db.rs`: SQLCipher Database (`vault.db`) + `vault.salt`         |  |
|  |  - `models.rs`: `zeroize` on drop                                  |  |
|  |  - `commands.rs`: Shared & Platform-specific IPC commands          |  |
|  +-----------------------------------+--------------------------------+  |
|                                      | Native JNI Layer                  |
|  +-----------------------------------v--------------------------------+  |
|  |               Android Native Wrapper (`MainActivity.kt`)           |  |
|  |  - `window.setFlags(FLAG_SECURE, FLAG_SECURE)`                    |  |
|  |  - App Lifecycle Event Hook (Pause/Resume tracking for Auto-lock) |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

## 7. Kế hoạch triển khai kỹ thuật (Technical Execution Plan)

### Các rủi ro kỹ thuật đã khám bệnh:
1. `tauri-plugin-single-instance`: Chỉ hỗ trợ desktop -> cần `#[cfg(not(mobile))]`, chuyển `use tauri::Manager;` lên top-level.
2. Android OS background freeze: Timer JS bị freeze -> dùng `last_background_timestamp` so sánh khi `visibilitychange`.
3. Lộ thumbnail Recent Apps -> `FLAG_SECURE` native + Privacy Overlay frontend.
4. Payload QR Code giới hạn -> Option B chỉ cho Single Entry transfer; full vault dùng file `.vaultbak`.
5. Virtual keyboard overflow -> `viewport-fit=cover`, `overflow-y-auto`, sticky action bar.

### Các bước thực thi nguyên tử:
- **Bước 1**: Nâng cấp giao diện React `src/` hỗ trợ Mobile (Bottom Navigation, responsive modal, Privacy Overlay, auto-lock grace period 60s).
- **Bước 2**: Tích hợp tính năng QR Code (Tạo QR trên Desktop, Quét QR trên Mobile cho Single Entry).
- **Bước 3**: Cấu hình backend Rust `src-tauri` tương thích Mobile (`#[cfg(not(mobile))]` cho single-instance, sửa local import).
- **Bước 4**: Khởi tạo cấu trúc Android (`npx tauri android init`) và thêm `FLAG_SECURE` trong `MainActivity.kt`.
- **Bước 5**: Viết test Vitest và Cargo test kiểm tra toàn bộ luồng.

---

## 8. Tiêu chí nghiệm thu BDD (Acceptance Criteria)

```gherkin
Feature: Android Vault Lifecycle & Security

  Scenario: Tạo và mở khóa Vault trên Android
    Given Ứng dụng Android chạy lần đầu và chưa có file vault.db
    When Người dùng tạo Master Password >= 8 ký tự
    Then Vault được mã hóa bằng SQLCipher + Argon2id
    And Chặn hoàn toàn tính năng chụp màn hình (FLAG_SECURE)

  Scenario: Tự động khóa sau Grace Period 60 giây
    Given Vault đang mở khóa trên thiết bị Android
    When Người dùng thu nhỏ app xuống nền
    Then Snapshot ở màn hình Recent Apps hiển thị màu đen hoặc bị làm mờ (0s)
    And Nếu người dùng quay lại trước 60 giây, vault vẫn mở
    And Nếu người dùng quay lại sau 60 giây, vault đã bị khóa và RAM đã zeroize

  Scenario: Chuyển dữ liệu qua mã QR mã hóa
    Given Desktop hiển thị mã QR mã hóa cho một mục mật khẩu
    When Ứng dụng Mobile quét mã QR và xác nhận nhập
    Then Mục mật khẩu mới được giải mã và thêm an toàn vào SQLite Mobile
```
