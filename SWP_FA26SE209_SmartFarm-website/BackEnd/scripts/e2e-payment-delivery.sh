#!/usr/bin/env bash
set -euo pipefail

base="${SMARTFARM_URL:-http://localhost:5080/api/v1}"
db_container="${SMARTFARM_DB_CONTAINER:-smartfarm-mysql}"
db_name="${SMARTFARM_DB_NAME:-smartfarm}"
db_user="${SMARTFARM_DB_USER:-smartfarm}"
db_password="${SMARTFARM_DB_PASSWORD:-smartfarm}"
api_container="${SMARTFARM_API_CONTAINER:-smartfarm-api}"
staff_email="${SMARTFARM_STAFF_EMAIL:-staff@smartfarm.local}"
staff_password="${SMARTFARM_STAFF_PASSWORD:-Admin@12345}"
admin_email="${SMARTFARM_ADMIN_EMAIL:-admin@smartfarm.local}"
admin_password="${SMARTFARM_ADMIN_PASSWORD:-Admin@12345}"
json_header='Content-Type: application/json'
run_id="$(date +%s)"
customer_email="e2e-${run_id}@smartfarm.local"
customer_password='E2eTest@12345'
transaction_seed="$((run_id * 10))"

fail() { printf 'E2E FAILED: %s\n' "$*" >&2; exit 1; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1' ($3)"; }
db() { docker exec "$db_container" mysql -N -B -u"$db_user" -p"$db_password" "$db_name" -e "$1" 2>/dev/null; }
api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-fsS -X "$method" "$base$path" -H "$json_header")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(-d "$body")
  curl "${args[@]}"
}
login() {
  api POST /auth/login '' "{\"email\":\"$1\",\"password\":\"$2\"}" | jq -er '.data.tokens.accessToken'
}
create_order() {
  api POST /orders/seed-packets "$customer_token" \
    '{"seedVarietyId":1,"quantity":1,"shippingAddress":"E2E SmartFarm"}'
}
create_payment() { api POST "/payments/orders/$1" "$customer_token"; }
send_webhook() {
  local id="$1" amount="$2" content="$3" code_json="${4:-null}"
  local timestamp signature payload
  timestamp="$(date +%s)"
  payload="$(jq -cn --argjson id "$id" --argjson amount "$amount" --arg content "$content" --argjson code "$code_json" \
    --arg date "$(date '+%Y-%m-%d %H:%M:%S')" \
    '{id:$id,gateway:"TPBank",transactionDate:$date,accountNumber:"E2E",code:$code,content:$content,transferType:"in",transferAmount:$amount,referenceCode:("E2E"+($id|tostring))}')"
  signature="$(printf '%s.%s' "$timestamp" "$payload" | openssl dgst -sha256 -hmac "$webhook_secret" -hex | awk '{print "sha256=" $2}')"
  curl -fsS -X POST "$base/payments/sepay/webhook" -H "$json_header" \
    -H "X-SePay-Timestamp: $timestamp" -H "X-SePay-Signature: $signature" --data-binary "$payload"
}

command -v jq >/dev/null || fail 'jq is required'
command -v openssl >/dev/null || fail 'openssl is required'
docker inspect "$api_container" >/dev/null 2>&1 || fail "API container '$api_container' not found"
docker inspect "$db_container" >/dev/null 2>&1 || fail "DB container '$db_container' not found"
webhook_secret="$(docker inspect "$api_container" --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^SePay__WebhookSecret=//p')"
[[ -n "$webhook_secret" ]] || fail 'SePay__WebhookSecret is missing in API container'

printf '[1/14] Preparing customer, stock and staff...\n'
db "UPDATE Supplies SET UnitPrice=2000, QuantityInStock=GREATEST(QuantityInStock,20), IsActive=1 WHERE SupplyID=1;"
api POST /auth/register '' "{\"email\":\"$customer_email\",\"password\":\"$customer_password\",\"fullName\":\"E2E Customer $run_id\"}" >/dev/null
db "UPDATE Users SET EmailConfirmed=1, EmailConfirmToken=NULL, EmailConfirmTokenExpiresAt=NULL WHERE Email='$customer_email';"
customer_token="$(login "$customer_email" "$customer_password")"
staff_token="$(login "$staff_email" "$staff_password")"
admin_token="$(login "$admin_email" "$admin_password")"
staff_id="$(db "SELECT UserID FROM Users WHERE Email='$staff_email' LIMIT 1;")"
[[ -n "$staff_id" ]] || fail 'staff user not found'

