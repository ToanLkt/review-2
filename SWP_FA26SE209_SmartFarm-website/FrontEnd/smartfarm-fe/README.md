# SmartFarm · Admin Dashboard

Frontend mô phỏng hệ thống quản lý nông trại rau mầm đô thị. Dashboard tại `/admin/dashboard`; các mô-đun khác có trang “Trang đang được phát triển”.

## Chạy dự án

Yêu cầu Node.js 20.9 trở lên và npm. Chạy trong `FrontEnd/smartfarm-fe`:

```bash
npm ci
npm run dev
```

Mở http://localhost:3000/admin/dashboard. Font Inter được tải ở bước biên dịch qua `next/font/google`, cần kết nối Google Fonts lần đầu.

```bash
npm run lint
npm test
npm run build
npm start
```

Build dùng Webpack vì Turbopack bị môi trường kiểm thử chặn mở cổng nội bộ. Next.js, React và toàn bộ dependency được khóa trong `package-lock.json`.

## Cấu trúc

- `app/admin`: Server layouts, dashboard route và placeholder dùng chung.
- `components/admin`: sidebar mint, header, tìm kiếm và tài khoản.
- `components/dashboard`: các vùng tương tác, Sheet chi tiết và state mô phỏng dùng chung.
- `components/ui`: component shadcn/ui chính thức, đã Việt hóa và tùy chỉnh theme.
- `lib/types.ts`, `lib/mock-data.ts`: mô hình phân biệt đơn thuê khay và đơn mua hạt giống.
- `lib/dashboard-data.ts`: tính KPI, lọc dữ liệu và tạo CSV UTF-8 BOM.
- `tests`: kiểm thử tính nhất quán dữ liệu, phạm vi lọc và xuất CSV.

## Quy tắc dữ liệu và thao tác

Dữ liệu cố định tại 09:30 ngày 15/09/2026, tránh sai lệch hydration. Không kết nối backend, xác thực hay cảm biến thật. State dùng chung trong admin layout, giữ khi chuyển mô-đun và mất khi tải lại trang.

- Khu vực lọc khay, thiết bị, cảnh báo, công việc; biểu đồ theo khu vực đã chọn.
- Khoảng ngày lọc biểu đồ, đơn hàng và hoạt động. Đơn hàng không lọc theo khu vực; đơn bán hạt giống không có khu trồng.
- KPI là ảnh chụp trạng thái hiện tại, không thay đổi theo khoảng ngày hay bộ lọc bảng. Tổng đơn chờ xử lý bao gồm toàn nông trại.
- Cảnh báo có tiếp nhận, ghi chú và giải quyết riêng. Đọc thông báo chỉ đánh dấu đã đọc.
- Chỉ tiếp nhận đơn đã xác nhận thanh toán, chưa hoàn tất/hủy. Mỗi đợt giao rau thuộc cùng đơn thuê khay; đơn hạt giống chỉ có sản phẩm đóng gói và vận chuyển.
- CSV bao gồm dữ liệu theo bộ lọc khu vực, ngày, tìm kiếm khay, giai đoạn và tab đơn hàng. KPI trong CSV ghi rõ phạm vi snapshot.
- Làm mới cập nhật thời gian hiển thị, không giả lập số đo trực tiếp. Thiết bị offline giữ thời điểm nhận cuối và nhãn “Dữ liệu cũ”.
- Ảnh khay hiện dùng placeholder vì chưa có ảnh địa phương.

## Giao diện

Theme token trong `app/globals.css`. Sidebar 248px trên desktop, thu gọn trên tablet và drawer trên mobile. Bảng cuộn trong vùng riêng. Hỗ trợ bàn phím, tên truy cập, focus rõ ràng và reduced motion. Tìm kiếm nhanh bằng `Ctrl+K` hoặc `⌘K`.

---

## 📷 Hướng dẫn Tích hợp Camera Khay Rau (Smart Farm API)

Backend đã tích hợp đám mây **Cloudflare R2** và Public CDN tốc độ cao. URL ảnh trả về dạng `https://pub-7dfeb459c49842f69ca547ad3bb40357.r2.dev/snap_...jpg`, công khai, không bị chặn CORS và **không cần gửi Header Bearer Token khi load ảnh qua thẻ `<img>`**.

### 1. Dành cho Customer (Khách hàng xem khay rau mình thuê)

#### 1.1. Lấy ảnh mới nhất của khay

Dùng cho màn hình Dashboard, danh sách khay rau đang thuê hoặc trang chi tiết khay:

