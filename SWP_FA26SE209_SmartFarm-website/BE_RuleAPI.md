## Hướng dẫn Khởi động Backend (Dành cho Local)

Để chạy API trên máy cá nhân, bạn cần có Docker Desktop và .NET 8 SDK.

1. **Bật Docker Desktop** (chờ đến khi icon Docker hiện màu xanh/trạng thái "running").
2. Mở Terminal / Command Prompt, trỏ vào thư mục chứa code Backend (nơi có file `docker-compose.yml`):
   ```bash
   cd SWP_FA26SE209_SmartFarm/BackEnd
   ```
3. Khởi động MySQL database và API container:
   ```bash
   docker compose up -d
   ```
   **Máy mới clone/pull về:** file `.env` KHÔNG nằm trong git (chứa secret), nên phải tự tạo. Dễ nhất là copy từ file mẫu rồi điền giá trị:

   ```bash
   cp .env.example .env   # sau đó mở .env điền các giá trị thật
   ```

   Nội dung `.env` cần có (ví dụ):

   ```env
   JWT_SECRET=local-development-secret-key-change-before-production
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASSWORD=
   SMTP_FROM_NAME=SmartFarm

   SEPAY_WEBHOOK_SECRET=<HMAC secret lấy từ cấu hình webhook SePay>
   SEPAY_BANK_NAME=TPBank
   SEPAY_BANK_ACCOUNT_NUMBER=<số tài khoản nhận tiền>
   SEPAY_ACCOUNT_NAME=<tên chủ tài khoản đúng theo ngân hàng>
   ```

   `.env` đã được Git bỏ qua. Không commit HMAC secret, mật khẩu SMTP, JWT secret hoặc thông tin nhạy cảm vào repository.

   > **Muốn test chức năng GỬI MAIL trên máy khác:** phải điền `SMTP_USER` + `SMTP_PASSWORD` trong `.env` (App Password Gmail). Các giá trị secret dùng chung (email gửi, app password, SePay secret) **chia sẻ qua kênh riêng của nhóm** (chat riêng/trình quản lý mật khẩu), KHÔNG đẩy lên git. Nếu để trống, hệ thống chạy chế độ log (in OTP/token ra terminal) thay vì gửi mail thật.
   > **Gửi Email thật (Forgot Password / Confirm Email)**: Nếu không truyền `SMTP_USER`/`SMTP_PASSWORD`, hệ thống tự động
   > chuyển sang chế độ log (in mã OTP/Token ra terminal, xem mục 2.3 bên dưới). Muốn gửi email thật, thêm 2 biến này
   > vào trước lệnh (App Password lấy tại `myaccount.google.com/apppasswords`, cần bật 2FA trước):
   > ```bash
   > JWT_SECRET='...' \
   > SMTP_USER='your-email@gmail.com' \
   > SMTP_PASSWORD='xxxxxxxxxxxxxxxx' \
   > docker compose up -d
   > ```
4. Kiểm tra trạng thái:
   ```bash
   docker compose ps
   ```
   *Đợi đến khi thấy `smartfarm-mysql` hiện trạng thái `(healthy)` và `smartfarm-api` báo `Up`.*
5. API giờ đã sẵn sàng tại:
   - Base URL: `http://localhost:5080/api/v1`
   - Giao diện Swagger: `http://localhost:5080/swagger`

> **Ghi chú**: Nếu API đổi code hoặc có migration mới, chạy lệnh:
> `docker compose up --build -d api`

### Backend public, ngrok và domain

- Backend hiện chủ yếu chạy local tại `http://localhost:5080`; chưa có domain production cố định.
- ngrok chỉ là đường hầm HTTPS tạm thời phục vụ demo và nhận webhook SePay. Máy của Thành phải bật Docker, Backend và tiến trình ngrok thì URL mới hoạt động.
- Khi cần test qua Internet, demo Swagger hoặc test webhook SePay bằng ngrok, **liên hệ Thành để mở server/ngrok**.
- Nếu không liên hệ được Thành hoặc server đang tắt, hãy đợi đến khi dự án có domain Backend chính thức; không xem URL ngrok là endpoint production.
- URL ngrok có thể thay đổi sau khi tạo tunnel mới. Nếu URL thay đổi, phải cập nhật URL webhook trên SePay thành:

  ```text
  https://<ngrok-domain-hoặc-domain-chính-thức>/api/v1/payments/sepay/webhook
  ```

- Không chạy đồng thời nhiều tunnel cho cùng webhook nếu chưa xác định tunnel nào đang trỏ tới Backend đúng.
- Không đưa ngrok authtoken, SePay HMAC secret hoặc nội dung `.env` lên Git, chat công khai hay tài liệu dùng chung.

---
# SmartFarm Backend - Hướng dẫn chạy và gọi API

Tài liệu này mô tả các API Backend hiện tại đang chạy tại `http://localhost:5080/api/v1`.
Để xem Swagger đầy đủ, mở trình duyệt: `http://localhost:5080/swagger`.

## 0. Workflow tổng quan (FE đọc trước khi code)

### 0.1. Đăng ký -> Xác nhận Email -> Đăng nhập

```
[Màn hình Đăng ký]
      |
      v
POST /auth/register  (email, password, fullName, phone, address)
      |
      +--> 409 Conflict -> Email đã đăng ký (hoặc đã đăng ký nhưng chưa xác nhận).
      |
      v
  201 Created -> chuyển sang màn hình Báo thành công (Yêu cầu check mail).
                  Tài khoản tạo ra CÓ ISACTIVE = TRUE nhưng EMAILCONFIRMED = FALSE.
      |
      v
[User check mail, lấy link hoặc mã Token]
      |
      v
POST /auth/confirm-email  (email, token)
      |
      +--> 400 Bad Request -> Sai token hoặc token hết hạn.
      |
      v
  200 OK -> EmailConfirmed = true -> Chuyển sang màn hình Đăng nhập.
      |
      v
POST /auth/login  (email, password)
      |
      +--> 403 Forbidden -> Trả về lỗi: "Email not confirmed..." nếu user nhảy cóc chưa confirm.
      |
      v
  200 OK -> nhận { tokens: { accessToken, refreshToken, expiresAt }, user }
      |
      v
  Lưu accessToken + refreshToken vào bộ nhớ FE. Mọi API sau đó cần Header:
  Authorization: Bearer <accessToken>

  Đối tượng `user` trong response (login, profile, quản lý user) gồm: `userId`, `email`, `fullName`,
  `phone`, `address`, `role`, `isActive`, `emailConfirmed`, `createdAt`, `avatarUrl` (có thể null),
  `updatedAt` (có thể null — thời điểm hồ sơ user được cập nhật gần nhất; backend tự cập nhật mỗi khi sửa user).
```

- **Gửi lại mail xác nhận**: Nếu user mất mail, cung cấp nút "Gửi lại" gọi API `POST /auth/resend-confirm-email` (có cooldown 60s chống spam).

### 0.2. Refresh Token (giữ phiên đăng nhập)

```
[Request bất kỳ trả 401]
      |
      v
POST /auth/refresh-token  (refreshToken)
      |
      +--> 200 OK -> nhận cặp token mới, lưu lại, gọi lại request cũ
      |
      +--> 401 Unauthorized -> refreshToken cũng hết hạn/bị revoke -> xóa token, về Login
```

- Mỗi lần refresh, `refreshToken` cũ bị vô hiệu hóa (rotate), FE phải luôn lưu token MỚI nhất.

### 0.3. Đổi mật khẩu (Change Password - khi đã đăng nhập)

