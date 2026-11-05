# Hướng dẫn Cài đặt Android SDK & NDK vào Ổ đĩa Khác C (Ví dụ ổ D:)

Khi ổ C: bị đầy hoặc muốn cô lập môi trường dev sang ổ khác (ví dụ: `D:\`), thực hiện các bước sau:

---

## 1. Cấu trúc thư mục khuyến nghị trên ổ D:
Tạo sẵn các thư mục sau trên ổ D:
```
D:\
├── Android\
│   └── Sdk\           # Nơi chứa Android SDK, NDK, Command-line Tools
├── .gradle\           # Nơi lưu cache Gradle (tránh phình ổ C:)
└── .android\          # Nơi lưu Emulator / Máy ảo AVD (rất nặng, 10GB+)
```

---

## 2. Cài đặt Android Studio vào ổ D:
1. Tải bộ cài Android Studio từ: https://developer.android.com/studio
2. Khi chạy bộ cài, tại bước chọn thư mục cài đặt phần mềm:
   - Thay vì `C:\Program Files\Android\Android Studio`, chọn: `D:\Android\AndroidStudio`.
3. Mở Android Studio lần đầu:
   - Chọn kiểu cài đặt: **Custom** (Tùy chỉnh).
   - Tại màn hình chọn **Android SDK Location**: Đổi đường dẫn thành:
     `D:\Android\Sdk`
   - Tích chọn: **Android SDK**, **Android SDK Platform**, **Performance (Intel HAXM / Android Emulator Hypervisor Driver)**.
   - Bấm **Next** và hoàn tất tải về.

---

## 3. Cài bổ sung NDK và Command-line Tools (Bắt buộc cho Tauri)
1. Trong Android Studio, vào menu: **Tools** -> **SDK Manager**.
2. Chọn tab **SDK Tools**:
   - Tích chọn **Android SDK Command-line Tools (latest)**.
   - Tích chọn **NDK (Side by side)** (phiên bản $\ge 26.x$).
   - Tích chọn **Android SDK Build-Tools**.
   - Tích chọn **Android SDK Platform-Tools**.
3. Bấm **Apply** để tải vào `D:\Android\Sdk`.

---

## 4. Cấu hình Toàn bộ Biến Môi Trường (PowerShell Administrator)
Chạy script PowerShell sau (quyền Run as Administrator) để chuyển toàn bộ dữ liệu Android & Gradle sang ổ D:

```powershell
# 1. Đường dẫn SDK và NDK trên ổ D:
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "D:\Android\Sdk", "User")

$ndkDir = Get-ChildItem "D:\Android\Sdk\ndk" -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
if ($ndkDir) {
    [Environment]::SetEnvironmentVariable("NDK_HOME", $ndkDir, "User")
}

# 2. Chuyển thư mục Gradle và Máy ảo AVD sang ổ D: (giúp ổ C không bị phình)
[Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", "D:\.gradle", "User")
[Environment]::SetEnvironmentVariable("ANDROID_AVD_HOME", "D:\.android\avd", "User")

# 3. Thêm các công cụ Android vào PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$addPaths = "D:\Android\Sdk\platform-tools;D:\Android\Sdk\cmdline-tools\latest\bin"
if ($currentPath -notlike "*Android\Sdk\platform-tools*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$addPaths", "User")
}
```

---

## 5. Cài đặt Rust Targets & Kiểm tra hoàn tất
1. Mở một cửa sổ PowerShell mới:
```powershell
rustup target add aarch64-linux-android armv7-linux-android i686-linux-android x86_64-linux-android
```
2. Kiểm tra lại môi trường:
```powershell
adb --version
echo $env:ANDROID_HOME
```
Nếu `$env:ANDROID_HOME` in ra `D:\Android\Sdk`, bạn đã sẵn sàng chạy `npx tauri android init`.