- **Endpoint**: `GET https://api.sumfas.id.vn/api/v1/rentals/{rentalId}/camera/latest`
- **Header**:
  ```http
  Authorization: Bearer <Customer_Token>
  ```
- **Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Latest camera snapshot retrieved",
    "data": {
      "snapshotId": 12,
      "deviceId": 2,
      "rentalId": 1,
      "imageUrl": "https://pub-7dfeb459c49842f69ca547ad3bb40357.r2.dev/snap_2_1_20261027083649092_eba8f97a71ef4352aaf808c3cc11fa57.jpg",
      "takenAt": "2026-10-27T08:36:50.3865829Z"
    }
  }
  ```
- **Xử lý khi khay chưa có ảnh (404 Not Found)**:
  - Backend trả status `404` với message: `"No snapshots found for this rental tray."`.
  - Frontend nên hiển thị giao diện placeholder thân thiện: hình ảnh minh họa khay rau mặc định kèm dòng chữ: _"Khay đang chờ camera ghi hình đợt đầu tiên"_.

#### 1.2. Lấy album / lịch sử ảnh quá trình phát triển của cây

Dùng cho tính năng Time-lapse, nhật ký sinh trưởng hoặc xem lịch sử các lần chụp:

- **Endpoint**: `GET https://api.sumfas.id.vn/api/v1/rentals/{rentalId}/camera/history?page=1&pageSize=20`
- **Header**:
  ```http
  Authorization: Bearer <Customer_Token>
  ```
- **Query Params**:
  - `page`: số trang (mặc định 1)
  - `pageSize`: số ảnh mỗi trang (mặc định 20)
- **Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "snapshotId": 12,
          "deviceId": 2,
          "rentalId": 1,
          "imageUrl": "https://pub-7dfeb459c49842f69ca547ad3bb40357.r2.dev/snap_2_1_20261027083649092_eba8f97a71ef4352aaf808c3cc11fa57.jpg",
          "takenAt": "2026-10-27T08:36:50.3865829Z"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```
  _(Danh sách đã được Backend sắp xếp giảm dần theo thời gian chụp, ảnh mới nhất đứng đầu)_.

---

### 2. Cách hiển thị ảnh trong React / Next.js

Vì `imageUrl` đã là URL CDN hoàn chỉnh, các bạn chỉ cần gắn trực tiếp vào thẻ `<img>` hoặc component `<Image />` của Next.js:

```tsx
// Ví dụ với thẻ <img> tiêu chuẩn:
<img
  src={snapshot.imageUrl}
  alt={`Khay rau ${rentalId}`}
  className="w-full h-64 object-cover rounded-xl shadow"
  loading="lazy"
/>
```

> **Lưu ý cấu hình `next.config.ts`**: Nếu dùng component `next/image` (`<Image src={snapshot.imageUrl} ... />`), cần thêm hostname CDN vào `next.config.ts`:
>
> ```ts
> const nextConfig: NextConfig = {
>   images: {
>     remotePatterns: [
>       { protocol: "https", hostname: "pub-*.r2.dev" },
>       { protocol: "https", hostname: "api.sumfas.id.vn" },
>     ],
>   },
> };
> ```

---

### 3. Dành cho Staff / Upload ảnh thủ công (hoặc màn hình Test)

Nếu Frontend có làm màn hình quản lý thiết bị IoT hoặc trang test cho phép Staff tải ảnh khay rau lên:

- **Endpoint**: `POST https://api.sumfas.id.vn/api/v1/iot/camera-snapshots/upload`
- **Header**:
  ```http
  X-Device-Key: a62fd05b923d4e547de7af643b3a5fec4b334dc15d6c9015
  ```
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: File ảnh binary (JPG, JPEG, PNG, WEBP, dung lượng <= 5MB).
  - `deviceId`: ID thiết bị camera (number, ví dụ `2`).
  - `rentalId`: ID hợp đồng thuê khay (number, ví dụ `1`).
  - `takenAt`: (Tùy chọn) thời gian chụp ISO 8601 string.
- **Ví dụ code FormData bằng JavaScript/TypeScript**:

  ```ts
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("deviceId", "2");
  formData.append("rentalId", "1");

  const res = await fetch(
    "https://api.sumfas.id.vn/api/v1/iot/camera-snapshots/upload",
    {
      method: "POST",
      headers: {
        "X-Device-Key": "a62fd05b923d4e547de7af643b3a5fec4b334dc15d6c9015",
      },
      body: formData,
    },
  );
  const data = await res.json();
  console.log("CDN Image URL:", data.data.imageUrl);
  ```
