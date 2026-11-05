# Hướng dẫn Chi tiết Cài đặt Android SDK & Môi trường Dev vào Ổ đĩa Khác C (D: hoặc E:)

Tài liệu này hướng dẫn chi tiết từng bước cho người mới bắt đầu phát triển ứng dụng di động trên Windows, đảm bảo **toàn bộ dữ liệu nặng** (Android Studio, SDK, NDK, Máy ảo Emulator, Gradle Cache) được lưu trên ổ đĩa tùy chọn (ví dụ: `D:\` hoặc `E:\`), **không làm tràn ổ C:**.

---

## 1. Phân bổ Dung lượng & Cấu trúc Thư mục

Android dev tiêu tốn dung lượng khá lớn (~15GB - 25GB):
- Android Studio IDE: ~3 GB
- Android SDK & NDK: ~10 GB - 15 GB
- Gradle Cache (tự tải thư viện khi build): ~3 GB - 5 GB
- Emulator AVD (nếu dùng máy ảo): ~5 GB - 10 GB / máy ảo

### Cấu trúc khuyến nghị (Ví dụ trên ổ `D:\`):
```
D:\
├── Android\
│   ├── AndroidStudio\     # Bộ cài phần mềm IDE
│   └── Sdk\               # Nơi chứa SDK, NDK, Command-line Tools
├── .gradle\               # Cache thư viện Gradle (chống phình C:)
└── .android\              # Dữ liệu máy ảo AVD (chống phình C:)
```
*(Nếu bạn muốn dùng ổ `E:\`, chỉ cần thay toàn bộ ký tự `D:` thành `E:`)*.

---

## 2. Bước 1: Tải và Cài đặt Android Studio

1. **Tải bộ cài**:
   - Truy cập trang chủ: https://developer.android.com/studio
   - Bấm **Download Android Studio** (file dạng `android-studio-*.exe`).

2. **Chạy file Setup**:
   - Khi chạy bộ cài, bấm **Next**.
   - Tại màn hình chọn **Components**: Giữ nguyên tích cả **Android Studio** và **Android Virtual Device**.
   - Tại màn hình **Configuration Settings (Install Location)**:
     - Mặc định là: `C:\Program Files\Android\Android Studio`
     - Bấm **Browse...** hoặc gõ đổi thành: `D:\Android\AndroidStudio`
   - Bấm **Install** và đợi cài đặt xong.

---

## 3. Bước 2: Thiết lập Lần đầu (Wizard) & Đổi Vị trí SDK

1. Khởi chạy **Android Studio** vừa cài.
2. Nếu hiện thông báo *"Import Android Studio Settings"*, chọn **Do not import settings** -> **OK**.
3. Tại màn hình Welcome: Bấm **Next**.
4. **CỰC KỲ QUAN TRỌNG - Chọn loại cài đặt**:
   - Chọn **Custom** (Tùy chỉnh) -> Bấm **Next**. *(Không chọn Standard)*.
5. Tại màn hình chọn **JDK location**: Giữ mặc định (Embedded JDK / JBR).
6. Tại màn hình **Select UI Theme**: Chọn Dark hoặc Light tùy thích -> Bấm **Next**.
7. **CỰC KỲ QUAN TRỌNG - Đổi vị trí SDK**:
   - Tại mục **Android SDK Location**:
     - Mặc định: `C:\Users\<Tên_Bạn>\AppData\Local\Android\Sdk`
     - Nhấp nút thư mục hoặc gõ đổi thành: `D:\Android\Sdk`
   - Tích chọn:
     - [x] **Android SDK**
     - [x] **Android SDK Platform**
     - [x] **Performance (Intel HAXM / Android Emulator Hypervisor)**
     - [x] **Android Virtual Device**
   - Bấm **Next**.
8. Màn hình **License Agreement**: Chọn từng mục (android-sdk-license, v.v.), tích **Accept** -> Bấm **Finish**.
9. Đợi quá trình tải về SDK vào `D:\Android\Sdk` hoàn tất.

---

## 4. Bước 3: Cài đặt NDK và Command-line Tools (Bắt buộc cho Tauri / Rust)

Tauri v2 biên dịch Rust thành file nhị phân `.so` chạy trên Android, do đó bắt buộc phải có **NDK** và **Command-line Tools**.

1. Tại màn hình chính của Android Studio (Welcome screen):
   - Bấm vào biểu tượng ba chấm **More Actions** (hoặc menu **Tools**) -> Chọn **SDK Manager**.
2. Chuyển sang tab **SDK Tools** (nằm ở cạnh tab *SDK Platforms*):
3. Tích chọn các mục sau:
   - [x] **Android SDK Command-line Tools (latest)** *(Bắt buộc)*
   - [x] **NDK (Side by side)** *(Bắt buộc cho Rust)*
   - [x] **Android SDK Build-Tools 34 (hoặc 35)**
   - [x] **Android SDK Platform-Tools**
4. Bấm nút **Apply** ở góc dưới bên phải.
5. Hiện pop-up xác nhận dung lượng tải -> Bấm **OK** và đợi tải xong vào `D:\Android\Sdk`.

---

## 5. Bước 4: Cấu hình Biến Môi Trường Tự Động (PowerShell Script)

Để hệ thống (và Tauri CLI) nhận biết SDK trên ổ D, đồng thời ép Gradle và Máy ảo không lưu vào ổ C, chạy script PowerShell dưới đây.

Mở **PowerShell** (Click chuột phải vào Start menu -> Chọn **Windows PowerShell** hoặc **Terminal**):

```powershell
# 1. Đặt biến môi trường Android SDK
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "D:\Android\Sdk", "User")

