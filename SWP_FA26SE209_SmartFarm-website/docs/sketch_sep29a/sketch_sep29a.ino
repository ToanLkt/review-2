#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>
#include <time.h>

// =====================================================
// DEVICE
// =====================================================

// Mã thiết bị khớp với cơ sở dữ liệu trên server EC2
const char* DEVICE_CODE = "ESP32-A01";

// =====================================================
// WI-FI
// =====================================================

const char* WIFI_SSID = "10.05";
const char* WIFI_PASSWORD = "13573333";

// =====================================================
// MQTT
// =====================================================

// Domain server đã deploy (hoặc dùng IP 3.107.252.86)
const char* MQTT_HOST = "api.sumfas.id.vn";
const uint16_t MQTT_PORT = 1883;

const char* MQTT_USERNAME = "smartfarm-backend";
const char* MQTT_PASSWORD =
    "5ea49ed9551617612c3cdbdf03b6d08d";

// =====================================================
// NTP
// =====================================================

const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.google.com";

const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// =====================================================
// PIN
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22

#define SOIL_PIN 34

#define RELAY_FAN 13
#define RELAY_LED 14
#define RELAY_PUMP 18

// =====================================================
// RELAY LOGIC
// =====================================================

// Mạch hiện tại của bạn:
// GPIO HIGH = relay ON
// GPIO LOW  = relay OFF
const bool RELAY_ACTIVE_LOW = false;

const uint8_t RELAY_ON =
    RELAY_ACTIVE_LOW ? LOW : HIGH;

const uint8_t RELAY_OFF =
    RELAY_ACTIVE_LOW ? HIGH : LOW;

// =====================================================
// SOIL CALIBRATION
// =====================================================

// Giá trị đã đo:
// Khô khoảng 3415
// Ướt khoảng 1800
const int SOIL_DRY_RAW = 3415;
const int SOIL_WET_RAW = 1800;

// =====================================================
// AUTO CONTROL
// =====================================================

const bool AUTO_CONTROL_ENABLED = true;
const bool AUTO_PUMP_ENABLED = true;

// Quạt:
// Bật nếu nhiệt độ >= 32°C hoặc độ ẩm khí >= 85%.
// Tắt khi nhiệt độ <= 29°C và độ ẩm khí <= 78%.
const float FAN_TEMP_ON = 32.0;
const float FAN_TEMP_OFF = 29.0;

const float FAN_HUMIDITY_ON = 85.0;
const float FAN_HUMIDITY_OFF = 78.0;

// Đèn:
// Bật khi ánh sáng <= 1500 lux.
// Tắt khi ánh sáng >= 2000 lux.
const float LED_LIGHT_ON = 1500.0;
const float LED_LIGHT_OFF = 2000.0;

// Bơm:
// Bật khi độ ẩm đất <= 35%.
// Tắt nếu độ ẩm đất >= 45%.
const float PUMP_SOIL_ON = 35.0;
const float PUMP_SOIL_OFF = 45.0;

// Bơm chạy tối đa 60 giây.
const unsigned long MAX_PUMP_RUNTIME_MS =
    60UL * 1000UL;

// Nghỉ tối thiểu 10 giây giữa hai lần chạy.
const unsigned long MIN_PUMP_REST_MS =
    10UL * 1000UL;

// Test thủ công bơm trong 5 giây.
const unsigned long FORCE_PUMP_TEST_MS =
    5UL * 1000UL;

// =====================================================
// INTERVAL
// =====================================================

const unsigned long SENSOR_INTERVAL_MS =
    2000UL;

const unsigned long TELEMETRY_INTERVAL_MS =
    5000UL;

const unsigned long HEARTBEAT_INTERVAL_MS =
    30000UL;

const unsigned long WIFI_RETRY_INTERVAL_MS =
    10000UL;

const unsigned long MQTT_RETRY_INTERVAL_MS =
    5000UL;

// =====================================================
// OBJECTS
// =====================================================

Adafruit_SHT31 sht30 = Adafruit_SHT31();
BH1750 lightMeter;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// =====================================================
// SENSOR STATE
// =====================================================

float temperature = NAN;
float airHumidity = NAN;
float soilHumidity = NAN;
float lightIntensity = NAN;

int soilRaw = 0;

bool sht30Available = false;
bool bh1750Available = false;
bool soilSensorValid = false;

// =====================================================
// ACTUATOR STATE
// =====================================================