```
[Màn hình Cài đặt tài khoản]
      |
      v
POST /auth/change-password  (Header: Bearer accessToken)
      (currentPassword, newPassword)
      |
      +--> 400 Bad Request -> "Current password is incorrect" -> báo lỗi tại chỗ
      |
      +--> 200 OK -> mọi token cũ (kể cả accessToken hiện tại) bị vô hiệu hóa (TokenVersion tăng)
                      |
                      v
                FE phải: xóa token cũ -> điều hướng về Login -> user đăng nhập lại
```

### 0.4. Quên mật khẩu (Forgot Password - chưa đăng nhập)

```
[Màn hình Quên mật khẩu - Bước 1: nhập email]
      |
      v
POST /auth/forgot-password  (email)
      |
      +--> Server chỉ gửi mail lấy mã nếu Email Tồn Tại & Đã Xác Nhận (EmailConfirmed = true).
      |    Có rate limit 60s chống spam.
      v
  202 Accepted (Luôn trả về y hệt dù email đúng/sai/chưa confirm, không lộ thông tin)
      |
      v
[Màn hình nhập mã OTP + mật khẩu mới]
  (User check email, lấy mã OTP 6 số, VD: 204156, hết hạn sau 15 phút)
      |
      v
POST /auth/reset-password  (email, resetToken: "204156", newPassword)
      |
      +--> 400 Bad Request -> "Invalid or expired reset token" -> cho nhập lại mã
      |
      +--> 200 OK -> đổi mật khẩu thành công (Mọi thiết bị khác văng) -> chuyển sang màn hình Login
```

- FE nên giới hạn ô nhập `resetToken` chỉ cho 6 ký tự số để tránh gõ nhầm.
- Backend không có API "gửi lại mã" riêng; muốn gửi lại thì gọi lại `forgot-password` (mã mới ghi đè mã cũ, sau khi hết 60s cooldown).

### 0.5. Admin quản lý tài khoản

```
[Đăng nhập bằng tài khoản ADMIN]
      |
      v
GET /admin/users?search=&role=&isActive=&page=1&pageSize=20
      |
      v
  [Danh sách user] --click chi tiết--> GET /admin/users/{id}
      |
      +--> [Tạo Staff] --> POST /admin/users/staff
      |
      +--> [Sửa hồ sơ] --> PUT /admin/users/{id}/profile
      |
      +--> [Nút khóa/mở khóa] --> PUT /admin/users/{id}/status  (isActive: false)
      |
      +--> [Đổi vai trò]      --> PUT /admin/users/{id}/role    (role: "STAFF")
```

- Khóa tài khoản hoặc đổi role làm user đó bị revoke token ngay lập tức.
- Không thể tự khóa/đổi role chính tài khoản admin đang đăng nhập (server trả `400`).
- `POST /admin/users/staff` nhận `email`, `fullName`, `temporaryPassword`, `phoneNumber`, `address`; tài khoản được xác nhận email sẵn và có role `STAFF`.
- `PUT /admin/users/{id}/profile` chỉ cập nhật họ tên, số điện thoại và địa chỉ; không tự đổi email, role hoặc mật khẩu.
- RBAC hiện dùng ba role cố định trong `enum.md`; dự án chưa yêu cầu permission động theo từng action.

### 0.6. Thuê khay (Tray Rental - Customer)

Có **hai cách** thuê khay:

**(a) Thuê nhanh 1 khay** — `POST /rentals` tạo đơn ngay với đúng 1 khay.

```
[Màn hình Browse - không cần đăng nhập]
      |
      v
GET /seed-varieties?search=&sort=&page=&pageSize=   (xem danh sách hạt giống)
GET /trays/available?farmAreaId=&expand=farmArea    (xem khay còn trống)
      |
      v
[User bấm "Thuê ngay" -> yêu cầu đăng nhập nếu chưa có token]
      |
      v
POST /rentals  (Header: Bearer accessToken, role CUSTOMER)
      (seedVarietyId, quantity=1, farmAreaId?)
      |
      +--> 400 -> quantity chỉ được là 1 (thuê nhiều khay dùng Giỏ hàng)
      +--> 404 -> farmAreaId không tồn tại/không active
      +--> 409 -> không còn khay trống -> "available": <số khay còn lại>
      +--> 201 -> tạo đơn (khay được khóa ngay, đơn AWAITING_PAYMENT)
                  -> GET /rentals/{id}
```

**(b) Giỏ hàng nhiều khay** — chọn từng khay (1 khay + 1 loại hạt mỗi lần) rồi checkout 1 đơn. Xem mục 0.6.1.

- `GET /rentals?page=&pageSize=` dùng cho màn hình "Lịch sử thuê của tôi".
- **Lưu ý:** `quantity` của `POST /rentals` chỉ nhận giá trị **1**. Muốn thuê nhiều khay, dùng Giỏ hàng.

### 0.6.1. Giỏ hàng thuê khay (Cart → Checkout - Customer)

Mô hình: mỗi lần chọn **1 khay + 1 loại hạt** → thêm vào giỏ; lặp lại cho khay khác; giỏ **tính tổng**; **checkout tạo 1 đơn** gồm nhiều khay rồi thanh toán 1 lần. Giỏ thuê khay **tách riêng** khỏi luồng mua hạt (SEED_PACKET) — không trộn chung một đơn.

Quan trọng về giữ khay (reservation): **khay CHỈ bị khóa khi checkout**, không khóa lúc thêm giỏ. Nếu tới lúc checkout mà không đủ khay trống → trả `409`.

```
[Chọn khay + hạt] --(lặp nhiều lần)--> POST /cart/items  (seedVarietyId, farmAreaId?)
      |
      v
GET /cart  -> xem giỏ + tổng tạm tính (subtotal + careFeeTotal + deliveryFee = total)
      |
      +--> DELETE /cart/items/{cartItemId}   (bỏ 1 dòng)
      +--> DELETE /cart                      (xóa cả giỏ)
      |
      v
POST /cart/checkout
      |
      +--> 400 -> giỏ rỗng
      +--> 409 -> không đủ khay trống lúc checkout
      +--> 201 -> tạo 1 đơn TRAY_RENTAL (AWAITING_PAYMENT), mỗi khay = 1 rental
                  -> GET /rentals/{id} hoặc /orders/{id}
```

**Endpoints (role CUSTOMER, cần Bearer token):**

- `GET /api/v1/cart` — xem giỏ.
- `POST /api/v1/cart/items` — thêm 1 khay: body `{ "seedVarietyId": 1, "farmAreaId": 2 }` (`farmAreaId` tùy chọn; null = tự chọn khu bất kỳ).
- `DELETE /api/v1/cart/items/{cartItemId}` — bỏ 1 dòng.
- `DELETE /api/v1/cart` — xóa cả giỏ.
- `POST /api/v1/cart/checkout` — tạo đơn từ giỏ.

**Cấu trúc `data` của `GET /cart` và `POST /cart/items`:**

```json
{
  "cartId": 5,
  "items": [
    { "cartItemId": 10, "seedVarietyId": 1, "seedVarietyName": "Rau muống mầm",
      "farmAreaId": 2, "farmAreaName": "Khu A", "quantity": 1,
      "rentalPrice": 20000, "careFee": 0, "lineTotal": 20000, "addedAt": "..." }
  ],
  "itemCount": 1,
  "subtotal": 20000,
  "careFeeTotal": 0,
  "deliveryFee": 0,
  "total": 20000
}
```

> `careFee`/`careFeeTotal`/`deliveryFee` = 0 khi chưa cấu hình `PricingRule` tương ứng. Cách tính phí đầy đủ (CARE_FEE theo mỗi khay, DELIVERY_FEE 1 lần/đơn) được mô tả ở mục Pricing.

