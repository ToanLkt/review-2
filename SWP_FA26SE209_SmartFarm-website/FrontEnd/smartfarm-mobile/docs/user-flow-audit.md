# User Web & Mobile demo flow audit

Ngày 2026-09-19. Project đang ở giai đoạn UI/UX demo, không có backend. Web dùng localStorage/sessionStorage; Mobile dùng context state trong phiên app.

| Flow | Mismatch ban đầu | Demo sau sửa | File chính |
| --- | --- | --- | --- |
| Auth | Register tự đăng nhập; Forgot/Reset thiếu; Mobile chỉ nhận tài khoản cố định | Register → Login → Home; Forgot → Reset → Login; đổi mật khẩu demo | `lib/auth.ts`, `components/auth/*`, `src/hooks/auth.tsx`, auth routes |
| Seed Product / Variety | Dùng một list/route cho mua và chọn giống | Route Seed Products giữ chức năng mua; route Seed Varieties chỉ chọn giống thuê, có detail riêng | `app/(user)/seed-varieties`, `src/app/(app)/seed-varieties` |
| Capacity | Không có dữ liệu, quantity không có giới hạn | Mock option 12/24 khay; rental quantity giới hạn; checkout kiểm tra tổng khay | `lib/tray-capacity.ts`, `src/lib/capacity.ts`, rental/checkout components |
| Cart / Checkout | Web có sẵn hàng mẫu; hai app từng báo thành công ngay | Cart rỗng ban đầu; checkout lấy item thật trong cart và tạo giao dịch Pending | `lib/user-cart.ts`, `checkout-page.tsx`, `rental/checkout.tsx` |
| SePay demo | Tự tạo receipt/order và Paid | QR demo + nút Paid/Failed/Expired; chỉ Paid tạo order và clear cart | `lib/user-payment.ts`, `payment-status-page.tsx`, `src/hooks/store.tsx` |
| Orders / History | Chỉ có fixture, không có giao dịch mới | Paid tạo order loại Seed Product/Tray Rental/Mixed; payment history có record và lọc theo user | `lib/user-orders.ts`, `src/data/mock.ts`, payment history routes |
| Delivery | Màn demo chỉ xác nhận lịch mẫu | Form chọn order đủ điều kiện, địa chỉ, ngày, slot; lưu lịch đã đặt | `components/delivery/delivery-page.tsx`, `src/components/orders/screens.tsx` |
| My Trays | Chỉ có khay mock cố định | Khay đã được Staff assign trong fixture hiển thị image, nhiệt độ/độ ẩm, countdown; Paid rental không tự gán physical tray | `lib/user-trays.ts`, `src/data/mock.ts`, tray screens |
| Notifications | Click chỉ mark read | Web mở detail modal; Mobile mở detail route; mark read tại local state | notification components, `src/app/(app)/notifications/[id].tsx` |
| Profile/navigation | Thiếu payment history; Web đổi mật khẩu chỉ báo chưa hỗ trợ | Edit profile và đổi mật khẩu demo; payment history truy cập từ profile; Mobile Home có lối vào Cart, varieties, capacity | profile components, HomeScreen |

## Route chính

Web: `/`, `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`, `/seeds`, `/seeds/[id]`, `/seed-varieties`, `/seed-varieties/[id]`, `/tray-capacity`, `/tray-capacity/standard`, `/rent-tray`, `/rent-tray/[id]`, `/cart`, `/checkout`, `/payment/[id]`, `/orders`, `/orders/[id]`, `/delivery`, `/my-trays`, `/my-trays/[id]`, `/notifications` (detail modal), `/profile`, `/profile/payment-history`.

Mobile: `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`, tab Home/Seeds/My Trays/Orders/Profile, `/seed-varieties`, `/seed-varieties/[id]`, `/tray-capacity`, `/tray-capacity/standard`, `/rent-tray`, `/rent-tray/[id]`, `/cart`, `/checkout`, `/payment-status`, `/orders/[id]`, `/delivery`, `/trays/[id]`, `/notifications`, `/notifications/[id]`, `/payment-history`.

## Demo assumptions

- QR là hình minh họa, nút Paid/Failed/Expired mô phỏng webhook SePay. Mở giao dịch luôn Pending; không có ngân hàng/API thật.
- Capacity ban đầu 12/24 và giảm theo rental đã Paid. Chọn quantity, checkout và thao tác Paid đều kiểm tra lại tổng số khay; đây vẫn là state demo theo từng app.
- Cùng nguồn seed fixture được dùng cho hai context nhưng route, lời dẫn và hành động nghiệp vụ tách biệt.
- Mobile context state mất khi reload app. Web localStorage giữ account, cart, payment, order, delivery và profile demo.
- Các order/tray/notification mẫu ban đầu vẫn được giữ để trình diễn màn danh sách và detail.

## Kiểm tra

- Web typecheck, production build: đạt. Web lint: 0 lỗi, 4 cảnh báo đã có ở Admin/Inventory/Products. Web tests: 73/73 đạt.
- Mobile typecheck và Expo Web export: đạt. Project Mobile không có script lint/test riêng.
- Đã đối chiếu các route xuất hiện trong build/export và rà link User Web trong source. Môi trường này không cung cấp browser để thao tác UI trực tiếp; chưa có smoke test bằng click trên thiết bị thật.

## Danh s?ch file thay ??i

### ?? s?a