printf '[2/14] Creating successful SEED_PACKET order and payment...\n'
success_order="$(create_order)"
success_order_id="$(jq -er '.data.orderId' <<<"$success_order")"
success_code="$(jq -er '.data.orderCode' <<<"$success_order")"
assert_eq "$(jq -r '.data.totalAmount == 2000' <<<"$success_order")" 'true' 'order amount'
assert_eq "$(jq -r '.data.status' <<<"$success_order")" 'AWAITING_PAYMENT' 'initial order status'
assert_eq "$(jq -r '.data.status' <<<"$(create_payment "$success_order_id")")" 'PENDING' 'initial payment status'

printf '[3/14] Sending valid HMAC webhook and checking duplicate protection...\n'
success_webhook="$(send_webhook "$((transaction_seed + 1))" 2000 "bank transfer $success_code")"
assert_eq "$(jq -r '.data.result' <<<"$success_webhook")" 'NONE' 'successful webhook result'
duplicate="$(send_webhook "$((transaction_seed + 1))" 2000 "bank transfer $success_code")"
assert_eq "$(jq -r '.data.duplicate' <<<"$duplicate")" 'true' 'duplicate webhook'
assert_eq "$(db "SELECT COUNT(*) FROM PaymentWebhookEvents WHERE SePayTransactionID=$((transaction_seed + 1));")" '1' 'webhook event uniqueness'
assert_eq "$(db "SELECT OrderStatus FROM Orders WHERE OrderID=$success_order_id;")" 'CONFIRMED' 'paid order status'
assert_eq "$(db "SELECT PaymentStatus FROM Payments WHERE OrderID=$success_order_id;")" 'SUCCESS' 'payment status'

printf '[4/14] Checking UNDERPAID...\n'
under_order="$(create_order)"; under_id="$(jq -er '.data.orderId' <<<"$under_order")"; under_code="$(jq -er '.data.orderCode' <<<"$under_order")"
create_payment "$under_id" >/dev/null
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 2))" 1000 "$under_code")")" 'UNDERPAID' 'underpayment'

printf '[5/14] Checking OVERPAID...\n'
over_order="$(create_order)"; over_id="$(jq -er '.data.orderId' <<<"$over_order")"; over_code="$(jq -er '.data.orderCode' <<<"$over_order")"
create_payment "$over_id" >/dev/null
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 3))" 3000 "$over_code")")" 'OVERPAID' 'overpayment'

printf '[6/14] Checking REFERENCE_MISMATCH...\n'
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 4))" 2000 'NO VALID ORDER CODE')")" 'REFERENCE_MISMATCH' 'reference mismatch'

printf '[7/14] Checking LATE payment...\n'
late_order="$(create_order)"; late_id="$(jq -er '.data.orderId' <<<"$late_order")"; late_code="$(jq -er '.data.orderCode' <<<"$late_order")"
create_payment "$late_id" >/dev/null
db "UPDATE Orders SET ExpiresAt=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE OrderID=$late_id;"
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 5))" 2000 "$late_code")")" 'LATE' 'late payment'

printf '[8/14] Checking UNMATCHED and ORDER_STATE_MISMATCH...\n'
unmatched_code="SP0000000000000000000"
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 6))" 2000 "$unmatched_code")")" 'UNMATCHED' 'unmatched order'
assert_eq "$(jq -r '.data.result' <<<"$(send_webhook "$((transaction_seed + 7))" 2000 "$success_code")")" 'ORDER_STATE_MISMATCH' 'order state mismatch'
assert_eq "$(db "SELECT PaymentStatus FROM Payments WHERE OrderID=$success_order_id;")" 'SUCCESS' 'successful payment must not be downgraded'

printf '[9/14] Checking Staff/Admin/Customer authorization...\n'
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' "$base/staff/payments/exceptions")" '401' 'missing token'
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' "$base/staff/payments/exceptions" -H "Authorization: Bearer $customer_token")" '403' 'customer forbidden'
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' "$base/staff/payments/exceptions" -H "Authorization: Bearer $staff_token")" '200' 'staff authorized'
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' "$base/staff/payments/report" -H "Authorization: Bearer $admin_token")" '200' 'admin authorized'