### 0.7. Order và Rental hoàn chỉnh

Đơn thuê khay và đơn mua hạt giống là hai loại riêng biệt:

- `TRAY_RENTAL`: tạo bằng `POST /api/v1/rentals` (1 khay) hoặc `POST /api/v1/cart/checkout` (nhiều khay từ giỏ). Với `POST /rentals` khay giữ ngay; với checkout khay giữ tại thời điểm checkout.
- `SEED_PACKET`: tạo bằng `POST /api/v1/orders/seed-packets`; tồn kho được reserve/trừ đúng một lần trong transaction.

```http
POST /api/v1/orders/seed-packets
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "seedVarietyId": 1,
  "quantity": 2,
  "shippingAddress": "123 Farm Road"
}
```

Customer xem tất cả đơn và chi tiết:

- `GET /api/v1/orders?page=1&pageSize=20`
- `GET /api/v1/orders/{id}`
- `GET /api/v1/rentals?page=1&pageSize=20` chỉ trả đơn thuê khay.
- `GET /api/v1/rentals/{id}` xem chi tiết đơn thuê khay.

Staff/Admin quản lý đơn:

- `GET /api/v1/staff/orders?orderType=&status=&page=1&pageSize=20`
- `GET /api/v1/staff/orders/rentals?status=&page=1&pageSize=20`
- `GET /api/v1/staff/orders/{id}`
- `PATCH /api/v1/staff/orders/{id}/status` với body `{ "status": "CONFIRMED" }`

Chuỗi trạng thái hợp lệ:

```text
AWAITING_PAYMENT -> CONFIRMED -> PREPARING -> DELIVERING -> COMPLETED
```

- Gửi lại đúng trạng thái hiện tại là idempotent và không xử lý tài nguyên lần nữa.
- Nhảy cóc hoặc quay lui trạng thái trả `409 Conflict`.
- Worker chạy mỗi phút, chuyển đơn chưa thanh toán quá 30 phút sang `EXPIRED`, trả khay về `AVAILABLE` hoặc hoàn tồn kho `SEED_PACKET`.
- Việc hết hạn chỉ áp dụng cho đơn còn `AWAITING_PAYMENT`, nên gọi lặp không hoàn tài nguyên nhiều lần.

### 0.8. Payment/SePay và Delivery

Biến môi trường bắt buộc khi nhận webhook production:

```bash
SePay__WebhookSecret=<HMAC secret trên SePay>
SePay__BankName=<tên ngân hàng>
SePay__BankAccountNumber=<số tài khoản>
SePay__AccountName=<tên chủ tài khoản>
```

Không commit secret vào `appsettings*.json`. Webhook production phải là URL HTTPS public:
`POST https://<backend-domain>/api/v1/payments/sepay/webhook`.

Trong giai đoạn chưa có domain, có thể dùng ngrok nhưng phải **liên hệ Thành để mở Backend/ngrok**. Webhook sẽ không nhận được giao dịch nếu máy Thành, Docker, API hoặc ngrok đang tắt. Khi có domain chính thức, phải thay toàn bộ URL ngrok trong SePay và tài liệu triển khai bằng domain đó.

Luồng kiểm tra webhook:

1. Backend chạy và endpoint Swagger trả `200`.
2. ngrok trỏ tới cổng `5080`.
3. SePay webhook dùng đúng URL HTTPS và chọn `HMAC-SHA256`.
4. `SEPAY_WEBHOOK_SECRET` trong `.env` phải trùng secret trên SePay.
5. Nội dung chuyển khoản chứa chính xác `paymentCode`/`OrderCode` mà API trả về.
6. SePay có thể trả `code = null`; Backend sẽ trích mã `SP...` hoặc `TR...` từ trường `content`.

Payment API:

- `POST /api/v1/payments/orders/{orderId}`: tạo/lấy hướng dẫn thanh toán cho customer.
- `GET /api/v1/payments/orders/{orderId}`: kiểm tra trạng thái thanh toán.
- `POST /api/v1/payments/sepay/webhook`: nhận webhook HMAC-SHA256 từ SePay.
- `GET /api/v1/staff/payments/exceptions`: danh sách giao dịch thiếu, thừa, trễ, sai trạng thái hoặc không khớp.
- `PUT /api/v1/staff/payments/{id}/note`: staff ghi chú xử lý exception.
- `GET /api/v1/staff/payments/report?from=&to=`: báo cáo giao dịch.

Webhook kiểm tra chữ ký trên raw body, chống replay 5 phút và dùng `SePay transaction id` làm khóa unique chống xử lý trùng. Payload gốc luôn được lưu trong `PaymentWebhookEvents` để đối soát.

Chạy kiểm thử E2E tự động Payment và Delivery trên Docker local:

```bash
SMARTFARM_API_CONTAINER=smartfarm-api \
SMARTFARM_DB_NAME=smartfarm \
./scripts/e2e-payment-delivery.sh
```

Kịch bản tạo customer, đơn `SEED_PACKET`, payment; ký webhook HMAC; kiểm tra thanh toán đúng, `UNDERPAID`, `OVERPAID`, `REFERENCE_MISMATCH`, `LATE`, `UNMATCHED`, `ORDER_STATE_MISMATCH` và webhook trùng. Script còn kiểm tra phân quyền Customer/Staff/Admin, danh sách exception, phân trang, ghi chú xử lý, báo cáo và khoảng ngày không hợp lệ; sau đó tạo delivery, gán shipper và chạy `PACKAGED -> SHIPPING -> DELIVERED`. Chỉ chạy trên database kiểm thử vì script chủ động tạo và cập nhật dữ liệu.

Lưu ý Payment/Delivery:

- Không chạy script E2E trên database production.
- Giao dịch thật đã được kiểm tra theo luồng SePay → ngrok → Backend, nhưng các trường hợp thiếu/thừa/sai/trễ được giả lập bằng webhook HMAC để tránh chuyển tiền nhiều lần.
- `SePayTransactionId` là khóa chống xử lý webhook trùng; webhook lặp trả `duplicate: true` và không cập nhật tài nguyên lần hai. Kể cả khi hai webhook cùng `SePayTransactionId` đến gần **đồng thời** (cùng vượt qua bước kiểm tra trùng), unique index chặn bản ghi thứ hai và Backend trả về **idempotent** (`duplicate: true`, `200`) thay vì lỗi `500`. Tương tự, notification theo sự kiện nghiệp vụ (`IdempotencyKey`) cũng an toàn khi trùng đồng thời.
- Giao dịch mới đến sau khi Payment đã `SUCCESS` được ghi nhận là `ORDER_STATE_MISMATCH` nhưng không được hạ Payment thành `FAILED` hoặc ghi đè mã giao dịch thành công trước đó.
- Staff/Admin được xem exception, ghi chú và xem báo cáo; Customer gọi các endpoint `/staff/payments/*` sẽ nhận `403`, request không có token nhận `401`.
- Ghi chú exception không được rỗng. Báo cáo từ `from` lớn hơn `to` trả `400`.
- Đơn chưa thanh toán hết hạn sau 30 phút; tồn kho hoặc khay đã giữ sẽ được hoàn đúng một lần.
- Chỉ đơn `CONFIRMED` mới được tạo delivery.
- Delivery chỉ đi theo `PENDING → PACKAGED → SHIPPING → DELIVERED`; chuyển sai trả `409`.

### 0.9. Notification

Customer/User:

- `GET /api/v1/notifications?isRead=&page=1&pageSize=20`: lấy thông báo đã gửi của user hiện tại.
- `PATCH /api/v1/notifications/{id}/read`: đánh dấu đã đọc, không thể đọc thông báo của user khác.
- `POST /api/v1/notifications/device-tokens`: đăng ký/cập nhật Firebase token bằng body `{ "token": "...", "platform": "IOS|ANDROID|WEB" }`.