bool fanState = false;
bool ledState = false;
bool pumpState = false;

bool forcePumpTestActive = false;

unsigned long pumpStartedAt = 0;
unsigned long pumpStoppedAt = 0;
unsigned long forcePumpTestStartedAt = 0;

// =====================================================
// TIMER STATE
// =====================================================

unsigned long lastSensorTime = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastWiFiRetryTime = 0;
unsigned long lastMqttRetryTime = 0;

uint32_t messageCounter = 0;

// =====================================================
// MQTT TOPICS
// =====================================================

String telemetryTopic;
String heartbeatTopic;
String commandTopic;      // nhận lệnh điều khiển thủ công từ backend
String commandAckTopic;   // gửi xác nhận (ACK) kết quả thực thi lệnh về backend

// =====================================================
// MANUAL OVERRIDE
// =====================================================

// Khi staff gửi lệnh thủ công, tạm khóa điều khiển tự động cho thiết bị đó
// trong khoảng thời gian dưới đây để lệnh tay không bị automation ghi đè ngay.
// Hết thời gian này, thiết bị quay lại chạy tự động theo ngưỡng.
const unsigned long MANUAL_OVERRIDE_MS = 5UL * 60UL * 1000UL;  // 5 phút

unsigned long fanManualUntil = 0;
unsigned long ledManualUntil = 0;
unsigned long pumpManualUntil = 0;

bool isFanManual()  { return millis() < fanManualUntil; }
bool isLedManual()  { return millis() < ledManualUntil; }
bool isPumpManual() { return millis() < pumpManualUntil; }

// =====================================================
// RELAY CONTROL
// =====================================================

void setFan(bool enabled) {
  if (fanState == enabled) {
    return;
  }

  digitalWrite(
      RELAY_FAN,
      enabled ? RELAY_ON : RELAY_OFF
  );

  fanState = enabled;

  Serial.print("FAN -> ");
  Serial.println(enabled ? "ON" : "OFF");
}

void setLed(bool enabled) {
  if (ledState == enabled) {
    return;
  }

  digitalWrite(
      RELAY_LED,
      enabled ? RELAY_ON : RELAY_OFF
  );

  ledState = enabled;

  Serial.print("LED -> ");
  Serial.println(enabled ? "ON" : "OFF");
}

void stopPump() {
  if (!pumpState) {
    return;
  }

  digitalWrite(RELAY_PUMP, RELAY_OFF);

  pumpState = false;
  forcePumpTestActive = false;

  pumpStoppedAt = millis();

  Serial.println("PUMP -> OFF");
}

bool isPumpRestFinished() {
  if (pumpStoppedAt == 0) {
    return true;
  }

  return millis() - pumpStoppedAt >=
         MIN_PUMP_REST_MS;
}

unsigned long getPumpRestRemainingSeconds() {
  if (pumpStoppedAt == 0) {
    return 0;
  }

  unsigned long elapsed =
      millis() - pumpStoppedAt;

  if (elapsed >= MIN_PUMP_REST_MS) {
    return 0;
  }

  unsigned long remaining =
      MIN_PUMP_REST_MS - elapsed;

  return (remaining + 999UL) / 1000UL;
}

bool startPump(bool ignoreSoilCondition = false) {
  if (pumpState) {
    return false;
  }

  if (!ignoreSoilCondition) {
    if (!soilSensorValid || isnan(soilHumidity)) {
      Serial.println(
          "PUMP BLOCKED: soil sensor invalid"
      );

      return false;
    }
  }

  if (!isPumpRestFinished()) {
    Serial.print(
        "PUMP BLOCKED: rest remaining "
    );

    Serial.print(
        getPumpRestRemainingSeconds()
    );

    Serial.println(" seconds");

    return false;
  }

  // Quan trọng:
  // Chụp thời điểm bắt đầu trước khi bật trạng thái bơm.
  pumpStartedAt = millis();

  digitalWrite(RELAY_PUMP, RELAY_ON);
  pumpState = true;

  Serial.println("PUMP -> ON");

  Serial.print("Pump started at: ");
  Serial.println(pumpStartedAt);

  return true;
}

void startForcedPumpTest() {
  if (!startPump(true)) {
    return;
  }

  forcePumpTestActive = true;
  forcePumpTestStartedAt = millis();

  Serial.println(
      "PUMP FORCE TEST: running for 5 seconds"
  );
}

