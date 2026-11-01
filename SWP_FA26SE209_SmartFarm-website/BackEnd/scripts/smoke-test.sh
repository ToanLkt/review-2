#!/usr/bin/env bash
set -euo pipefail
base="${SMARTFARM_URL:-http://localhost:5080/api/v1}"
email="smoke-$(date +%s)@test.com"
json='Content-Type: application/json'

register=$(curl -fsS -X POST "$base/auth/register" -H "$json" \
  -d "{\"email\":\"$email\",\"password\":\"Test@12345\",\"fullName\":\"Smoke Test\"}")
echo "$register" | grep -q '"success":true'

login=$(curl -fsS -X POST "$base/auth/login" -H "$json" -H 'X-Request-Id: smoke-test' \
  -d "{\"email\":\"$email\",\"password\":\"Test@12345\"}")
access=$(echo "$login" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["tokens"]["accessToken"])')
refresh=$(echo "$login" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["tokens"]["refreshToken"])')

curl -fsS -X POST "$base/auth/refresh-token" -H "$json" \
  -d "{\"refreshToken\":\"$refresh\"}" | grep -q '"success":true'
curl -fsS "$base/seed-varieties?sort=-price&page=1&pageSize=2&fields=seedVarietyId,name,rentalPricePerTray" \
  | grep -q '"totalPages"'
curl -fsS -H 'Accept: application/xml' "$base/seed-varieties/1" | grep -q '<ApiResponse'
[[ $(curl -sS -o /dev/null -w '%{http_code}' -H 'Accept: application/yaml' "$base/seed-varieties/1") == 406 ]]
[[ $(curl -sS -o /dev/null -w '%{http_code}' "$base/rentals") == 401 ]]
[[ $(curl -sS -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $access" "$base/admin/users") == 403 ]]
echo "SmartFarm Lab 1-2 smoke test passed."
