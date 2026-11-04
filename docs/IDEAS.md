# Future Ideas & Backlog (IDEAS.md)

Các tính năng và ý tưởng tiềm năng được bảo lưu để triển khai sau khi hoàn thành Phase 1 của Mobile Client.

---

## 1. Sinh trắc học (Biometric Authentication - Fingerprint / Face ID)

- **Mô tả**: Mở khóa vault nhanh bằng vân tay hoặc Face ID trên thiết bị di động.
- **Kiến trúc đề xuất**:
  - Mã hóa Encryption Key (hoặc Master Password) bằng khóa sinh trắc tạo bởi Hardware Keystore (Android Keystore / iOS Secure Enclave).
  - Yêu cầu xác thực sinh trắc `BiometricPrompt` để giải mã Encryption Key trong RAM.
  - Tự động hủy khóa Keystore khi người dùng đổi mật khẩu Vault hoặc reset biometric hệ thống.
- **Trạng thái**: Ý tưởng tiềm năng (Phase 2), không đưa vào Phase 1 để bảo toàn Zero-Knowledge tuyệt đối.

---

## 2. Dịch vụ Tự động điền hệ thống (OS Autofill Service)

- **Mô tả**: Tự động nhận diện ứng dụng / trang web trên mobile và gợi ý điền tên đăng nhập & mật khẩu.
- **Kiến trúc đề xuất**:
  - Android Autofill Service API / iOS AutoFill Extension.
  - Mở cổng IPC nội bộ giữa Autofill Service và Vault Core.
  - Yêu cầu Master Password hoặc Biometric trước khi nhả thông tin đăng nhập vào form.
- **Trạng thái**: Tách thành SPEC riêng ở Phase 2.

---

## 3. Đồng bộ mạng cục bộ không dây (Local Offline LAN Sync)

- **Mô tả**: Đồng bộ vault giữa Desktop và Mobile qua Wi-Fi nội bộ bằng giao thức mDNS / TLS cục bộ không cần internet.
- **Kiến trúc đề xuất**:
  - Mã hóa kênh truyền qua TLS với chứng chỉ tự ký sinh tại chỗ.
  - Xác thực ghép nối 2 thiết bị bằng mã PIN 6 số hoặc quét QR handshake.
- **Trạng thái**: Đang lưu trữ nghiên cứu.