# 2. Tìm và đặt biến NDK_HOME tự động theo thư mục NDK vừa tải
$ndkPath = Get-ChildItem "D:\Android\Sdk\ndk" -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
if ($ndkPath) {
    [Environment]::SetEnvironmentVariable("NDK_HOME", $ndkPath, "User")
    Write-Host "Da cau hinh NDK_HOME: $ndkPath" -ForegroundColor Green
} else {
    Write-Host "Chua tim thay NDK trong D:\Android\Sdk\ndk. Hay kiem tra lai SDK Manager." -ForegroundColor Yellow
}

# 3. Chống tràn ổ C: Chuyển Gradle cache và Máy ảo AVD sang ổ D:
New-Item -ItemType Directory -Path "D:\.gradle" -Force | Out-Null
New-Item -ItemType Directory -Path "D:\.android\avd" -Force | Out-Null
[Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", "D:\.gradle", "User")
[Environment]::SetEnvironmentVariable("ANDROID_AVD_HOME", "D:\.android\avd", "User")

# 4. Đặt JAVA_HOME dùng JetBrains Runtime (JBR) đi kèm Android Studio
# (Tránh xung đột phiên bản JDK 25 với Gradle)
$jbrPath = "D:\Android\AndroidStudio\jbr"
if (Test-Path $jbrPath) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $jbrPath, "User")
    Write-Host "Da cau hinh JAVA_HOME dung JBR cua Android Studio" -ForegroundColor Green
}

# 5. Thêm platform-tools (adb) và cmdline-tools vào PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$addPaths = @(
    "D:\Android\Sdk\platform-tools",
    "D:\Android\Sdk\cmdline-tools\latest\bin"
)
$newPaths = @($userPath.Split(';') | Where-Object { $_ -ne "" })
foreach ($p in $addPaths) {
    if ($newPaths -notcontains $p) {
        $newPaths += $p
    }
}
[Environment]::SetEnvironmentVariable("Path", ($newPaths -join ';'), "User")
Write-Host "Hoan tat cau hinh bien moi truong!" -ForegroundColor Cyan
```

---

## 6. Bước 5: Cài đặt Rust Android Compilation Targets

Mở một cửa sổ PowerShell **mới hoàn toàn** (để cập nhật các biến môi trường vừa set) và chạy:

```powershell
rustup target add aarch64-linux-android armv7-linux-android i686-linux-android x86_64-linux-android
```
*Giải thích:*
- `aarch64-linux-android`: Dành cho hầu hết điện thoại Android hiện đại (ARM 64-bit).
- `armv7-linux-android`: Dành cho điện thoại Android đời cũ (32-bit).
- `x86_64-linux-android`: Dành cho máy ảo Android Emulator trên PC.

---

## 7. Bước 6: Kiểm tra Hoàn tất & Khởi tạo Android trong Dự án

1. Kiểm tra môi trường bằng cách gõ trong PowerShell:
```powershell
echo $env:ANDROID_HOME
# Phải in ra: D:\Android\Sdk

echo $env:NDK_HOME
# Phải in ra: D:\Android\Sdk\ndk\<version>

adb --version
# Phải in ra phiên bản Android Debug Bridge version 1.0.xx
```

2. Sau khi tất cả lệnh trên in ra chính xác, dự án sẵn sàng chạy lệnh khởi tạo:
```powershell
npx tauri android init
```
Lệnh này sẽ tạo thư mục native Android `src-tauri/gen/android/` sẵn sàng để build file `.apk`.
