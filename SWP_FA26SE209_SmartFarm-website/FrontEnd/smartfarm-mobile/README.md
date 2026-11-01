# SmartFarm Mobile

Ứng dụng User Mobile của SmartFarm, xây dựng với Expo SDK 57, React Native, TypeScript, Expo Router, NativeWind, Reanimated, Lucide, Expo Image và Inter.

## Chạy ứng dụng

```bash
npm install
npm start
```

Trong Expo CLI, nhấn `a` để mở Android hoặc quét mã QR bằng Expo Go. Chạy `npm run typecheck` để kiểm tra TypeScript.

Tài khoản demo: `user@smartfarm.vn` / `User123!`.

## Phạm vi

Ứng dụng có 5 tab (Trang chủ, Hạt giống, Khay của tôi, Đơn hàng, Tài khoản), các màn chi tiết và luồng thuê khay → giỏ hàng → thanh toán demo. Dữ liệu và thao tác được giữ trong bộ nhớ của ứng dụng; tải lại ứng dụng sẽ đặt lại trạng thái. Backend, Firebase Auth, SePay, cảm biến/MQTT, camera trực tiếp và push notification chưa được kết nối.

Tài liệu giao diện chuẩn nằm tại `docs/mobile-ui-specification.md`. Route ở `src/app`, giao diện ở `src/components`, dữ liệu ở `src/data/mock.ts`, state ở `src/hooks` và phép tính trong `src/lib/catalog.ts`.
