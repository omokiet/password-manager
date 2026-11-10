# BIÊN BẢN NGHIỆM THU ĐẶC TẢ KỸ THUẬT (SPEC ACCEPTANCE RECORD)

- **Mã Đặc Tả**: `SPEC-002`
- **Tên Tính Năng**: Sao lưu & Khôi phục Mã hóa qua Google Drive (`Google Drive Encrypted Cloud Backup`)
- **Ngày lập**: 10/11/2026
- **Trạng thái**: `APPROVED & ACCEPTED`

---

## 1. Nhật ký Quyết định Thiết kế (Decision Log)

| Quyết định | Nội dung đã chốt | Lý do kỹ thuật |
| :--- | :--- | :--- |
| **Không gian lưu trữ** | Thư mục ẩn (`appDataFolder` / `drive.appdata`) | Cách ly hoàn toàn với giao diện web Google Drive của người dùng, loại trừ rủi ro xóa nhầm file cơ sở dữ liệu. |
| **Cơ chế sao lưu** | Thủ công 1-chạm (On-Demand) | Người dùng chủ động kiểm soát thời điểm backup; không lo nghẽn mạng nền, không lo xung đột dữ liệu đa thiết bị (zero split-brain). |
| **Quy ước đặt tên file** | `vault_backup_YYYYMMDD_HHmmss.vaultbak` | Mỗi lần sao lưu tạo 1 bản riêng biệt có mốc thời gian, người dùng có thể rollback về các thời điểm khác nhau. |
| **Phương thức xác thực** | OAuth 2.0 PKCE với Client ID tích hợp sẵn | Người dùng 1-chạm đăng nhập không cần kiến thức lập trình; có màn hình hướng dẫn in-app giải thích bước vượt cảnh báo của Google. |

---

## 2. Cam kết Bảo mật (Security & Zero-Knowledge Invariants)

1. **Nguyên tắc Zero-Knowledge không đổi**: 
   - Mã hóa diễn ra 100% tại client trước khi đẩy qua mạng.
   - Google Drive chỉ nhận các khối byte đã mã hóa (`.vaultbak`), hoàn toàn không có Master Password và không thể giải mã dữ liệu người dùng.
2. **Không có máy chủ trung gian**:
   - Client giao tiếp HTTPS trực tiếp với API chính thức của Google, loại trừ rủi ro bị can thiệp bởi bên thứ ba (Man-in-the-Middle / Relay eavesdropping).
3. **Quy trình Khôi phục Nguyên tử (Atomic Restore)**:
   - Dữ liệu tải về từ Cloud được xác thực tính toàn vẹn (integrity check) và tạo file `.bak` dự phòng cục bộ trước khi hoán đổi file chính.

---

## 3. Phê duyệt & Chuyển giao Thực thi (Sign-off)

- **Đại diện Sản phẩm (System Owner)**: Đã chấp thuận phương án Thư mục ẩn và Client ID tích hợp có hướng dẫn.
- **Kỹ sư Trưởng (Lead Agent)**: Đã hoàn tất tài liệu đặc tả [`docs/specs/SPEC-002-google-drive-backup.md`](file:///d:/repositary/password-manager/docs/specs/SPEC-002-google-drive-backup.md) và phân tích toàn bộ Edge Cases.
- **Kết luận**: Đặc tả đạt chuẩn Spec-Driven Development, chính thức chuyển sang giai đoạn sẵn sàng thực thi (Ready for Implementation).