void allDevicesOff() {
  setFan(false);
  setLed(false);
  stopPump();
}

// =====================================================
// PUMP TIMER
// =====================================================

void checkPumpTimers() {
  if (!pumpState) {
    return;
  }

  // Luôn gọi millis() mới tại đây.
  // Không dùng biến now được lấy trước startPump().
  const unsigned long currentMillis =
      millis();

  if (
      forcePumpTestActive &&
      currentMillis - forcePumpTestStartedAt >=
          FORCE_PUMP_TEST_MS
  ) {
    Serial.println("PUMP FORCE TEST FINISHED");
    stopPump();
    return;
  }

  const unsigned long pumpElapsed =
      currentMillis - pumpStartedAt;

  if (pumpElapsed >= MAX_PUMP_RUNTIME_MS) {
    Serial.println("PUMP SAFETY TIMEOUT");
    stopPump();
  }
}

// =====================================================
// SOIL CALIBRATION
// =====================================================

float convertSoilToPercent(int rawValue) {
  if (SOIL_DRY_RAW == SOIL_WET_RAW) {
    return NAN;
  }

  float percent =
      ((float)(SOIL_DRY_RAW - rawValue) * 100.0) /
      ((float)(SOIL_DRY_RAW - SOIL_WET_RAW));

  return constrain(percent, 0.0, 100.0);
}

// =====================================================
// SENSOR READING
// =====================================================

void readSensors() {
  if (sht30Available) {
    float newTemperature =
        sht30.readTemperature();

    float newHumidity =
        sht30.readHumidity();

    if (!isnan(newTemperature)) {
      temperature = newTemperature;
    } else {
      Serial.println(
          "ERROR: SHT30 temperature failed"
      );
    }

    if (!isnan(newHumidity)) {
      airHumidity = newHumidity;
    } else {
      Serial.println(
          "ERROR: SHT30 humidity failed"
      );
    }
  }

  if (bh1750Available) {
    float newLight =
        lightMeter.readLightLevel();

    if (newLight >= 0) {
      lightIntensity = newLight;
    } else {
      Serial.println(
          "ERROR: BH1750 reading failed"
      );
    }
  }

  soilRaw = analogRead(SOIL_PIN);

  // ADC ESP32 12-bit: 0–4095.
  soilSensorValid =
      soilRaw > 50 &&
      soilRaw < 4090;

  if (soilSensorValid) {
    soilHumidity =
        convertSoilToPercent(soilRaw);
  } else {
    soilHumidity = NAN;

    // Dừng bơm khi mất cảm biến.
    if (!forcePumpTestActive) {
      stopPump();
    }

    Serial.println(
        "ERROR: soil sensor disconnected"
    );
  }
}

// =====================================================
// AUTOMATIC CONTROL
// =====================================================

void runAutomaticControl() {
  if (!AUTO_CONTROL_ENABLED) {
    return;
  }

  // Không để điều khiển tự động can thiệp
  // trong lúc test bơm thủ công.
  if (forcePumpTestActive) {
    return;
  }

  // -----------------------------
  // FAN
  // -----------------------------

  // Bỏ qua điều khiển tự động nếu staff vừa gửi lệnh tay cho quạt.
  if (
      !isFanManual() &&
      !isnan(temperature) &&
      !isnan(airHumidity)
  ) {
    if (
        !fanState &&
        (
          temperature >= FAN_TEMP_ON ||
          airHumidity >= FAN_HUMIDITY_ON
        )
    ) {
      setFan(true);
    }

    if (
        fanState &&
        temperature <= FAN_TEMP_OFF &&
        airHumidity <= FAN_HUMIDITY_OFF
    ) {
      setFan(false);
    }
  }

  // -----------------------------
  // LED
  // -----------------------------

  // Bỏ qua điều khiển tự động nếu staff vừa gửi lệnh tay cho đèn.
  if (!isLedManual() && !isnan(lightIntensity)) {
    if (
        !ledState &&
        lightIntensity <= LED_LIGHT_ON
    ) {
      setLed(true);
    }

    if (
        ledState &&
        lightIntensity >= LED_LIGHT_OFF
    ) {
      setLed(false);
    }
  }

  // -----------------------------
  // PUMP
  // -----------------------------

  if (!AUTO_PUMP_ENABLED) {
    return;
  }

  // Bỏ qua điều khiển tự động nếu staff vừa gửi lệnh tay cho bơm.
  if (isPumpManual()) {
    return;
  }

  if (
      !soilSensorValid ||
      isnan(soilHumidity)
  ) {
    return;
  }

  if (
      pumpState &&
      soilHumidity >= PUMP_SOIL_OFF
  ) {
    Serial.println(
        "PUMP STOPPED: soil moisture reached target"
    );

    stopPump();
    return;
  }

  if (
      !pumpState &&
      soilHumidity <= PUMP_SOIL_ON
  ) {
    startPump(false);
  }
}