Staff/Admin:

- `POST /api/v1/staff/notifications`: tạo draft; truyền `scheduledAt` để tạo lịch ngay.
- `POST /api/v1/staff/notifications/broadcast`: **gửi hàng loạt** cho nhiều user cùng lúc. Body:
  ```json
  { "target": "ALL", "role": null, "title": "Bảo trì", "message": "Hệ thống bảo trì 22h",
    "type": "GENERAL", "scheduledAt": null }
  ```
  - `target = "ALL"`: gửi mọi user đang active. `target = "ROLE"`: chỉ role trong `role` (`CUSTOMER`/`STAFF`/`ADMIN`, bắt buộc khi ROLE).
  - `scheduledAt = null` → gửi ngay (`SENT`); có giá trị (tương lai) → lên lịch (`SCHEDULED`, worker gửi sau).
  - Không có người nhận phù hợp → `404`. `target`/`role` sai → `400`.
  - Response: `{ "target", "role", "recipients": <số user>, "status": "SENT|SCHEDULED", "scheduledAt" }`. Mỗi user nhận đúng một bản ghi (không trùng).
- `GET /api/v1/staff/notifications?status=&userId=&search=&page=1&pageSize=20`: Staff xem và lọc toàn bộ draft/scheduled/sent.
- `PUT /api/v1/staff/notifications/{id}` và `DELETE /api/v1/staff/notifications/{id}`: sửa/xóa khi chưa gửi; bản ghi `SENT` không thể thay đổi.
- `POST /api/v1/staff/notifications/{id}/send`: gửi ngay, gọi lặp là idempotent.
- `PUT /api/v1/staff/notifications/{id}/schedule`: đặt lịch tương lai bằng body `{ "scheduledAt": "..." }`.
- `GET|POST /api/v1/staff/notifications/templates`, `PUT|DELETE /api/v1/staff/notifications/templates/{id}`: quản lý template tự động; `templateKey` là duy nhất và thay đổi chỉ áp dụng cho notification sinh sau đó.
- `DELETE /api/v1/notifications/device-tokens/{id}`: user vô hiệu hóa token của chính mình.

Worker kiểm tra notification đến hạn mỗi 30 giây. Các sự kiện order, payment, delivery và growing cycle tự tạo notification với `IdempotencyKey` unique, nhờ đó cùng một trạng thái hoặc webhook gửi lại không tạo thông báo trùng.

Ví dụ Staff tạo notification thủ công:

```http
POST /api/v1/staff/notifications
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "userId": 3,
  "title": "Thông báo bảo trì",
  "message": "Hệ thống sẽ bảo trì lúc 22:00.",
  "type": "GENERAL",
  "referenceId": null,
  "scheduledAt": null
}
```

Response trả `notificationId` và trạng thái `DRAFT`. Staff gửi ngay bằng:

```http
POST /api/v1/staff/notifications/{notificationId}/send
Authorization: Bearer <staff-token>
```

Hoặc đặt lịch bằng thời gian UTC ISO-8601:

```http
PUT /api/v1/staff/notifications/{notificationId}/schedule
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "scheduledAt": "2026-09-23T15:00:00Z"
}
```

Các loại notification hợp lệ: `GENERAL`, `ORDER`, `PAYMENT`, `DELIVERY`, `GROWING_CYCLE`.

Lưu ý Notification/Firebase:

- `SENT` hiện có nghĩa là thông báo đã sẵn sàng trong API `GET /notifications`.
- **Trạng thái hiện tại: Firebase push chưa hoàn thiện, đang chờ FE/mobile tích hợp Firebase.** Notification nội bộ Backend, draft, gửi ngay, lên lịch và đánh dấu đã đọc đã hoàn thành.
- Backend đã lưu và cập nhật Firebase device token theo token unique, nhưng **chưa gửi push thật qua Firebase Cloud Messaging**. Token dùng để test hiện chỉ xác minh API đăng ký, chưa chứng minh thiết bị đã nhận push.
- FE/mobile cần tạo hoặc thống nhất Firebase project, cài Firebase SDK, xin quyền nhận thông báo, lấy FCM token thật và gửi token đó tới `POST /api/v1/notifications/device-tokens`.
- Khi FE/mobile sẵn sàng, Backend cần được cung cấp Firebase Project ID và service-account credential qua secret/biến môi trường; tuyệt đối không commit file service-account JSON lên Git.
- Muốn thiết bị nhận push thật cần cấu hình Firebase project/service account và bổ sung FCM sender, retry, xử lý token hết hạn và log kết quả gửi.
- Khi logout hoặc gỡ ứng dụng, FE gọi `DELETE /api/v1/notifications/device-tokens/{id}` để vô hiệu hóa token; Backend không xóa lịch sử token.
- Worker kiểm tra lịch mỗi 30 giây nên notification đặt lịch có thể xuất hiện trễ tối đa khoảng 30 giây.
- Staff hiện gửi thủ công theo từng `userId`; chưa hỗ trợ broadcast toàn bộ user hoặc theo role.
- Gọi gửi lại cùng sự kiện nghiệp vụ không tạo bản ghi trùng nhờ `IdempotencyKey` unique.

Không đánh dấu hạng mục Firebase/FCM là hoàn thành cho đến khi test được luồng thật:

```text
FE/mobile lấy FCM token
→ đăng ký token với Backend
→ Backend gọi FCM
→ Firebase trả kết quả gửi thành công
→ thiết bị thật nhận và mở notification
→ token lỗi/hết hạn được vô hiệu hóa
```

### Checklist bàn giao và xử lý lỗi nhanh

- `docker compose ps`: API phải `Up`, MySQL phải `healthy`.
- `docker compose logs -f api`: kiểm tra migration, lỗi kết nối database và worker.
- `dotnet test SmartFarm.sln --no-restore`: toàn bộ test phải đạt trước khi bàn giao.
- `docker compose config --quiet`: kiểm tra cú pháp `.env` và Compose.
- SePay không gọi được webhook: kiểm tra Backend/ngrok đang mở; nếu dùng ngrok hãy liên hệ Thành.
- Webhook trả `401`: kiểm tra timestamp và HMAC secret.
- Webhook trả `400`: kiểm tra payload, `transferType`, mã đơn và số tiền.
- API payment trả trống ngân hàng: kiểm tra ba biến `SEPAY_BANK_NAME`, `SEPAY_BANK_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME` trong `.env`, sau đó tạo lại container API.
- Notification đặt lịch chưa xuất hiện: chờ tối đa 30 giây và kiểm tra log `NotificationDispatchWorker`.

Delivery API dành cho Staff/Admin:

- `POST /api/v1/staff/deliveries`: tạo thông tin giao hàng cho đơn `CONFIRMED`.
- `GET /api/v1/staff/deliveries?status=`: xem danh sách cần đóng gói/giao.
- `GET /api/v1/staff/deliveries/{id}`: xem chi tiết.
- `PUT /api/v1/staff/deliveries/{id}/shipper`: gán staff làm shipper. Không gán được cho delivery đã `DELIVERED` hoặc `FAILED` (trả `409`).
- `PATCH /api/v1/staff/deliveries/{id}`: cập nhật trạng thái, tracking code, trọng lượng và ghi chú.

Delivery API dành cho Customer:

- `PUT /api/v1/deliveries/orders/{orderId}/schedule`: tạo hoặc cập nhật lịch giao của đơn chính chủ đang `CONFIRMED`/`PREPARING`; body gồm `recipientName`, `recipientPhone`, `shippingAddress`, `scheduledDeliveryAt`, `notes`.
- `GET /api/v1/deliveries`: xem các delivery của chính Customer.
- `GET /api/v1/deliveries/{id}`: xem tracking và chi tiết delivery chính chủ.