- `FrontEnd/smartfarm-fe/app/payment-success/page.tsx`
- `FrontEnd/smartfarm-fe/components/auth/sign-in-form.tsx`
- `FrontEnd/smartfarm-fe/components/auth/sign-up-form.tsx`
- `FrontEnd/smartfarm-fe/components/checkout/checkout-page.tsx`
- `FrontEnd/smartfarm-fe/components/delivery/delivery-page.tsx`
- `FrontEnd/smartfarm-fe/components/home/seed-preview-section.tsx`
- `FrontEnd/smartfarm-fe/components/my-trays/tray-detail-page.tsx`
- `FrontEnd/smartfarm-fe/components/notifications/notifications-page.tsx`
- `FrontEnd/smartfarm-fe/components/profile/profile-page.tsx`
- `FrontEnd/smartfarm-fe/components/rent-tray/rental-configurator.tsx`
- `FrontEnd/smartfarm-fe/components/seeds/seeds-page.tsx`
- `FrontEnd/smartfarm-fe/components/user-orders/order-detail-page.tsx`
- `FrontEnd/smartfarm-fe/components/user-orders/orders-page.tsx`
- `FrontEnd/smartfarm-fe/components/user/cart-provider.tsx`
- `FrontEnd/smartfarm-fe/components/user/user-header.tsx`
- `FrontEnd/smartfarm-fe/lib/auth.ts`
- `FrontEnd/smartfarm-fe/lib/home.ts`
- `FrontEnd/smartfarm-fe/lib/user-cart.ts`
- `FrontEnd/smartfarm-fe/lib/user-checkout.ts`
- `FrontEnd/smartfarm-fe/lib/user-deliveries.ts`
- `FrontEnd/smartfarm-fe/lib/user-orders.ts`
- `FrontEnd/smartfarm-fe/lib/user-trays.ts`
- `FrontEnd/smartfarm-fe/tests/user-web.test.ts`
- `FrontEnd/smartfarm-mobile/src/app/(app)/_layout.tsx`
- `FrontEnd/smartfarm-mobile/src/components/auth/screens.tsx`
- `FrontEnd/smartfarm-mobile/src/components/cards.tsx`
- `FrontEnd/smartfarm-mobile/src/components/home/HomeScreen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/notifications/NotificationsScreen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/orders/screens.tsx`
- `FrontEnd/smartfarm-mobile/src/components/profile/ProfileScreen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/rental/checkout.tsx`
- `FrontEnd/smartfarm-mobile/src/components/rental/screens.tsx`
- `FrontEnd/smartfarm-mobile/src/components/seeds/screens.tsx`
- `FrontEnd/smartfarm-mobile/src/data/mock.ts`
- `FrontEnd/smartfarm-mobile/src/hooks/auth.tsx`
- `FrontEnd/smartfarm-mobile/src/hooks/store.tsx`

### M?i t?o

- `FrontEnd/smartfarm-fe/app/(user)/payment/[id]/page.tsx`
- `FrontEnd/smartfarm-fe/app/(user)/profile/payment-history/page.tsx`
- `FrontEnd/smartfarm-fe/app/(user)/seed-varieties/[id]/page.tsx`
- `FrontEnd/smartfarm-fe/app/(user)/seed-varieties/page.tsx`
- `FrontEnd/smartfarm-fe/app/(user)/tray-capacity/page.tsx`
- `FrontEnd/smartfarm-fe/app/(user)/tray-capacity/standard/page.tsx`
- `FrontEnd/smartfarm-fe/app/forgot-password/page.tsx`
- `FrontEnd/smartfarm-fe/app/privacy/page.tsx`
- `FrontEnd/smartfarm-fe/app/reset-password/page.tsx`
- `FrontEnd/smartfarm-fe/app/terms/page.tsx`
- `FrontEnd/smartfarm-fe/components/auth/password-reset.tsx`
- `FrontEnd/smartfarm-fe/components/checkout/payment-status-page.tsx`
- `FrontEnd/smartfarm-fe/components/profile/payment-history-page.tsx`
- `FrontEnd/smartfarm-fe/components/rent-tray/capacity-pages.tsx`
- `FrontEnd/smartfarm-fe/components/seed-varieties/variety-pages.tsx`
- `FrontEnd/smartfarm-fe/lib/tray-capacity.ts`
- `FrontEnd/smartfarm-fe/lib/user-payment.ts`
- `FrontEnd/smartfarm-mobile/src/app/(app)/notifications/[id].tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/payment-history.tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/payment-status.tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/seed-varieties/[id].tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/seed-varieties/index.tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/tray-capacity/index.tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/tray-capacity/standard.tsx`
- `FrontEnd/smartfarm-mobile/src/app/forgot-password.tsx`
- `FrontEnd/smartfarm-mobile/src/app/reset-password.tsx`
- `FrontEnd/smartfarm-mobile/src/components/seeds/varieties-list-screen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/seeds/variety-detail-screen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/trays/capacity-option-screen.tsx`
- `FrontEnd/smartfarm-mobile/src/components/trays/capacity-screen.tsx`
- `FrontEnd/smartfarm-mobile/src/lib/capacity.ts`
- `FrontEnd/smartfarm-mobile/src/lib/payment.ts`

### ?? x?a

- `FrontEnd/smartfarm-fe/components/checkout/payment-success-page.tsx`
- `FrontEnd/smartfarm-mobile/src/app/(app)/payment-success.tsx`