// =====================================================
// SERIAL OUTPUT
// =====================================================

void printSensors() {
  Serial.println();
  Serial.println("====== SENSOR DATA ======");

  Serial.print("Device       : ");
  Serial.println(DEVICE_CODE);

  Serial.print("Temperature  : ");

  if (isnan(temperature)) {
    Serial.println("N/A");
  } else {
    Serial.print(temperature, 1);
    Serial.println(" C");
  }

  Serial.print("Air humidity : ");

  if (isnan(airHumidity)) {
    Serial.println("N/A");
  } else {
    Serial.print(airHumidity, 1);
    Serial.println(" %");
  }

  Serial.print("Light        : ");

  if (isnan(lightIntensity)) {
    Serial.println("N/A");
  } else {
    Serial.print(lightIntensity, 0);
    Serial.println(" lux");
  }

  Serial.print("Soil raw     : ");
  Serial.println(soilRaw);

  Serial.print("Soil humidity: ");

  if (isnan(soilHumidity)) {
    Serial.println("N/A");
  } else {
    Serial.print(soilHumidity, 1);
    Serial.println(" %");
  }

  Serial.println("-------- ACTUATORS --------");

  Serial.print("Fan          : ");
  Serial.println(fanState ? "ON" : "OFF");

  Serial.print("LED          : ");
  Serial.println(ledState ? "ON" : "OFF");

  Serial.print("Pump         : ");
  Serial.println(pumpState ? "ON" : "OFF");

  if (pumpState) {
    unsigned long elapsed =
        (millis() - pumpStartedAt) / 1000UL;

    Serial.print("Pump elapsed : ");
    Serial.print(elapsed);
    Serial.print(" / ");
    Serial.print(
        MAX_PUMP_RUNTIME_MS / 1000UL
    );
    Serial.println(" seconds");
  }

  Serial.print("Wi-Fi        : ");

  Serial.println(
      WiFi.status() == WL_CONNECTED
          ? "CONNECTED"
          : "DISCONNECTED"
  );

  Serial.print("MQTT         : ");

  Serial.println(
      mqttClient.connected()
          ? "CONNECTED"
          : "DISCONNECTED"
  );

  Serial.println("===========================");
}

// =====================================================
// TIME
// =====================================================

bool isTimeSynchronized() {
  return time(nullptr) > 1700000000;
}

String currentUtcIso() {
  time_t currentTime = time(nullptr);

  struct tm timeInfo;
  gmtime_r(&currentTime, &timeInfo);

  char buffer[25];

  strftime(
      buffer,
      sizeof(buffer),
      "%Y-%m-%dT%H:%M:%SZ",
      &timeInfo
  );

  return String(buffer);
}

String createMessageId() {
  messageCounter++;

  uint64_t chipId =
      ESP.getEfuseMac();

  char buffer[96];

  snprintf(
      buffer,
      sizeof(buffer),
      "%s-%04X-%lu-%lu",
      DEVICE_CODE,
      (uint16_t)(chipId & 0xFFFF),
      (unsigned long)time(nullptr),
      (unsigned long)messageCounter
  );

  return String(buffer);
}

// =====================================================
// WI-FI
// =====================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("Connecting Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  unsigned long currentMillis =
      millis();

  if (
      currentMillis - lastWiFiRetryTime <
      WIFI_RETRY_INTERVAL_MS
  ) {
    return;
  }

  lastWiFiRetryTime = currentMillis;
  connectWiFi();
}

// =====================================================
// MQTT
// =====================================================