Thời gian hẹn phải ở tương lai. Với đơn thuê khay, thời gian giao phải nằm từ ngày thu hoạch dự kiến/thực tế đến tối đa hai ngày sau đó. Delivery đã `SHIPPING` hoặc `DELIVERED` không thể đổi lịch.

Chuỗi delivery hợp lệ: `PENDING -> PACKAGED -> SHIPPING -> DELIVERED`; có thể chuyển sang `FAILED` trước khi giao thành công (không thể `FAILED` sau khi đã `DELIVERED`, trả `409`). Khi `SHIPPING`, order chuyển `DELIVERING`; khi `DELIVERED`, order chuyển `COMPLETED`.

**Giao thất bại (`FAILED`):** áp dụng phương án giữ nguyên — order **giữ nguyên trạng thái hiện tại** và **KHÔNG tự hoàn kho**; staff xử lý thủ công (liên hệ khách/giao lại). Backend không tự hủy đơn khi giao thất bại.

**Tính nhất quán khi `SHIPPING`:** việc chuyển sang `SHIPPING` và ghi bút toán `SALE` (cho đơn `SEED_PACKET`) chạy trong **cùng một transaction** — nếu ghi `SALE` lỗi thì trạng thái `SHIPPING` cũng không được lưu, tránh tình trạng đơn đã giao nhưng thiếu bút toán xuất kho. `SALE` chỉ ghi đúng một lần nhờ khóa unique `(OrderId, SupplyId, MovementType)`.

## 1. Cấu trúc Response chung

