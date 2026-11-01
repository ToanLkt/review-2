/**
 * ======================================================================================
 * SMART FARM - ESP32-CAM FIRMWARE CHỤP & TẢI ẢNH KHAY RAU (SOIL TRAY CAMERA)
 * ======================================================================================
 * Module phần cứng: AI-Thinker ESP32-CAM (Camera OV2640)
 * Chức năng:
 *   1. Kết nối Wi-Fi trang trại.
 *   2. Khởi tạo camera OV2640 (độ phân giải SVGA 800x600, chất lượng cao).
 *   3. Định kỳ chụp ảnh khay rau.
 *   4. Gửi ảnh trực tiếp lên Backend ASP.NET Core qua HTTPS Multipart/form-data.
 *   5. Xác thực an toàn bằng Header "X-Device-Key".
 * ======================================================================================
 * HƯỚNG DẪN CÀI ĐẶT TRÊN ARDUINO IDE:
 *   1. Cài đặt ESP32 Board package (Tools -> Board -> Boards Manager -> tìm "esp32" bởi Espressif).
 *   2. Chọn Board: "AI Thinker ESP32-CAM".
 *   3. CPU Frequency: "240MHz (WiFi/BT)".
 *   4. Flash Frequency: "80MHz".
 *   5. Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)".
 *   6. Nối chân IO0 với GND khi nạp code, sau khi nạp xong rút IO0 ra và bấm RESET.
 * ======================================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>

// ======================================================================================
// 1. CẤU HÌNH THÔNG TIN THIẾT BỊ VÀ TRANG TRẠI
// ======================================================================================

// Wi-Fi
const char* WIFI_SSID     = "10.05";
const char* WIFI_PASSWORD = "13573333";

// Server API Backend SmartFarm
const char* SERVER_HOST   = "api.sumfas.id.vn";
const uint16_t SERVER_PORT = 443; // Cổng 443 cho HTTPS
const char* SERVER_PATH   = "/api/v1/iot/camera-snapshots/upload";

// Khóa API xác thực thiết bị (khớp với Mqtt__IngestApiKey trên server EC2)
const char* DEVICE_API_KEY = "a62fd05b923d4e547de7af643b3a5fec4b334dc15d6c9015";

// ID phần cứng camera trong cơ sở dữ liệu (CAM-A01 trên server có DeviceId = 2)
const int DEVICE_ID        = 2;

// ID phiên thuê khay của khách hàng (lấy từ thông tin đơn hàng / phiên thuê khay)
const int RENTAL_ID        = 1;

// Chu kỳ chụp ảnh (mặc định: 15 phút = 15 * 60 * 1000 ms)
// Khi thử nghiệm (demo/test), bạn có thể giảm xuống 30 * 1000 (30 giây)
const unsigned long CAPTURE_INTERVAL_MS = 15 * 60 * 1000;

// Flash LED pin trên ESP32-CAM (GPIO 4: đèn LED siêu sáng)
#define FLASH_LED_PIN 4

// Đèn báo nhỏ màu đỏ phía sau board (GPIO 33: Active LOW)
#define STATUS_LED_PIN 33

// ======================================================================================
// 2. ĐỊNH NGHĨA CHÂN PIN CAMERA CHO AI-THINKER ESP32-CAM
// ======================================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ======================================================================================
// BIẾN TOÀN CỤC
// ======================================================================================
unsigned long lastCaptureTime = 0;

// ======================================================================================
// KHỞI TẠO CAMERA
// ======================================================================================
bool initCamera() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer   = LEDC_TIMER_0;
    config.pin_d0       = Y2_GPIO_NUM;
    config.pin_d1       = Y3_GPIO_NUM;
    config.pin_d2       = Y4_GPIO_NUM;
    config.pin_d3       = Y5_GPIO_NUM;
    config.pin_d4       = Y6_GPIO_NUM;
    config.pin_d5       = Y7_GPIO_NUM;
    config.pin_d6       = Y8_GPIO_NUM;
    config.pin_d7       = Y9_GPIO_NUM;
    config.pin_xclk     = XCLK_GPIO_NUM;
    config.pin_pclk     = PCLK_GPIO_NUM;
    config.pin_vsync    = VSYNC_GPIO_NUM;
    config.pin_href     = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn     = PWDN_GPIO_NUM;
    config.pin_reset    = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Kiểm tra bộ nhớ PSRAM trên ESP32-CAM để chọn độ phân giải tối ưu
    if (psramFound()) {
        Serial.println("[Camera] Tim thay PSRAM. Su dung do phan giai SVGA (800x600).");
        config.frame_size   = FRAMESIZE_SVGA; // 800x600 (rất rõ nét cho khay rau mầm)
        config.jpeg_quality = 12;             // 10 - 63 (càng nhỏ ảnh càng nét, 12 là mức lý tưởng)
        config.fb_count     = 2;
        config.grab_mode    = CAMERA_GRAB_LATEST;
    } else {
        Serial.println("[Camera] Khong tim thay PSRAM. Ha xuong do phan giai VGA (640x480).");
        config.frame_size   = FRAMESIZE_VGA;
        config.jpeg_quality = 15;
        config.fb_count     = 1;
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[Camera] Khoi tao camera that bai! Ma loi: 0x%x\n", err);
        return false;
    }

    // Tinh chỉnh cảm biến camera để màu rau xanh rõ và không bị cháy sáng
    sensor_t* s = esp_camera_sensor_get();
    if (s != NULL) {
        s->set_brightness(s, 1);     // -2 đến 2
        s->set_contrast(s, 0);       // -2 đến 2
        s->set_saturation(s, 1);     // -2 đến 2 (tăng độ tươi màu xanh lá)
        s->set_whitebal(s, 1);       // Tự động cân bằng trắng
        s->set_awb_gain(s, 1);
        s->set_wb_mode(s, 0);        // Auto white balance
    }

    Serial.println("[Camera] Khoi tao module camera OV2640 thanh cong!");
    return true;
}

// ======================================================================================
// KẾT NỐI WI-FI
// ======================================================================================
void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.printf("\n[WiFi] Dang ket noi toi SSID: %s ...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Da ket noi thanh cong! IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WiFi] Ket noi that bai! Se thu lai o chu ky sau.");
    }
}

// ======================================================================================
// CHỤP ẢNH VÀ GỬI LÊN BACKEND (HTTP MULTIPART/FORM-DATA)
// ======================================================================================
bool captureAndUpload() {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[Upload] Bo qua vi chua co ket noi Wi-Fi.");
        return false;
    }

    // Bật đèn đỏ báo hiệu bắt đầu chụp
    digitalWrite(STATUS_LED_PIN, LOW);

    // Chụp ảnh từ sensor
    Serial.println("[Camera] Dang chup anh khay rau...");
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("[Camera] Chup anh that bai (khong lay duoc frame buffer)!");
        digitalWrite(STATUS_LED_PIN, HIGH);
        return false;
    }
    Serial.printf("[Camera] Chup thanh cong! Kich thuoc anh: %u bytes (%u KB)\n", fb->len, fb->len / 1024);

    // Kết nối an toàn HTTPS tới máy chủ
    WiFiClientSecure client;
    client.setInsecure(); // Bỏ qua kiểm tra chứng chỉ SSL root CA trên vi điều khiển
    client.setTimeout(15000); // Timeout 15 giây

    Serial.printf("[Upload] Dang ket noi toi %s:%d ...\n", SERVER_HOST, SERVER_PORT);
    if (!client.connect(SERVER_HOST, SERVER_PORT)) {
        Serial.println("[Upload] Loi: Khong the ket noi den may chu Backend!");
        esp_camera_fb_return(fb);
        digitalWrite(STATUS_LED_PIN, HIGH);
        return false;
    }

    // Xây dựng body chuẩn multipart/form-data
    String boundary = "----SmartFarmBoundary7MA4YWxkTrZu0gW";
    
    // Header các trường dữ liệu
    String head = "--" + boundary + "\r\n" +
                  "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n" +
                  String(DEVICE_ID) + "\r\n" +
                  "--" + boundary + "\r\n" +
                  "Content-Disposition: form-data; name=\"rentalId\"\r\n\r\n" +
                  String(RENTAL_ID) + "\r\n" +
                  "--" + boundary + "\r\n" +
                  "Content-Disposition: form-data; name=\"file\"; filename=\"snapshot.jpg\"\r\n" +
                  "Content-Type: image/jpeg\r\n\r\n";

    String tail = "\r\n--" + boundary + "--\r\n";

    uint32_t totalContentLength = head.length() + fb->len + tail.length();

    // Gửi HTTP Request Headers
    client.print("POST " + String(SERVER_PATH) + " HTTP/1.1\r\n");
    client.print("Host: " + String(SERVER_HOST) + "\r\n");
    client.print("X-Device-Key: " + String(DEVICE_API_KEY) + "\r\n");
    client.print("Content-Type: multipart/form-data; boundary=" + boundary + "\r\n");
    client.print("Content-Length: " + String(totalContentLength) + "\r\n");
    client.print("Connection: close\r\n\r\n");

    // 1. Gửi phần đầu (deviceId, rentalId, metadata)
    client.print(head);

    // 2. Gửi binary ảnh theo từng chunk 1024 bytes (tránh tràn RAM mạng của ESP32)
    uint8_t* fbBuf = fb->buf;
    size_t fbLen = fb->len;
    size_t chunkSize = 1024;
    size_t bytesSent = 0;

    Serial.print("[Upload] Dang truyen du lieu anh");
    while (bytesSent < fbLen) {
        size_t toSend = (fbLen - bytesSent > chunkSize) ? chunkSize : (fbLen - bytesSent);
        client.write(fbBuf + bytesSent, toSend);
        bytesSent += toSend;
        if (bytesSent % (chunkSize * 10) == 0) {
            Serial.print(".");
        }
    }
    Serial.println(" Xong!");

    // 3. Gửi phần cuối đóng form
    client.print(tail);
    client.flush();

    // Giải phóng bộ nhớ frame buffer sau khi gửi xong
    esp_camera_fb_return(fb);

    // Đọc phản hồi từ máy chủ Backend
    Serial.println("[Upload] Cho phan hoi tu Backend...");
    unsigned long waitStart = millis();
    while (client.connected() && !client.available()) {
        if (millis() - waitStart > 10000) {
            Serial.println("[Upload] Timeout cho phan hoi tu server!");
            client.stop();
            digitalWrite(STATUS_LED_PIN, HIGH);
            return false;
        }
        delay(10);
    }

    String responseStatus = client.readStringUntil('\n');
    Serial.printf("[Upload] Server Status: %s\n", responseStatus.c_str());

    bool success = false;
    if (responseStatus.indexOf("201") > 0 || responseStatus.indexOf("200") > 0) {
        Serial.println("[Upload] >>> DONG BO ANH KHAY RAU THANH CONG! <<<");
        success = true;
    } else {
        Serial.println("[Upload] Loi: Server tu choi anh! Chi tiet phan hoi:");
        while (client.available()) {
            String line = client.readStringUntil('\n');
            Serial.println(line);
        }
    }

    client.stop();
    digitalWrite(STATUS_LED_PIN, HIGH); // Tắt đèn báo
    return success;
}

// ======================================================================================
// SETUP
// ======================================================================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n\n=======================================================");
    Serial.println("  SMART FARM - HE THONG CAMERA THEO DOI KHAY RAU");
    Serial.println("=======================================================");

    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(FLASH_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, HIGH); // Tắt đèn LED đỏ
    digitalWrite(FLASH_LED_PIN, LOW);   // Tắt đèn Flash

    // Khởi tạo camera
    if (!initCamera()) {
        Serial.println("[Loi nghiem trong] Khong khoi dong duoc camera! Dừng chuong trinh.");
        while (true) {
            digitalWrite(STATUS_LED_PIN, LOW);
            delay(200);
            digitalWrite(STATUS_LED_PIN, HIGH);
            delay(200);
        }
    }

    // Kết nối Wi-Fi lần đầu
    connectWiFi();

    // Chụp ngay 1 tấm ảnh khi khởi động xong
    Serial.println("[Khoi dong] Tien hanh chup tam anh dau tien...");
    captureAndUpload();
    lastCaptureTime = millis();
}

// ======================================================================================
// LOOP
// ======================================================================================
void loop() {
    unsigned long currentMillis = millis();

    // Kiểm tra đã đến chu kỳ chụp ảnh tiếp theo chưa
    if (currentMillis - lastCaptureTime >= CAPTURE_INTERVAL_MS) {
        lastCaptureTime = currentMillis;
        Serial.println("\n[Dinh ky] Bat dau chu ky chup anh moi...");
        captureAndUpload();
    }

    delay(1000);
}