void connectMqtt() {
  if (
      WiFi.status() != WL_CONNECTED ||
      mqttClient.connected()
  ) {
    return;
  }

  Serial.print("Connecting MQTT: ");
  Serial.print(MQTT_HOST);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  String clientId =
      String(DEVICE_CODE) +
      "-" +
      String(
          (uint32_t)ESP.getEfuseMac(),
          HEX
      );

  bool connected = mqttClient.connect(
      clientId.c_str(),
      MQTT_USERNAME,
      MQTT_PASSWORD
  );

  if (connected) {
    Serial.println("MQTT -> CONNECTED");

    // Đăng ký nhận lệnh điều khiển thủ công từ backend.
    bool subscribed =
        mqttClient.subscribe(commandTopic.c_str());

    Serial.print("Subscribe command topic: ");
    Serial.print(commandTopic);
    Serial.print(" -> ");
    Serial.println(subscribed ? "OK" : "FAILED");
  } else {
    Serial.print("MQTT failed, state: ");
    Serial.println(mqttClient.state());
  }
}

void maintainMqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  unsigned long currentMillis =
      millis();

  if (
      currentMillis - lastMqttRetryTime <
      MQTT_RETRY_INTERVAL_MS
  ) {
    return;
  }

  lastMqttRetryTime = currentMillis;
  connectMqtt();
}

// =====================================================
// MQTT PUBLISH
// =====================================================

void publishTelemetry() {
  if (
      !mqttClient.connected() ||
      !isTimeSynchronized()
  ) {
    return;
  }

  StaticJsonDocument<512> document;

  document["messageId"] =
      createMessageId();

  document["deviceCode"] =
      DEVICE_CODE;

  document["recordedAt"] =
      currentUtcIso();

  if (!isnan(temperature)) {
    document["temperature"] =
        temperature;
  }

  if (!isnan(airHumidity)) {
    document["airHumidity"] =
        airHumidity;
  }

  if (!isnan(soilHumidity)) {
    document["soilHumidity"] =
        soilHumidity;
  }

  if (!isnan(lightIntensity)) {
    document["lightIntensity"] =
        lightIntensity;
  }

  document["fanState"]  = fanState;
  document["ledState"]  = ledState;
  document["pumpState"] = pumpState;


  char payload[512];

  size_t length = serializeJson(
      document,
      payload,
      sizeof(payload)
  );

  bool success = mqttClient.publish(
      telemetryTopic.c_str(),
      (uint8_t*)payload,
      length,
      false
  );

  Serial.print("Telemetry publish: ");
  Serial.println(
      success ? "OK" : "FAILED"
  );

  if (success) {
    Serial.println(payload);
  }
}

void publishHeartbeat() {
  if (
      !mqttClient.connected() ||
      !isTimeSynchronized()
  ) {
    return;
  }

  StaticJsonDocument<192> document;

  document["deviceCode"] =
      DEVICE_CODE;

  document["recordedAt"] =
      currentUtcIso();

  char payload[192];

  size_t length = serializeJson(
      document,
      payload,
      sizeof(payload)
  );

  bool success = mqttClient.publish(
      heartbeatTopic.c_str(),
      (uint8_t*)payload,
      length,
      false
  );

  Serial.print("Heartbeat publish: ");
  Serial.println(
      success ? "OK" : "FAILED"
  );
}

// =====================================================
// COMMAND ACK (gửi kết quả thực thi lệnh về backend)
// =====================================================

void publishCommandAck(
    const char* commandId,
    bool success,
    const char* failureReason
) {
  if (!mqttClient.connected()) {
    return;
  }

  StaticJsonDocument<256> document;

  document["commandId"] = commandId;
  document["deviceCode"] = DEVICE_CODE;
  document["result"] =
      success ? "SUCCESS" : "FAILED";

  // Backend chấp nhận failureReason rỗng khi thành công.
  document["failureReason"] =
      (failureReason != nullptr) ? failureReason : "";

  document["acknowledgedAt"] =
      isTimeSynchronized()
          ? currentUtcIso()
          : "";

  char payload[256];

  size_t length = serializeJson(
      document,
      payload,
      sizeof(payload)
  );

  bool published = mqttClient.publish(
      commandAckTopic.c_str(),
      (uint8_t*)payload,
      length,
      false
  );

  Serial.print("Command ACK publish: ");
  Serial.println(
      published ? "OK" : "FAILED"
  );

  if (published) {
    Serial.println(payload);
  }
}

// =====================================================
// MQTT COMMAND CALLBACK (nhận lệnh điều khiển thủ công)
// =====================================================