Mọi response đều được bọc trong một format chung:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": { ... },
  "errors": null
}
```

- Lỗi Validation (HTTP `400`): `errors` sẽ là dictionary `{"Email": ["Invalid email format"]}`.
- Lỗi Nghiệp vụ (HTTP `4xx`/`500`): `success` = `false`, `message` mô tả lỗi, `data` = `null`.

## 2. API: Authentication & Authorization

Tài khoản dev mặc định (đã được confirm sẵn, mật khẩu `Admin@12345`):
- Admin: `admin@smartfarm.local`
- Staff: `staff@smartfarm.local`
- Customer: `customer@smartfarm.local`
- Customer 2: `customer2@smartfarm.local`

**Dữ liệu mẫu tự seed khi chạy môi trường Development** (`DbSeeder`, chỉ seed khi bảng còn rỗng — chạy lại không nhân đôi):
- 4 user ở trên (1 admin, 1 staff, 2 customer).
- 5 vật tư: 3 giống hạt (rau muống/cải xanh/hướng dương mầm) + giá thể xơ dừa + hộp đóng gói — đủ các `SupplyType` và có sẵn tồn kho.
- 2 khu: Khu A (40 khay) + Khu B (20 khay), tất cả `AVAILABLE`.
- Bảng giá: `CARE_FEE` 10.000đ/khay + `DELIVERY_FEE` 20.000đ/đơn (để test tính phí vào đơn).
- Ngưỡng IoT (`CropThreshold`) + lịch chăm sóc (`CareSchedule`) cho giống hạt đầu tiên, theo 3 giai đoạn GERMINATION/GROWING/HARVEST.
- 2 thiết bị IoT mẫu (`ESP32-A01`, `CAM-A01`) đã gán vào khay đầu tiên của Khu A.

> Lưu ý: seed KHÔNG tạo đơn hàng/thanh toán/giao hàng giả — các luồng đó test qua API thật (thuê khay → thanh toán SePay → giao hàng). Muốn làm lại dữ liệu sạch: `docker compose down -v` rồi `docker compose up --build -d`.

### 2.1. Xác nhận Email (Mới)
- **Confirm:** `POST /api/v1/auth/confirm-email`
  - Body: `{ "email": "", "token": "" }`
- **Resend:** `POST /api/v1/auth/resend-confirm-email`
  - Body: `{ "email": "" }` (Có rate limit 60 giây).

### 2.2. Đăng nhập Google (CHỜ FE tích hợp — chưa triển khai)

Hệ thống hiện chỉ dùng **JWT tự phát hành** (không dùng Firebase). Đăng nhập Google sẽ được bổ sung theo hướng **Google OAuth trực tiếp** khi FE sẵn sàng và cung cấp **Google Client ID** (cho Web và Mobile). Backend **chưa có** endpoint này; phần dưới mô tả thiết kế dự kiến để FE chuẩn bị và để BE triển khai nhanh sau:

- Luồng: FE dùng Google Sign-In lấy `idToken` → gọi `POST /api/v1/auth/google` với body `{ "idToken": "..." }` → BE verify `idToken` với Google (kiểm `aud` khớp Client ID, `email_verified = true`) → tìm/tạo user → phát **JWT hệ thống** (accessToken + refreshToken) giống hệt luồng login thường.
- Tài khoản mới qua Google được tạo với role `CUSTOMER`, `emailConfirmed = true`.
- DB sẽ bổ sung: `AuthProvider` (`LOCAL`/`GOOGLE`, mặc định `LOCAL`), `GoogleSubjectId` (unique, nullable); `PasswordHash` thành nullable. Tài khoản Google không dùng được luồng đăng nhập bằng mật khẩu.

> FE cần cung cấp Google Client ID để BE cấu hình `Google:ClientIds` trước khi bật tính năng này.

*(Các Endpoints Login, Logout, Profile, Admin, Catalog, Rental như đã mô tả trong phần Workflow).*

## 3. API: Farm Infrastructure

Các endpoint quản trị yêu cầu header Authorization: Bearer ADMIN_ACCESS_TOKEN.

### 3.1. Farm Zones

- GET /api/v1/admin/farm/zones: danh sách Zone kèm số Rack, tổng số khay và số khay trống.
- GET /api/v1/admin/farm/zones/{id}: chi tiết Zone.
- POST /api/v1/admin/farm/zones: tạo Zone.
- PUT /api/v1/admin/farm/zones/{id}: cập nhật Zone.
- DELETE /api/v1/admin/farm/zones/{id}: ngừng hoạt động Zone.

Body tạo/cập nhật:

    {
      "zoneName": "Khu A",
      "locationDescription": "Nhà kính số 1",
      "totalCapacity": 40,
      "isActive": true
    }

Tên Zone không được trùng. Total capacity không được thấp hơn số khay hiện có. Không thể ngừng Zone còn khay RENTED.

### 3.2. Farm Racks

- GET /api/v1/admin/farm/racks?zoneId=1
- POST /api/v1/admin/farm/racks
- PUT /api/v1/admin/farm/racks/{id}
- DELETE /api/v1/admin/farm/racks/{id}

Body:

    {
      "zoneId": 1,
      "rackCode": "A-R01",
      "totalTiers": 4,
      "maxTraysPerTier": 10
    }

Rack code không được trùng. Không thể giảm số tầng hoặc sức chứa xuống thấp hơn layout hiện tại. Chỉ xóa được Rack không chứa khay.

### 3.3. Soil Trays

Admin:

- GET /api/v1/admin/farm/trays?rackId=&status=
- POST /api/v1/admin/farm/trays
- PUT /api/v1/admin/farm/trays/{id}
- PUT /api/v1/admin/farm/trays/{id}/status
- PUT /api/v1/admin/farm/trays/{id}/location
- DELETE /api/v1/admin/farm/trays/{id}

Staff:

- GET /api/v1/staff/farm/zones
- GET /api/v1/staff/farm/racks?zoneId=
- GET /api/v1/staff/farm/trays?rackId=&status=
- PUT /api/v1/staff/farm/trays/{id}/status

Body tạo/cập nhật:

    {
      "rackId": 1,
      "trayCode": "A-001",
      "tierIndex": 1,
      "currentStatus": "AVAILABLE"
    }

Body đổi trạng thái: { "status": "MAINTENANCE" }

Body chuyển vị trí: { "rackId": 2, "tierIndex": 3 }

Trạng thái hợp lệ: AVAILABLE, RENTED, MAINTENANCE, INACTIVE. Khay RENTED không thể di chuyển, xóa hoặc giải phóng trực tiếp qua API quản lý khay.

## 4. API: Supplies

Yêu cầu role STAFF hoặc ADMIN.

- GET /api/v1/staff/cultivation/supplies?type=&active=
- GET /api/v1/staff/cultivation/supplies/{id}
- POST /api/v1/staff/cultivation/supplies
- PUT /api/v1/staff/cultivation/supplies/{id}
- DELETE /api/v1/staff/cultivation/supplies/{id}: ngừng hoạt động.

Body:

    {
      "supplyName": "Rau muống mầm",
      "supplyType": "SEED",
      "description": "Giống microgreen",
      "harvestDays": 10,
      "imageUrl": null,
      "costPrice": 30000,
      "unitPrice": 45000,
      "rentalPrice": 65000,
      "quantityInStock": 100,
      "unit": "GÓI",
      "minStockLevel": 10,
      "isActive": true
    }

Supply type hợp lệ: SEED, SOIL_SUBSTRATE, PACKAGING, EQUIPMENT. SEED bắt buộc có harvestDays lớn hơn 0.

## 5. API: Crop Thresholds

Yêu cầu role STAFF hoặc ADMIN.

- GET /api/v1/staff/cultivation/thresholds?supplyId=
- POST /api/v1/staff/cultivation/thresholds
- PUT /api/v1/staff/cultivation/thresholds/{id}
- DELETE /api/v1/staff/cultivation/thresholds/{id}

Body:

    {
      "supplyId": 1,
      "stage": "GROWING",
      "minSoilMoisture": 40,
      "maxSoilMoisture": 70,
      "minAirHumidity": 50,
      "maxAirHumidity": 80,
      "minTemperature": 20,
      "maxTemperature": 30,
      "minLightIntensity": 100,
      "maxLightIntensity": 500,
      "lightHoursPerDay": 12
    }

Stage hợp lệ: GERMINATION, GROWING, HARVEST. Mỗi cặp supplyId và stage chỉ có một cấu hình. Mọi giá trị min phải nhỏ hơn hoặc bằng max tương ứng.

## 6. API: Care Schedules

Yêu cầu role STAFF hoặc ADMIN.

- GET /api/v1/staff/cultivation/care-schedules?supplyId=
- POST /api/v1/staff/cultivation/care-schedules
- PUT /api/v1/staff/cultivation/care-schedules/{id}
- DELETE /api/v1/staff/cultivation/care-schedules/{id}

Body:

    {
      "supplyId": 1,
      "dayIndex": 1,
      "taskName": "Kiểm tra độ ẩm và tưới",
      "taskDescription": "Tưới nếu giá thể khô",
      "targetStage": "GERMINATION"
    }

Day index tính từ ngày bắt đầu chu kỳ trồng. Care Schedule được dùng để sinh Daily Task cho từng chu kỳ.

## 7. API: Growing Cycles

Yêu cầu role STAFF hoặc ADMIN.

- GET /api/v1/staff/cultivation/cycles?status=
- POST /api/v1/staff/cultivation/cycles
- PUT /api/v1/staff/cultivation/cycles/{id}/status
- PUT /api/v1/staff/cultivation/cycles/{id}/harvest
- POST /api/v1/staff/cultivation/cycles/{id}/tasks/generate

Body bắt đầu chu kỳ:

    {
      "customerId": 10,
      "soilTrayId": 5,
      "supplyId": 1,
      "orderId": 20,
      "startDate": "2026-09-22T08:00:00+07:00"
    }

Hệ thống kiểm tra Customer và Order, Supply là SEED đang hoạt động và khay đang AVAILABLE. Expected harvest date được tính từ start date cộng harvest days; khay chuyển sang RENTED.

Body cập nhật trạng thái: { "status": "GROWING" }

Trạng thái hợp lệ: PLANTED, GERMINATING, GROWING, READY_TO_HARVEST, HARVESTED, FAILED.

Body thu hoạch: { "actualHarvestDate": "2026-10-02T08:00:00+07:00" }

Sau thu hoạch, chu kỳ chuyển thành HARVESTED và khay chuyển thành MAINTENANCE.

## 8. API: Daily Tasks

Yêu cầu role STAFF hoặc ADMIN.

- GET /api/v1/staff/cultivation/tasks?rentalId=&status=
- PUT /api/v1/staff/cultivation/tasks/{id}/assignee
- PUT /api/v1/staff/cultivation/tasks/{id}/complete

Body giao việc: { "assignedUserId": 2 }

Chỉ giao được cho STAFF đang hoạt động. Gửi null để bỏ gán.

Body hoàn thành:

    {
      "status": "COMPLETED",
      "notes": "Đã kiểm tra và tưới đủ"
    }

Trạng thái kết thúc hợp lệ: COMPLETED, SKIPPED. Sinh Daily Task có tính idempotent nên gọi lại không tạo trùng task cùng chu kỳ, tên và ngày thực hiện.

## 9. API: IoT Management (chưa gồm SensorTelemetry)

Yêu cầu role `STAFF` hoặc `ADMIN`. Các API trong phần này quản lý registry và metadata; chưa nhận dữ liệu cảm biến thời gian thực.

### 9.1. IoT Device

- `GET /api/v1/staff/iot/devices?status=&search=&page=1&pageSize=20`
- `GET /api/v1/staff/iot/devices/{id}`
- `POST /api/v1/staff/iot/devices`
- `PUT /api/v1/staff/iot/devices/{id}`
- `PUT /api/v1/staff/iot/devices/{id}/status`
- `DELETE /api/v1/staff/iot/devices/{id}`: vô hiệu thiết bị bằng trạng thái `INACTIVE`, không xóa lịch sử.

Body tạo/cập nhật:

```json
{
  "deviceCode": "ESP32-A01",
  "macAddress": "AA:BB:CC:DD:EE:01",
  "deviceType": "ESP32",
  "firmwareVersion": "1.0.0",
  "status": "OFFLINE"
}
```

Trạng thái hợp lệ: `ONLINE`, `OFFLINE`, `INACTIVE`. Device code và MAC address không được trùng. Endpoint status cập nhật cả trạng thái và `LastSeen`; nếu không truyền `lastSeen`, Backend dùng thời gian hiện tại. Không thể vô hiệu device khi còn assignment đang hoạt động.

### 9.2. Gán Device/Component vào Soil Tray

- `GET /api/v1/staff/iot/tray-devices?soilTrayId=&active=`
- `POST /api/v1/staff/iot/tray-devices`
- `DELETE /api/v1/staff/iot/tray-devices/{id}`: vô hiệu assignment, không xóa lịch sử.

```json
{
  "soilTrayId": 1,
  "deviceId": 1,
  "pinNumber": "A1",
  "componentType": "SOIL_MOISTURE"
}
```

Component hợp lệ: `SOIL_MOISTURE`, `AIR_TEMP_HUMIDITY`, `LIGHT`, `WATER_PUMP`, `LED_LIGHT`, `VENTILATION_FAN`. Gửi lại đúng cặp tray/device/component sẽ kích hoạt lại assignment thay vì tạo trùng. Một device vật lý chỉ có một assignment hoạt động tại một thời điểm.

### 9.3. Camera Snapshot metadata

- `POST /api/v1/staff/iot/camera-snapshots`
- `GET /api/v1/staff/iot/camera-snapshots?rentalId=&deviceId=&page=1&pageSize=20`

```json
{
  "deviceId": 1,
  "rentalId": 10,
  "imageUrl": "https://storage.example/snapshots/image.jpg",
  "takenAt": "2026-09-23T12:00:00Z"
}
```

API chỉ lưu metadata và URL, không upload binary ảnh. Device phải đang được gán hoạt động vào đúng Soil Tray của growing cycle/rental.

### 9.4. Actuator Log và System Alert

- `GET /api/v1/staff/iot/actuator-logs?deviceId=&result=&from=&to=&page=1&pageSize=20`
- `POST /api/v1/staff/iot/devices/{deviceId}/actuator-commands`
- `GET /api/v1/staff/iot/actuator-commands/{commandId}`
- `GET /api/v1/staff/iot/alerts?resolved=&severity=&deviceId=&page=1&pageSize=20`
- `PATCH /api/v1/staff/iot/alerts/{id}/resolve` với body `{ "isResolved": true }`.

Staff/Admin gửi lệnh thủ công với body `{ "actuatorType": "FAN", "action": "ON" }`. `actuatorType` nhận `FAN`, `LED`, `PUMP`; `action` nhận `ON`, `OFF`. API trả `202` và log ở trạng thái `PENDING`; ESP32 xác nhận qua MQTT để chuyển thành `SUCCESS` hoặc `FAILED`. ACK lặp không xử lý lại. Device `INACTIVE`, dữ liệu sai hoặc broker không khả dụng lần lượt trả `409`, `400`, `503`. Resolve alert có tính idempotent. Khoảng ngày `from > to` trả `400`.

### 9.5. Threshold

CRUD threshold đã có tại `/api/v1/staff/cultivation/thresholds` như mục 5 và được dùng chung cho IoT/cultivation.

### 9.6. MQTT và Sensor Telemetry

Backend đã có Mosquitto broker, MQTT consumer QoS 1, REST fallback và API đọc telemetry. MQTT consumer tự kết nối lại sau khi broker gián đoạn; `messageId` có unique index và được dùng để chống lưu trùng khi QoS 1 gửi lại message. Khi nhận telemetry/heartbeat hợp lệ, Backend cập nhật `LastSeen` và chuyển device sang `ONLINE`.

Các topic ESP32 publish:

- `smartfarm/devices/{deviceCode}/telemetry`
- `smartfarm/devices/{deviceCode}/heartbeat`
- `smartfarm/devices/{deviceCode}/command-acks`

ESP32 subscribe topic `smartfarm/devices/{deviceCode}/commands`. Payload lệnh:

```json
{
  "commandId": "7b808a2bfdd44636bdbd74baedf28b15",
  "deviceCode": "ESP32-TRAY-01",
  "actuatorType": "WATER_PUMP",
  "action": "ON",
  "requestedAt": "2026-09-24T12:00:00Z"
}
```

Sau khi thực thi, ESP32 publish ACK QoS 1:

```json
{
  "commandId": "7b808a2bfdd44636bdbd74baedf28b15",
  "deviceCode": "ESP32-TRAY-01",
  "result": "SUCCESS",
  "failureReason": null,
  "acknowledgedAt": "2026-09-24T12:00:01Z"
}
```

Lệnh bơm thủ công vẫn phải tuân thủ timeout an toàn trong firmware; khi không thể thực thi, ESP32 gửi `FAILED` kèm `failureReason`.

Payload telemetry:

```json
{
  "messageId": "esp32-a01-1727143200000",
  "deviceCode": "ESP32-A01",
  "recordedAt": "2026-09-24T04:00:00Z",
  "temperature": 28.5,
  "airHumidity": 70.2,
  "soilHumidity": 62.1,
  "lightIntensity": 900,
  "waterLevel": 45
}
```

`messageId` phải duy nhất trên thiết bị. `deviceCode` trong payload phải giống topic, device phải hoạt động và có assignment đang active vào Soil Tray. Tất cả sensor đều nullable nhưng payload phải có ít nhất một giá trị. Khoảng hợp lệ: nhiệt độ `-20..80`, độ ẩm/mực nước `0..100`, ánh sáng không âm; `recordedAt` không cũ quá 7 ngày và không vượt quá 2 phút trong tương lai.

Payload heartbeat: `{ "deviceCode": "ESP32-A01", "recordedAt": "2026-09-24T04:00:00Z" }`.

REST fallback cho ESP/gateway gửi header `X-Device-Key`:

- `POST /api/v1/iot/telemetry`
- `POST /api/v1/iot/heartbeat`

API đọc dữ liệu:

- Staff/Admin: `GET /api/v1/staff/telemetry/trays/{trayId}/latest` và `/history?from=&to=&page=&pageSize=`.
- Customer: `GET /api/v1/rentals/{rentalId}/telemetry/latest` và `/history`; Backend kiểm tra rental thuộc customer đăng nhập.

Ảnh camera của khay (Customer xem khay mình thuê):

- `GET /api/v1/rentals/{rentalId}/camera/latest`: ảnh mới nhất của khay đang thuê. Chưa có ảnh → `404`.
- `GET /api/v1/rentals/{rentalId}/camera/history?page=&pageSize=`: lịch sử ảnh (mới nhất trước).
- Backend kiểm tra `rentalId` thuộc customer đăng nhập; xem khay của người khác trả `404`.
- Staff/Admin vẫn dùng `GET /api/v1/staff/iot/camera-snapshots?rentalId=&deviceId=` để xem mọi khay.
- Response ảnh gồm: `snapshotId`, `deviceId`, `rentalId`, `imageUrl`, `takenAt`. (Hiện lưu URL/metadata; lưu ảnh thật lên S3 nằm trong hạng mục camera S3 sẽ bổ sung sau.)

Khởi tạo credential local lần đầu (file `password.txt` và `.env` không được commit):

```bash
cp .env.mqtt.example .env.mqtt.local
mkdir -p mqtt/data mqtt/log
docker run --rm -v "$PWD/mqtt/config:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b -c /mosquitto/config/password.txt smartfarm-backend 'MAT_KHAU_MQTT'
```

Điền cùng giá trị vào `Mqtt__Username`, `Mqtt__Password`, tạo một `Mqtt__IngestApiKey` riêng trong `.env.mqtt.local`, rồi chạy `docker compose up --build -d`. Compose tự đọc file này nếu có; file local đã được gitignore. Backend trong Docker kết nối `mqtt:1883`; ESP trong cùng Wi-Fi kết nối IP LAN của máy Thành tại port `1883` (không dùng `localhost`). Có thể kiểm tra broker bằng `mosquitto_pub` hoặc MQTT Explorer với đúng tài khoản.

Broker local hiện dùng TCP có xác thực nhưng chưa TLS, phù hợp development/LAN. Production cần domain/IP ổn định, TLS port 8883, certificate, ACL riêng theo device và secret riêng cho từng thiết bị. Camera vẫn chỉ nhận metadata/URL; upload ảnh production cần storage service.

## 10. API: Inventory và Material Movement

Yêu cầu role `STAFF` hoặc `ADMIN`:

- `GET /api/v1/staff/inventory?supplyType=&lowStock=&search=&page=1&pageSize=20`: xem `onHand`, `reserved`, `available`, mức tồn tối thiểu và cảnh báo tồn thấp.
- `GET /api/v1/staff/inventory/{supplyId}`: xem tồn kho của một vật tư.
- `POST /api/v1/staff/inventory/{supplyId}/receipts`: nhập kho với body `{ "quantity": 10, "reason": "Nhập từ nhà cung cấp" }`.
- `POST /api/v1/staff/inventory/{supplyId}/usages`: ghi nhận sử dụng vật tư thủ công với body `{ "quantity": 2, "reason": "Dùng cho lứa trồng" }`.
- `GET /api/v1/staff/inventory/movements?supplyId=&type=&from=&to=&page=1&pageSize=20`: lịch sử biến động kho; `type` nhận `RECEIPT`, `MANUAL_USAGE`, `SALE`.
- `GET /api/v1/staff/inventory/reconciliation?supplyId=`: đối chiếu số dư hiện tại với opening balance và tổng movement, trả `RECONCILED`, `MISMATCH` hoặc `NO_MOVEMENTS`. **Công thức chỉ cộng `RECEIPT` (+) và `MANUAL_USAGE` (-), KHÔNG tính `SALE`**: vì `QuantityInStock` đã bị trừ ngay khi đặt đơn (reservation), còn `SALE` chỉ là bút toán ghi sổ "đã bán"; nếu tính cả `SALE` sẽ trừ hai lần và báo lệch sai.

Theo cách reservation hiện tại, `QuantityInStock` là lượng còn dùng được sau khi đơn giữ hàng. API tính `reserved` từ các dòng `SEED_PACKET` thuộc đơn `AWAITING_PAYMENT` chưa hết hạn, `CONFIRMED` hoặc `PREPARING`; `onHand = available + reserved`. Nhập kho và sử dụng thủ công luôn tạo movement, số lượng phải dương và không thể sử dụng vượt `available`.

Khi delivery của đơn `SEED_PACKET` chuyển sang `SHIPPING`, Backend chuyển reservation thành movement `SALE` trong cùng luồng mà không trừ `QuantityInStock` lần hai. Unique key `(OrderId, SupplyId, MovementType)` và kiểm tra idempotent ngăn ghi sale lặp. Sau reservation, expiry, nhập kho, sử dụng hoặc sale, Backend cập nhật một `SystemAlert` loại `LOW_STOCK` theo Supply; alert đang mở được refresh thay vì tạo trùng và tự resolve khi `available > MinStockLevel`.

## 11. API: Báo cáo quản trị

Chỉ role `ADMIN` được truy cập:

- `GET /api/v1/admin/reports/revenue?from=&to=`: tổng doanh thu từ payment `SUCCESS`, số payment, số order, doanh thu theo `OrderType` và số order theo trạng thái.
- `GET /api/v1/admin/reports/harvest?from=&to=`: tổng growing cycle, số đã thu hoạch/thất bại, tỷ lệ hoàn thành và thống kê theo giống cây.
- `GET /api/v1/admin/reports/inventory`: snapshot tổng `onHand`, `reserved`, `available`, số vật tư tồn thấp và lượng available theo `SupplyType`.

`from` và `to` dùng ISO-8601; khoảng thời gian ngược trả `400`. Revenue chỉ cộng giao dịch thành công đã lưu, không cộng webhook exception hoặc callback trùng.

## 12. API: Pricing Management

Chỉ role `ADMIN`: `GET|POST /api/v1/admin/pricing`, `PUT|DELETE /api/v1/admin/pricing/{id}` và `GET /api/v1/admin/pricing/current?type=&supplyId=&at=`. Loại giá hợp lệ: `SEED_UNIT_PRICE`, `TRAY_RENTAL_PRICE`, `CARE_FEE`, `DELIVERY_FEE`. Hai loại giá theo sản phẩm bắt buộc `supplyId`; phí chăm sóc/giao hàng là mức toàn cục và không nhận `supplyId`. Mỗi rule có `effectiveFrom`, `effectiveTo`, trạng thái active và lịch sử người tạo; xóa API là vô hiệu hóa để không mất lịch sử.

**Chống chồng lấn:** khi tạo/sửa rule ở trạng thái active, backend từ chối (`409`) nếu khoảng hiệu lực `[effectiveFrom, effectiveTo)` giao với một rule active khác **cùng `pricingType` + `supplyId`**. Nhờ đó tại một thời điểm chỉ có tối đa một mức giá hiệu lực cho mỗi loại.

### 12.1. Cách phí được cộng vào tổng tiền đơn (áp dụng khi tạo đơn)

Backend cộng phí vào `TotalAmount` ngay khi tạo đơn, theo công thức:

```
TotalAmount = subtotal
            + CARE_FEE * (số khay)     (chỉ đơn TRAY_RENTAL)
            + DELIVERY_FEE             (1 lần/đơn, khi đơn có giao hàng)