printf '[10/14] Checking exception list, pagination and staff note...\n'
exceptions="$(api GET '/staff/payments/exceptions?page=1&pageSize=3' "$staff_token")"
assert_eq "$(jq -r '.data.items|length' <<<"$exceptions")" '3' 'exception page size'
under_event_id="$(api GET '/staff/payments/exceptions?page=1&pageSize=100' "$staff_token" | jq -er --argjson tx "$((transaction_seed + 2))" '.data.items[]|select(.sePayTransactionId==$tx)|.eventId')"
noted="$(api PUT "/staff/payments/$under_event_id/note" "$staff_token" '{"note":"E2E reviewed underpayment"}')"
assert_eq "$(jq -r '.data.staffNote' <<<"$noted")" 'E2E reviewed underpayment' 'staff note'
assert_eq "$(jq -r '.data.reviewedByUserId' <<<"$noted")" "$staff_id" 'reviewer id'
[[ "$(jq -r '.data.reviewedAt' <<<"$noted")" != null ]] || fail 'ReviewedAt was not recorded'
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$base/staff/payments/$under_event_id/note" -H "$json_header" -H "Authorization: Bearer $customer_token" -d '{"note":"forbidden"}')" '403' 'customer cannot review exception'

printf '[11/14] Checking payment report and invalid date range...\n'
report="$(api GET /staff/payments/report "$staff_token")"
[[ "$(jq -r '.data.totalTransactions' <<<"$report")" -ge 7 ]] || fail 'report transaction count is too small'
[[ "$(jq -r '.data.exceptions' <<<"$report")" -ge 6 ]] || fail 'report exception count is too small'
for exception_type in UNDERPAID OVERPAID REFERENCE_MISMATCH LATE UNMATCHED ORDER_STATE_MISMATCH; do
  [[ "$(jq -r --arg key "$exception_type" '.data.exceptionsByType[$key] // 0' <<<"$report")" -ge 1 ]] || fail "report is missing $exception_type"
done
assert_eq "$(curl -sS -o /dev/null -w '%{http_code}' "$base/staff/payments/report?from=2030-01-02T00:00:00Z&to=2030-01-01T00:00:00Z" -H "Authorization: Bearer $staff_token")" '400' 'invalid report date range'

printf '[12/14] Creating delivery and assigning shipper...\n'
delivery="$(api POST /staff/deliveries "$staff_token" "{\"orderId\":$success_order_id,\"rentalId\":null,\"recipientName\":\"E2E Receiver\",\"recipientPhone\":\"0900000000\",\"shippingAddress\":\"E2E SmartFarm\",\"notes\":\"automated test\"}")"
delivery_id="$(jq -er '.data.deliveryId' <<<"$delivery")"
assigned="$(api PUT "/staff/deliveries/$delivery_id/shipper" "$staff_token" "{\"shipperId\":$staff_id}")"
assert_eq "$(jq -r '.data.shipperId' <<<"$assigned")" "$staff_id" 'assigned shipper'

printf '[13/14] Running PACKAGED -> SHIPPING -> DELIVERED...\n'
packaged="$(api PATCH "/staff/deliveries/$delivery_id" "$staff_token" '{"status":"PACKAGED","trackingCode":"E2E-TRACK","actualWeightKg":1.25,"notes":"packed"}')"
assert_eq "$(jq -r '.data.status' <<<"$packaged")" 'PACKAGED' 'packaged status'
shipping="$(api PATCH "/staff/deliveries/$delivery_id" "$staff_token" '{"status":"SHIPPING","trackingCode":null,"actualWeightKg":null,"notes":"shipping"}')"
assert_eq "$(jq -r '.data.status' <<<"$shipping")" 'SHIPPING' 'shipping status'
delivered="$(api PATCH "/staff/deliveries/$delivery_id" "$staff_token" '{"status":"DELIVERED","trackingCode":null,"actualWeightKg":null,"notes":"delivered"}')"
assert_eq "$(jq -r '.data.status' <<<"$delivered")" 'DELIVERED' 'delivered status'
[[ "$(jq -r '.data.shippedAt' <<<"$delivered")" != null ]] || fail 'ShippedAt was not recorded'
[[ "$(jq -r '.data.deliveredAt' <<<"$delivered")" != null ]] || fail 'DeliveredAt was not recorded'

printf '[14/14] Verifying completed order and exception records...\n'
assert_eq "$(db "SELECT OrderStatus FROM Orders WHERE OrderID=$success_order_id;")" 'COMPLETED' 'completed order'
assert_eq "$(db "SELECT COUNT(*) FROM PaymentWebhookEvents WHERE SePayTransactionID BETWEEN $((transaction_seed + 1)) AND $((transaction_seed + 7));")" '7' 'all webhook scenarios persisted once'

unset webhook_secret customer_token staff_token admin_token
printf 'E2E PASSED: order=%s payment=SUCCESS delivery=%s orderStatus=COMPLETED\n' "$success_order_id" "$delivery_id"