// Payload backend gửi xuống (topic .../commands):
//   {
//     "commandId": "...",
//     "deviceCode": "ESP32-TRAY-01",
//     "actuatorType": "VENTILATION_FAN | LED_LIGHT | WATER_PUMP",
//     "action": "ON | OFF",
//     "requestedAt": "..."
//   }
void onMqttMessage(
    char* topic,
    byte* payload,
    unsigned int length
) {
  Serial.print("MQTT message on topic: ");
  Serial.println(topic);

  // Hiện chỉ xử lý topic lệnh điều khiển.
  if (commandTopic != String(topic)) {
    return;
  }

  StaticJsonDocument<384> document;

  DeserializationError error =
      deserializeJson(document, payload, length);

  if (error) {
    Serial.print("Command JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  const char* commandId =
      document["commandId"] | "";

  const char* actuatorType =
      document["actuatorType"] | "";

  const char* action =
      document["action"] | "";

  Serial.print("Command received -> actuator: ");
  Serial.print(actuatorType);
  Serial.print(", action: ");
  Serial.print(action);
  Serial.print(", id: ");
  Serial.println(commandId);

  if (strlen(commandId) == 0) {
    Serial.println("Command bỏ qua: thiếu commandId");
    return;
  }

  bool wantOn = (strcmp(action, "ON") == 0);
  bool wantOff = (strcmp(action, "OFF") == 0);

  if (!wantOn && !wantOff) {
    publishCommandAck(
        commandId,
        false,
        "action khong hop le (chi chap nhan ON/OFF)"
    );
    return;
  }

  bool success = false;
  String failureReason = "";

  // -----------------------------
  // FAN
  // -----------------------------
  if (strcmp(actuatorType, "VENTILATION_FAN") == 0) {
    setFan(wantOn);
    fanManualUntil = millis() + MANUAL_OVERRIDE_MS;
    success = true;
  }
  // -----------------------------
  // LED
  // -----------------------------
  else if (strcmp(actuatorType, "LED_LIGHT") == 0) {
    setLed(wantOn);
    ledManualUntil = millis() + MANUAL_OVERRIDE_MS;
    success = true;
  }
  // -----------------------------
  // PUMP
  // -----------------------------
  else if (strcmp(actuatorType, "WATER_PUMP") == 0) {
    if (wantOn) {
      // ignoreSoilCondition = true: lệnh tay bỏ qua điều kiện độ ẩm đất,
      // nhưng vẫn tôn trọng thời gian nghỉ an toàn của bơm.
      bool started = startPump(true);

      if (started) {
        success = true;
      } else {
        success = false;
        failureReason =
            "bom chua san sang (dang chay hoac dang trong thoi gian nghi)";
      }
    } else {
      stopPump();
      success = true;
    }

    pumpManualUntil = millis() + MANUAL_OVERRIDE_MS;
  }
  // -----------------------------
  // Không nhận dạng được
  // -----------------------------
  else {
    publishCommandAck(
        commandId,
        false,
        "actuatorType khong ho tro"
    );
    return;
  }

  publishCommandAck(
      commandId,
      success,
      success ? "" : failureReason.c_str()
  );
}

// =====================================================
// SERIAL CONTROL
// =====================================================

void showMenu() {
  Serial.println();
  Serial.println("====== CONTROL ======");
  Serial.println("1 = Fan ON");
  Serial.println("2 = Fan OFF");
  Serial.println("3 = LED ON");
  Serial.println("4 = LED OFF");
  Serial.println("5 = Pump ON normally");
  Serial.println("6 = Pump OFF");
  Serial.println("7 = All OFF");
  Serial.println("8 = Force-test pump 5 seconds");
  Serial.println("r = Read sensors");
  Serial.println("t = Publish telemetry");
  Serial.println("m = Show menu");
  Serial.println("=====================");
}

void handleSerial() {
  if (!Serial.available()) {
    return;
  }

  char command = Serial.read();

  if (
      command == '\n' ||
      command == '\r'
  ) {
    return;
  }

  switch (command) {
    case '1':
      setFan(true);
      break;

    case '2':
      setFan(false);
      break;

    case '3':
      setLed(true);
      break;

    case '4':
      setLed(false);
      break;

    case '5':
      startPump(false);
      break;

    case '6':
      stopPump();
      break;

    case '7':
      allDevicesOff();
      break;

    case '8':
      startForcedPumpTest();
      break;

    case 'r':
    case 'R':
      readSensors();
      printSensors();
      break;

    case 't':
    case 'T':
      publishTelemetry();
      break;

    case 'm':
    case 'M':
      showMenu();
      break;

    default:
      Serial.println("Unknown command");
      break;
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("===============================");
  Serial.println(" SMARTFARM ESP32 PUMP-TIMER-V2");
  Serial.println("===============================");

  // Đặt mức OFF trước khi chuyển chân thành OUTPUT,
  // giúp giảm relay chớp lúc khởi động.
  digitalWrite(RELAY_FAN, RELAY_OFF);
  digitalWrite(RELAY_LED, RELAY_OFF);
  digitalWrite(RELAY_PUMP, RELAY_OFF);

  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_LED, OUTPUT);
  pinMode(RELAY_PUMP, OUTPUT);

  digitalWrite(RELAY_FAN, RELAY_OFF);
  digitalWrite(RELAY_LED, RELAY_OFF);
  digitalWrite(RELAY_PUMP, RELAY_OFF);

  fanState = false;
  ledState = false;
  pumpState = false;
  forcePumpTestActive = false;

  pinMode(SOIL_PIN, INPUT);

  analogReadResolution(12);

  analogSetPinAttenuation(
      SOIL_PIN,
      ADC_11db
  );

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);

  sht30Available =
      sht30.begin(0x44);

  Serial.print("SHT30: ");

  Serial.println(
      sht30Available
          ? "OK"
          : "NOT FOUND"
  );

  bh1750Available =
      lightMeter.begin(
          BH1750::CONTINUOUS_HIGH_RES_MODE,
          0x23,
          &Wire
      );

  Serial.print("BH1750: ");

  Serial.println(
      bh1750Available
          ? "OK"
          : "NOT FOUND"
  );

  telemetryTopic =
      "smartfarm/devices/" +
      String(DEVICE_CODE) +
      "/telemetry";

  heartbeatTopic =
      "smartfarm/devices/" +
      String(DEVICE_CODE) +
      "/heartbeat";

  commandTopic =
      "smartfarm/devices/" +
      String(DEVICE_CODE) +
      "/commands";

  commandAckTopic =
      "smartfarm/devices/" +
      String(DEVICE_CODE) +
      "/command-acks";

  mqttClient.setServer(
      MQTT_HOST,
      MQTT_PORT
  );

  // Đăng ký callback nhận lệnh trước khi connect.
  mqttClient.setCallback(onMqttMessage);

  mqttClient.setBufferSize(768);
  mqttClient.setKeepAlive(30);

  connectWiFi();

  unsigned long waitStarted =
      millis();

  while (
      WiFi.status() != WL_CONNECTED &&
      millis() - waitStarted < 15000UL
  ) {
    delay(250);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected, IP: ");
    Serial.println(WiFi.localIP());

    configTime(
        GMT_OFFSET_SEC,
        DAYLIGHT_OFFSET_SEC,
        NTP_SERVER_1,
        NTP_SERVER_2
    );

    connectMqtt();
  } else {
    Serial.println(
        "Wi-Fi unavailable; continuing offline"
    );
  }

  readSensors();
  runAutomaticControl();
  printSensors();
  showMenu();

  unsigned long currentMillis =
      millis();

  lastSensorTime = currentMillis;
  lastTelemetryTime = currentMillis;
  lastHeartbeatTime = currentMillis;
}

// =====================================================
// LOOP
// =====================================================

void loop() {
  handleSerial();

  maintainWiFi();
  maintainMqtt();

  // Kiểm tra timeout bằng millis() mới.
  // Đây là phần sửa lỗi chu kỳ bơm thứ hai.
  checkPumpTimers();

  unsigned long currentMillis =
      millis();

  if (
      currentMillis - lastSensorTime >=
      SENSOR_INTERVAL_MS
  ) {
    lastSensorTime = currentMillis;

    readSensors();
    runAutomaticControl();

    // Sau khi runAutomaticControl() có thể vừa bật bơm,
    // checkPumpTimers() sẽ dùng millis() mới ở vòng sau.
    printSensors();
  }

  if (
      currentMillis - lastTelemetryTime >=
      TELEMETRY_INTERVAL_MS
  ) {
    lastTelemetryTime = currentMillis;
    publishTelemetry();
  }

  if (
      currentMillis - lastHeartbeatTime >=
      HEARTBEAT_INTERVAL_MS
  ) {
    lastHeartbeatTime = currentMillis;
    publishHeartbeat();
  }
}