```

- **`CARE_FEE`**: tính theo **mỗi khay**. Đơn thuê nhiều khay (checkout giỏ) = `CARE_FEE × số khay`; thuê trực tiếp 1 khay = `CARE_FEE × 1`. Đơn mua hạt (`SEED_PACKET`) **không** có `CARE_FEE`.
- **`DELIVERY_FEE`**: cộng **1 lần/đơn**. Đơn `SEED_PACKET` luôn có giao hàng nên luôn cộng; đơn thuê khay cộng khi checkout.
- Nếu **chưa cấu hình** `PricingRule` tương ứng đang hiệu lực → phí = **0** (không lỗi).
- Phí được lưu snapshot vào đơn khi tạo, nên đổi rule về sau **không** ảnh hưởng đơn cũ.

**Breakdown cho FE:** endpoint giỏ hàng (`GET /cart`, `POST /cart/items`) trả sẵn `subtotal`, `careFeeTotal`, `deliveryFee`, `total` để FE hiển thị. Đơn đã tạo lưu `TotalAmount` là tổng cuối cùng đã gồm phí; chi tiết từng dòng nằm trong `items[].subtotal` (đã gồm care fee của dòng đó với đơn thuê khay).

## 13. Chuẩn bị Database sau khi cập nhật ERD

Migration AlignModelsWithErd thay đổi lớn schema cũ và có thể làm mất dữ liệu. Với database development không cần giữ dữ liệu:

    cd SWP_FA26SE209_SmartFarm/BackEnd
    docker compose down -v
    JWT_SECRET='local-development-secret-key-change-before-production' docker compose up --build -d

Nếu cần giữ dữ liệu, phải sao lưu MySQL và kiểm tra migration SQL trước khi chạy.

## 14. Build và Test

    cd SWP_FA26SE209_SmartFarm/BackEnd
    dotnet build SmartFarm.sln
    dotnet test SmartFarm.sln

Test hiện kiểm tra cấu trúc ERD, EmailConfirmed, precision cột tiền, Order/Payment/Delivery/Notification, CRUD IoT device, assignment, snapshot metadata, actuator command/ACK idempotent, lỗi publish MQTT, actuator log, alert, inventory/movement, validation threshold, sinh Daily Task, MQTT telemetry idempotency, validation, cập nhật trạng thái device và phân quyền dữ liệu rental.

Baseline hiện tại: **48 test, pass 100%**.

> **Yêu cầu .NET 8 runtime**: dự án target `net8.0`. Nếu máy chỉ có .NET 10 SDK, `dotnet build` chạy được nhưng `dotnet test` sẽ báo thiếu `Microsoft.NETCore.App 8.0`. Cài .NET 8 (ví dụ Homebrew `dotnet@8`) rồi dùng script tiện lợi:
>
>     ./scripts/dotnet8.sh build SmartFarm.sln
>     ./scripts/dotnet8.sh test SmartFarm.sln
>
> Script tự trỏ `DOTNET_ROOT` sang bản .NET 8 để build/test đúng runtime.
