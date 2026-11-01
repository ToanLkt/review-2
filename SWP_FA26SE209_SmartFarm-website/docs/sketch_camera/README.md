# Hướng dẫn nạp Firmware ESP32-CAM (Smart Farm Camera)

Thư mục này chứa mã nguồn firmware Arduino dành cho module **AI-Thinker ESP32-CAM (cảm biến OV2640)** để chụp ảnh khay rau mầm định kỳ và gửi thẳng lên máy chủ Backend Smart Farm qua HTTPS.

---

## 1. Chuẩn bị phần cứng

1. **Module:** AI-Thinker ESP32-CAM kèm mắt camera OV2640.
2. **Mạch nạp USB-to-TTL (FTDI232 hoặc CP2102):**
   - Chuyển jumper mạch nạp sang mức **5V**.
   - Nối dây theo bảng sau:

| Chân ESP32-CAM | Chân Mạch nạp FTDI | Chú thích |
| :--- | :--- | :--- |
| **5V** | **5V / VCC** | Cần nguồn đủ 5V 2A |
| **GND** | **GND** | Nối chung mass |
| **U0R (GPIO 3)** | **TXD** | Chéo chân RX-TX |
| **U0T (GPIO 1)** | **RXD** | Chéo chân TX-RX |
| **IO0 (GPIO 0)** | **GND** | **Nối GND khi NẠP CODE**, rút ra khi CHẠY |

---

## 2. Cài đặt trên Arduino IDE

1. **Thêm board ESP32 vào Arduino IDE:**
   - Mở Arduino IDE -> `Settings / Preferences`.
   - Tại ô *Additional boards manager URLs*, thêm link:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Vào `Tools` -> `Board` -> `Boards Manager`, tìm kiếm `esp32` của *Espressif Systems* và bấm **Install**.

2. **Cấu hình thông số nạp:**
   - **Board:** `AI Thinker ESP32-CAM`
   - **CPU Frequency:** `240MHz (WiFi/BT)`
   - **Flash Frequency:** `80MHz`
   - **Flash Mode:** `QIO`
   - **Partition Scheme:** `Huge APP (3MB No OTA/1MB SPIFFS)` *(Bắt buộc chọn cái này để đủ dung lượng chứa thư viện camera)*
   - **Port:** Chọn cổng COM / tty của mạch nạp.

---

## 3. Cấu hình code trước khi nạp

Mở file [`sketch_camera.ino`](./sketch_camera.ino) và sửa các thông số ở mục 1:

```cpp
// 1. Wi-Fi
const char* WIFI_SSID     = "Ten_WiFi_Nha_Ban";
const char* WIFI_PASSWORD = "Mat_Khau_WiFi";

// 2. Server API
const char* SERVER_HOST   = "api.sumfas.id.vn";
const uint16_t SERVER_PORT = 443;
const char* SERVER_PATH   = "/api/v1/iot/camera-snapshots/upload";

// 3. Khóa bảo mật (khớp với Mqtt__IngestApiKey trên server)
const char* DEVICE_API_KEY = "dien_key_tai_day";

// 4. Định danh phần cứng & phiên thuê
const int DEVICE_ID        = 1;  // ID của camera trong hệ thống
const int RENTAL_ID        = 1;  // ID đợt thuê khay của khách hàng

// 5. Chu kỳ chụp (mặc định 15 phút, khi test có thể chỉnh 30 giây)
const unsigned long CAPTURE_INTERVAL_MS = 15 * 60 * 1000;
```

---

## 4. Các bước nạp code và vận hành

1. Nối dây **IO0 với GND**.
2. Cắm cáp USB vào máy tính, bấm nút **Reset (RST)** trên mặt sau ESP32-CAM một cái để vào chế độ Flash mode.
3. Trên Arduino IDE, bấm nút **Upload** (Mũi tên sang phải).
4. Đợi quá trình ghi Flash đạt 100% (`Leaving... Hard resetting via RTS pin...`):
   - **Rút dây IO0 khỏi GND.**
   - Bấm nút **Reset (RST)** trên board.
5. Mở **Serial Monitor** trên Arduino IDE, chọn tốc độ baud **115200** để xem log kết nối Wi-Fi, chụp ảnh và phản hồi từ Server.

---

## 5. Bảng mã phản hồi từ Server Backend

| Mã HTTP | Ý nghĩa | Cách khắc phục |
| :--- | :--- | :--- |
| **201 Created** | Tải ảnh thành công | Ảnh đã được lưu và sinh URL vào database |
| **401 Unauthorized** | Sai `X-Device-Key` | Kiểm tra lại `DEVICE_API_KEY` trong code |
| **404 Not Found** | Không tìm thấy `rentalId` hoặc `deviceId` | Kiểm tra xem ID có tồn tại trong DB không |
| **409 Conflict** | Camera chưa được gán vào khay của đợt thuê | Staff cần gọi API `POST /staff/iot/tray-devices` để liên kết Camera với khay của đợt thuê này |
| **413 Payload Too Large** | Ảnh vượt quá 5MB | Đảm bảo độ phân giải trong code không quá SVGA (800x600) |
