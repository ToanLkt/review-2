#!/usr/bin/env bash
# =====================================================================
# SmartFarm Backend - Setup local cho máy mới (1 lệnh chạy hết)
#
# Dùng: từ thư mục BackEnd chạy
#     ./scripts/setup-local.sh
# Script tự tạo các file secret bị gitignore (password.txt, .env.mqtt.local, .env)
# với giá trị dev local ĐÚNG, rồi dựng Docker (API + MySQL + MQTT).
#
# Idempotent: chạy lại nhiều lần an toàn — KHÔNG ghi đè file đã tồn tại.
# =====================================================================
set -euo pipefail

# Giá trị dev local — phải KHỚP với firmware ESP đã nạp (MQTT_PASSWORD).
MQTT_USER="smartfarm-backend"
MQTT_PASSWORD="smartfarm-local-mqtt-2026-change-me"
MQTT_INGEST_KEY="smartfarm-local-ingest-key-2026-change-me"

# Luôn chạy từ thư mục BackEnd (thư mục cha của scripts/).
cd "$(dirname "$0")/.."
echo "==> Thư mục làm việc: $(pwd)"

# --- 1) password.txt cho MQTT broker ---
if [ -f mqtt/config/password.txt ] && [ -s mqtt/config/password.txt ]; then
  echo "==> [1/4] mqtt/config/password.txt đã có — bỏ qua."
else
  echo "==> [1/4] Tạo mqtt/config/password.txt ..."
  # Xoá thư mục rỗng nếu Docker lỡ tạo nhầm khi mount file chưa tồn tại.
  [ -d mqtt/config/password.txt ] && rm -rf mqtt/config/password.txt
  mkdir -p mqtt/config
  docker run --rm -v "$(pwd)/mqtt/config":/c eclipse-mosquitto:2 \
    mosquitto_passwd -b -c /c/password.txt "$MQTT_USER" "$MQTT_PASSWORD"
  echo "    -> xong."
fi

# --- 2) .env.mqtt.local ---
if [ -f .env.mqtt.local ]; then
  echo "==> [2/4] .env.mqtt.local đã có — bỏ qua."
else
  echo "==> [2/4] Tạo .env.mqtt.local ..."
  cat > .env.mqtt.local <<EOF
Mqtt__Username=$MQTT_USER
Mqtt__Password=$MQTT_PASSWORD
Mqtt__IngestApiKey=$MQTT_INGEST_KEY
EOF
  echo "    -> xong."
fi

# --- 3) .env (JWT/SMTP/SePay) ---
if [ -f .env ]; then
  echo "==> [3/4] .env đã có — bỏ qua."
else
  echo "==> [3/4] Tạo .env từ .env.example ..."
  cp .env.example .env
  echo "    -> xong. (SMTP/SePay để trống => chạy chế độ log; điền sau nếu cần mail/thanh toán thật.)"
fi

# --- 4) Dựng Docker ---
echo "==> [4/4] docker compose up --build -d ..."
docker compose up --build -d

echo ""
echo "==> Trạng thái container:"
docker compose ps
echo ""
echo "Hoàn tất. API: http://localhost:5080/swagger | MQTT: localhost:1883 | MySQL: localhost:3307"
echo "Lưu ý: MQTT_PASSWORD='$MQTT_PASSWORD' phải khớp firmware ESP (MQTT_PASSWORD) để thiết bị kết nối."
