# SmartFarm — User Mobile Application UI Specification

> **Purpose:** Tài liệu này mô tả đầy đủ UI/UX cho **User Mobile Application** của SmartFarm.  
> Đây là tài liệu tham chiếu dành cho Codex/Developer khi triển khai bằng **React Native + TypeScript + Expo**.  
> Tài liệu mô tả **cần xây gì** về giao diện, điều hướng, nội dung, tương tác, trạng thái và mock data; không ràng buộc chi tiết implementation nếu không được nêu rõ.

---

# 1. Project Overview

## 1.1 Application Purpose

SmartFarm là ứng dụng nông nghiệp đô thị bằng tiếng Việt, tập trung vào trải nghiệm người dùng trên điện thoại.

Người dùng có thể:

- Thuê khay trồng rau mầm được SmartFarm quản lý và giám sát bằng IoT.
- Chọn giống/hạt giống phù hợp với nhu cầu.
- Mua sản phẩm hạt giống.
- Theo dõi khay từ xa qua camera và dữ liệu cảm biến.
- Theo dõi nhiệt độ, độ ẩm, tiến trình sinh trưởng và số ngày còn lại đến thu hoạch.
- Theo dõi đơn hàng và lịch giao hàng.
- Nhận thông báo liên quan đến khay, thanh toán và giao hàng.
- Quản lý hồ sơ cá nhân.

## 1.2 Mobile Design Direction

Ứng dụng Mobile kế thừa ngôn ngữ thiết kế của User Web nhưng phải được chuyển đổi thành trải nghiệm **mobile-native**, không phải bản Web thu nhỏ.

### Aesthetic

- Premium
- Clean
- Editorial agritech
- Hiện đại
- Chuyên nghiệp
- Đáng tin cậy
- Không cartoon
- Không excessive glassmorphism

### Mobile UX Principles

- Ưu tiên nội dung quan trọng nhất lên đầu màn hình.
- Các tác vụ chính phải nằm trong vùng thao tác thuận tiện bằng ngón tay.
- Hạn chế section dài kiểu landing page Web.
- Không sử dụng desktop header/footer.
- Điều hướng chính qua Bottom Tabs.
- Detail/configuration screen dùng Stack navigation.
- Card, button và input phải có touch target đủ lớn.
- Không overflow ngang.
- Hỗ trợ Safe Area trên cả iOS và Android.
- Tối ưu chính cho màn hình rộng khoảng 360–430 px.

## 1.3 Technology Target

- React Native
- TypeScript
- Expo
- Expo Router
- NativeWind
- react-native-reanimated
- lucide-react-native
- react-native-safe-area-context
- react-native-svg
- expo-image
- Inter font

## 1.4 Main Feature Groups

| Group | Screens |
|---|---|
| Auth | Sign In, Sign Up |
| Main Navigation | Home, Seeds, My Trays, Orders, Profile |
| Discovery | Seeds, Seed Detail |
| Tray Rental | Rent Tray, Rent Tray Config, Cart, Checkout, Payment Success |
| Tray Monitoring | My Trays, Tray Detail |
| Order & Delivery | Orders, Order Detail, Delivery |
| Account | Notifications, Profile |

---

# 2. Design System

## 2.1 Typography

Font chính: **Inter**

| Usage | Size | Weight |
|---|---:|---:|
| Screen title | 28–32 px | 700 |
| Section heading | 20–24 px | 700 |
| Card title | 16–18 px | 600–700 |
| Body | 14–16 px | 400 |
| Label | 12–14 px | 600 |
| Caption | 11–12 px | 400–600 |
| Button | 14–16 px | 600 |

Quy tắc:

- Dùng `font-bold` cho heading lớn và giá tiền/KPI.
- Dùng monospace cho mã đơn, mã khay, timestamp nếu cần.
- Không dùng decorative serif.
- Nội dung UI hoàn toàn bằng tiếng Việt.

## 2.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#4F8F68` | Button, active tab, icon, progress |
| Primary Dark | `#3F7655` | Pressed state, dark action |
| Light Green | `#E8F3EB` | Badge, icon bg, selected state |
| Extra Light | `#F3F8F4` | Screen background, sub-card |
| Dark Green | `#1A2E1F` | Dark section, primary dark text |
| Dark Green Mid | `#2A3F2F` | Dark cards |
| Dark Green Deep | `#2A4A33` | Gradient / dark surface |
| Text Primary | `#1A2E1F` | Main text |
| Text Secondary | `#374151` | Secondary body |
| Muted | `#6B7280` | Hint, description |
| Light Muted | `#9CA3AF` | Timestamp, disabled |
| Warning | `#F59E0B` | Temperature, savings |
| Success | `#4F9D69` | Success status |
| Danger | `#EF5350` | Delete, error |
| Info | `#3B82F6` | Humidity, info |
| Border | `#E8F3EB` | Card/input divider |
| White | `#FFFFFF` | Surface |

## 2.3 Spacing

Base grid: 4 px.

Khoảng cách chính:

- 4
- 8
- 12
- 16
- 20
- 24
- 32

Mobile screen horizontal padding mặc định:

- 16 px trên điện thoại nhỏ.
- 20 px nếu màn hình rộng hơn.

Card padding:

- 16–20 px.

Section gap:

- 24–32 px.

## 2.4 Radius

| Element | Radius |
|---|---|
| Large cards | 16–20 px |
| Buttons | 12 px |
| Inputs | 12 px |
| Badges | 8 px hoặc pill |
| Avatar | full |
| Image cards | 16 px |

## 2.5 Shadows

- Rất nhẹ.
- Không dùng heavy drop-shadow.
- Card chính chủ yếu dùng border.
- Dùng elevation/shadow nhẹ khi cần phân tách surface.

## 2.6 Buttons

### Primary

- Background `#4F8F68`
- Text white
- Pressed `#3F7655`
- Min height khoảng 48 px
- Radius 12 px
- Font 14–16 px / weight 600

### Secondary

- Background `#E8F3EB`
- Text `#4F8F68`

### Outline

- Transparent/white
- Border `#E8F3EB`
- Text `#4F8F68`

### Danger

- White/transparent
- Border `#EF5350`
- Text `#EF5350`

## 2.7 Inputs

- Height khoảng 48–52 px
- Background `#F3F8F4`
- Border `#E8F3EB`
- Radius 12 px
- Padding horizontal 14–16 px
- Font 14–16 px
- Placeholder `#9CA3AF`
- Focus/active border Primary
- Error border Danger

TextArea:

- Min-height khoảng 96–120 px
- Text align top

## 2.8 Cards

Standard card:

- White background
- Border `#E8F3EB`
- Radius 16 px
- Padding 16–20 px

Dark card:

- Background `#2A3F2F`
- Text white / muted green

## 2.9 Status Badge

Pill/chip nhỏ:

- 11–12 px
- Font weight 600
- Padding horizontal 8–10 px
- Padding vertical 4–6 px

Color variants:

| Name | Background | Text |
|---|---|---|
| Green | `#E8F3EB` | `#4F8F68` |
| Blue | `#EFF6FF` | `#3B82F6` |
| Red | `#FEF2F2` | `#EF5350` |
| Yellow | `#FFFBEB` | `#F59E0B` |
| Purple | `#F5F3FF` | `#7C3AED` |
| Gray | `#F9FAFB` | `#6B7280` |

## 2.10 Icons

Dùng `lucide-react-native`.

- Outline icons.
- Stroke nhất quán.
- Inline: 14–16 px
- Action button: 18–20 px
- Tab icon: 22–24 px
- Feature icon: 24–28 px
- Success icon: 36–44 px

Không dùng emoji làm icon UI.

---

# 3. Mobile Navigation Architecture

## 3.1 Root Navigation

Dùng Expo Router.

Navigation chia thành:

- Auth group
- Main tab group
- Stack detail/configuration screens

## 3.2 Bottom Tabs

Sau khi đăng nhập, Bottom Tabs gồm 5 mục:

1. Trang chủ
2. Hạt giống
3. Khay của tôi
4. Đơn hàng
5. Tài khoản

Tab bar:

- White background
- Border-top nhẹ
- Safe Area aware
- Active `#4F8F68`
- Inactive `#9CA3AF`
- Icon Lucide
- Label tiếng Việt
- Không quá cao

Gợi ý icon:

- Home → `Home`
- Seeds → `Sprout` hoặc `Leaf`
- My Trays → `Package` / `Boxes`
- Orders → `ClipboardList`
- Profile → `User`

## 3.3 Stack Screens

Các màn không phải tab chính mở bằng Stack:

- Seed Detail
- Rent Tray
- Rent Tray Config
- Cart
- Checkout
- Payment Success
- Tray Detail
- Order Detail
- Delivery
- Notifications
- Sign In
- Sign Up

## 3.4 Suggested Expo Router Tree

```text
app/
├── _layout.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── seeds.tsx
│   ├── my-trays.tsx
│   ├── orders.tsx
│   └── profile.tsx
├── seeds/
│   └── [id].tsx
├── rent-tray/
│   ├── index.tsx
│   └── [id].tsx
├── my-trays/
│   └── [id].tsx
├── orders/
│   └── [id].tsx
├── cart.tsx
├── checkout.tsx
├── payment-success.tsx
├── delivery.tsx
└── notifications.tsx
```

---

# 4. Global Mobile Layout

## 4.1 Safe Area

- Bắt buộc dùng Safe Area.
- Không để content chạm notch.
- Không để tab bar đè nội dung.
- Screen có custom top header phải cân top inset.
- Modal/detail action dưới đáy phải cân bottom inset.

## 4.2 Screen Container

Mỗi screen:

- Background mặc định white hoặc `#F3F8F4`.
- Padding horizontal 16–20 px.
- Không bọc toàn app trong một ScrollView.
- Mỗi màn tự quản lý scroll.

## 4.3 Screen Header

Không dùng Web Header.

Các tab screen có thể dùng custom header nhẹ:

- Title bên trái
- Optional action icon bên phải

Ví dụ Home:

- SmartFarm logo/name
- Bell icon
- Avatar

Detail screen:

- Back button
- Title hoặc code
- Optional action

## 4.4 Footer

Không có Footer kiểu Web.

Bottom Tabs đóng vai trò navigation chính.

## 4.5 Lists

Ưu tiên:

- `FlatList` cho Seeds
- `FlatList` cho My Trays
- `FlatList` cho Orders
- `FlatList` cho Notifications

Dùng `ScrollView` cho detail/configuration screen có nội dung tuần tự.

---

# 5. Screen Specifications

# 5.1 Sign In

## Purpose

Đăng nhập User Mobile.

## Layout

Single-column mobile form.

### Sections

1. Logo SmartFarm
2. Heading "Đăng nhập"
3. Mô tả ngắn
4. Email input
5. Password input
6. "Quên mật khẩu?"
7. Primary button "Đăng nhập"
8. Divider "hoặc"
9. Google visual button
10. Link "Chưa có tài khoản? Đăng ký ngay"

## Interaction

- Controlled form
- KeyboardAvoidingView
- Show/hide password
- Validate required fields
- Mock login → Main Tabs
- Error state nếu sai tài khoản

## Mock User

```text
user@smartfarm.vn
User123!
```

Không lưu password vào session.

---

# 5.2 Sign Up

## Layout

Single-column scroll form.

Fields:

- Họ và tên
- Email
- Số điện thoại
- Mật khẩu
- Xác nhận mật khẩu nếu implementation dùng
- Điều khoản
- Button "Tạo tài khoản"
- Google visual button
- Link "Đã có tài khoản? Đăng nhập"

## UX

- KeyboardAvoidingView
- Scroll khi bàn phím mở
- Input không bị keyboard che
- Validation cơ bản bằng mock state

---

# 5.3 Home

## Purpose

Mobile Dashboard chính, không phải landing page 11 section của Web.

## Layout Order

### 1. Top Header

Left:

- SmartFarm logo/name
- Greeting:
  - "Chào buổi sáng,"
  - tên user

Right:

- Notifications button với unread dot
- Avatar

### 2. Compact Hero

Dark green / image-backed card.

Content:

- Badge "IoT Farming · Giám sát 24/7"
- Heading "Trồng rau mầm thông minh giữa đô thị"
- Description ngắn
- CTA "Thuê khay ngay"

Không dùng desktop two-column hero.

### 3. Active Tray Summary

Nếu có khay:

Card lớn hiển thị:

- Camera image
- Status badge
- Tray code
- Seed name
- Temperature
- Humidity
- Harvest progress
- Days remaining
- CTA "Xem chi tiết"

Nếu không có khay:

Empty CTA "Bắt đầu thuê khay"

### 4. Quick Actions

Grid 2×2:

- Thuê khay
- Hạt giống
- Đơn hàng
- Thông báo

Mỗi action:

- Icon
- Label
- Tap target ≥ 44 px

### 5. Seed Preview

Header:

- "Hạt giống nổi bật"
- "Xem tất cả"

Horizontal card list hoặc compact vertical cards.

Hiển thị khoảng 3 sản phẩm đầu.

### 6. IoT Features

Compact horizontal/2×2 feature cards:

- Nhiệt độ
- Độ ẩm
- Camera
- Tự động hóa

### 7. Knowledge / Tips

2–3 compact article cards.

Không đưa toàn bộ Testimonials/FAQ/11 Web sections vào Mobile Home.

---

# 5.4 Seeds

## Purpose

Danh sách hạt giống.

## Layout

- Screen title "Hạt giống"
- Search input
- Horizontal category chips
- Sort/filter trigger
- Seed list

## Category Chips

Horizontal ScrollView:

- Tất cả
- Oleaginous
- Legume
- Root
- Cruciferous
- Cereal

Active:

- Primary background
- White text

## Seed List

Ưu tiên `FlatList`.

1 column là default an toàn.

Có thể 2 columns nếu card vẫn giữ readability trên màn rộng.

### Seed Card

- Image
- Badge
- Difficulty
- Name
- Short description
- Nutrition chips tối giản
- Price
- Grow days
- CTA "Chi tiết"
- Optional cart icon/action

## Interaction

- Search realtime
- Category filter
- Sort
- Empty state

---

# 5.5 Seed Detail

## Layout

Single-column ScrollView.

Order:

1. Back header
2. Large image
3. Category/badge
4. Seed name
5. Description
6. Nutrition chips
7. Info cards:
   - Thời gian
   - Độ khó
   - Đơn vị
8. Price
9. Quantity stepper
10. Total
11. Primary "Thêm vào giỏ hàng"
12. Secondary "Thuê khay trồng"
13. Usage Guide
14. Related Seeds

## Usage Guide

3 vertical numbered rows/cards:

1. Ngâm hạt
2. Gieo vào khay
3. Tưới và chờ

## Interaction

Quantity min 1.

Related seeds dùng horizontal list.

---

# 5.6 Rent Tray

## Purpose

Flow cấu hình thuê khay tối ưu cho Mobile.

## Layout

Vertical step-like flow:

1. Header + intro
2. Chọn giống
3. Số lượng khay
4. Discount tiers
5. Thời gian thuê
6. Included features
7. Order summary
8. CTA

Không dùng sticky sidebar.

## Seed Selection

Horizontal cards hoặc 2-column grid nhỏ.

Selected state:

- Primary border
- Light green bg
- "Đã chọn"

## Quantity

Large stepper:

- Minus
- Number
- Plus

## Discount Tiers

- 1–2: 0%
- 3–5: 5%
- 6–9: 10%
- 10+: 15%

Base price:

- 350,000 VND / tray / month

## Duration

Buttons/cards:

- 1 tháng
- 2 tháng
- 3 tháng

2/3 tháng có badge "Tiết kiệm hơn" nếu phù hợp.

## Included Features

Rows:

- Camera HD
- Temperature sensor
- Automatic watering
- IoT dashboard
- Alerts
- Technical support

## Order Summary

Bottom card:

- Seed
- Qty
- Duration
- Unit price
- Discount
- Total

CTA:

- Thêm vào giỏ
- Thanh toán ngay

---

# 5.7 Rent Tray Config

## Purpose

Alternative configuration screen.

Khác Rent Tray chính:

- Có ghi chú TextArea
- Có config context cụ thể theo selected tray/seed nếu có
- Vẫn vertical mobile form
- Không dùng desktop breadcrumb; dùng stack back header

---

# 5.8 Cart

## Layout

- Header "Giỏ hàng"
- Item count
- Cart items
- Add-more shortcuts
- Order summary
- Checkout CTA

## Cart Item

- 72–80 px image
- Type badge
- Name
- Quantity stepper
- Price
- Remove icon

## Order Summary

- Subtotal
- Shipping
- Coupon
- Total
- Primary CTA "Tiến hành thanh toán"

## Empty State

- Icon
- "Giỏ hàng trống"
- Description
- CTA "Mua hạt giống ngay"

---

# 5.9 Checkout

## Layout

Single-column ScrollView.

### Delivery Information

Fields:

- Họ tên
- Số điện thoại
- Email
- Địa chỉ
- Ghi chú

### Payment Methods

Selectable cards:

- Chuyển khoản ngân hàng
- Ví điện tử (visual only)
- COD

Selected:

- Primary border
- Extra light bg

Nếu Bank:

- Hiển thị QR mock block

### Order Summary

Bottom card:

- Items
- Subtotal
- Shipping
- Total
- Security note
- "Xác nhận thanh toán"

---

# 5.10 Payment Success

## Layout

Centered single-column.

- Large success icon
- "Thanh toán thành công!"
- Thank-you text
- Order code pill
- Summary card
- Button "Xem đơn hàng"
- Button "Khay của tôi"
- Link "Về trang chủ"

Không cần Bottom Tabs bắt buộc trong thời điểm confirmation nếu flow thiết kế chọn hidden tabs.

---

# 5.11 My Trays

## Purpose

Dashboard các khay đang thuê.

## Layout

- Screen title
- CTA thuê thêm khay
- Compact KPI section
- Tray list

## KPI

Có thể dùng horizontal scroll hoặc 2×2 grid:

- Tổng khay
- Đang trồng
- Sẵn thu hoạch
- Nhiệt độ TB

## Tray Card

- Camera image
- Status badge
- LIVE indicator
- Tray code
- Location
- Seed name
- Temperature
- Humidity
- Progress
- Days remaining
- Last update

Tap toàn card → Tray Detail.

Dùng `FlatList`.

---

# 5.12 Tray Detail

## Purpose

Mobile IoT dashboard cho một khay.

## Top Header

- Back
- Tray code
- Status

## Hero Camera

Large image card:

- Live badge
- Last update
- Timestamp overlay

## Sensor Summary

2×2 grid:

- Temperature
- Humidity
- Days planted
- Days remaining

## Tabs

- Tổng quan
- Môi trường
- Hình ảnh
- Lịch sử

Nếu không đủ chiều ngang:

- Horizontal scroll tabs

### Tổng quan

- Camera summary
- Progress
- System status rows:
  - Tưới
  - LED
  - Temperature sensor
  - Network

### Môi trường

Không dùng desktop table.

Mỗi reading là row/card:

- Time
- Temperature
- Humidity
- Status

### Hình ảnh

2-column image gallery.

### Lịch sử

Vertical timeline.

## Actions

- Lên lịch thu hoạch
- Giao hàng

---

# 5.13 Orders

## Layout

- Screen title
- Search
- Horizontal status filter
- Order list

Filters:

- Tất cả
- Chờ xử lý
- Hoàn thành
- Đã hủy

## Order Card

- Code
- Status
- Date
- Total
- Item summary
- Payment method
- Address short text
- CTA "Xem chi tiết"

Dùng `FlatList`.

---

# 5.14 Order Detail

## Layout

- Back header
- Status block
- Order code
- Date
- Tracking timeline
- Product items
- Total
- Payment information
- Delivery information
- Delivery schedule CTA

## Tracking

Mobile ưu tiên vertical timeline hoặc horizontal scroll nếu giữ Web semantics.

Khuyến nghị vertical để đọc tốt hơn.

Steps:

1. Đặt hàng
2. Xác nhận
3. Đang xử lý
4. Đang giao
5. Hoàn thành

## Items

Không dùng desktop table.

Mỗi item là row:

- Name
- Qty
- Unit price
- Line total

---

# 5.15 Delivery

## Layout

- Screen title
- Delivery card list

Card:

- Order code
- Item summary
- Status
- Expected date
- Address

Nếu "Chờ xác nhận":

- Xác nhận lịch
- Đổi lịch

---

# 5.16 Notifications

## Layout

- Screen title
- Unread count
- "Đánh dấu tất cả đã đọc"
- Notification list

Dùng `FlatList`.

## Notification Card

- Type icon
- Title
- Body
- Time
- Unread indicator

Unread:

- Extra-light green bg
- Green accent/dot
- Bold title

Tap:

- Mark as read

---

# 5.17 Profile

## Layout

### User Summary

- Avatar
- Name
- Email
- Stats:
  - Active trays
  - Total orders
  - Member since

### Personal Information

- Name
- Phone
- Email
- Address
- Save button

### Change Password

- Current password
- New password
- Confirm password

### Shortcuts

- Notifications
- Delivery address
- Orders if useful

### Danger Zone

- Delete account button

## Interaction

Save profile:

- default
- loading
- success "Đã lưu!"
- reset after 2 s

---

# 6. Reusable Mobile Components

## 6.1 ScreenContainer

- Safe Area aware
- common horizontal padding
- optional background

## 6.2 AppHeader

Variants:

- Tab/home header
- Detail header with back button

## 6.3 PrimaryButton / SecondaryButton

Reusable button primitives.

## 6.4 StatusBadge

6 color variants.

## 6.5 SeedCard

Variants:

- catalog
- compact horizontal
- related

## 6.6 TrayCard

Used in My Trays and Home active tray preview.

## 6.7 KpiCard

Used in My Trays and Tray Detail.

## 6.8 ProgressBar

Animated optional using Reanimated.

## 6.9 SegmentedTabs

Used in Tray Detail and Orders.

## 6.10 FormField

Contains label + input child + optional error/hint.

## 6.11 SearchBar

Used in Seeds and Orders.

## 6.12 QuantityStepper

Used in Seed Detail, Rent Tray, Cart.

## 6.13 SectionHeader

Title + optional action.

## 6.14 EmptyState

Generic empty UI.

## 6.15 OrderSummaryCard

Used in Rent Tray, Cart, Checkout.

---

# 7. Mock Data Requirements

## 7.1 Seeds

```ts
type Seed = {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  price: number;
  unit: string;
  badge: string;
  badgeColor: "green" | "blue" | "red" | "purple";
  category: string;
  growDays: number;
  difficulty: "Dễ" | "Rất dễ" | "Trung bình";
  nutrition: string[];
  img: string;
};
```

6 seed products:

- Hướng Dương
- Đậu Hà Lan
- Củ Cải Đỏ
- Broccoli
- Đậu Xanh
- Lúa Mì

## 7.2 Rental Pricing

```ts
type RentalPricing = {
  basePrice: number;
  discounts: {
    min: number;
    max?: number;
    pct: number;
    label: string;
  }[];
};
```

Values:

- Base: 350000 VND/tray/month
- 1–2: 0%
- 3–5: 5%
- 6–9: 10%
- 10+: 15%

## 7.3 Tray

```ts
type Tray = {
  id: string;
  code: string;
  seedName: string;
  status: "Đang trồng" | "Nảy mầm" | "Sẵn thu hoạch";
  statusColor: string;
  location: string;
  temp: number;
  humidity: number;
  daysLeft: number;
  totalDays: number;
  lastUpdate: string;
  img: string;
};
```

## 7.4 Order

```ts
type Order = {
  id: string;
  code: string;
  status: "Đang xử lý" | "Hoàn thành" | "Đã hủy";
  statusColor: string;
  date: string;
  total: number;
  items: {
    name: string;
    qty: number;
    price: number;
  }[];
  payment: string;
  address: string;
};
```

## 7.5 Delivery

```ts
type Delivery = {
  id: string;
  orderCode: string;
  items: string;
  status: "Đang giao" | "Đã giao" | "Chờ xác nhận";
  statusColor: string;
  expectedDate: string;
  address: string;
};
```

## 7.6 Notification

```ts
type NotificationItem = {
  id: string;
  type: "tray" | "payment" | "delivery" | "reminder";
  title: string;
  body: string;
  time: string;
  read: boolean;
};
```

## 7.7 Cart Item

```ts
type CartItem = {
  id: string;
  type: "seed" | "tray";
  name: string;
  img: string;
  price: number;
  qty: number;
};
```

## 7.8 User Profile

```ts
type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarInitial: string;
  activeTrays: number;
  totalOrders: number;
  memberSince: string;
};
```

---

# 8. Mobile Interaction Summary

| Interaction | Result |
|---|---|
| Bottom Tab tap | Chuyển main screen |
| Seed card tap | Seed Detail |
| Search Seeds | Filter realtime |
| Category chip tap | Single category filter |
| Qty +/- | Update quantity & total |
| Rental seed tap | Select seed |
| Duration tap | Update duration |
| Cart remove | Remove item |
| Payment method tap | Select method |
| Checkout submit | Payment Success |
| Tray card tap | Tray Detail |
| Tray tab tap | Switch tab |
| Order card tap | Order Detail |
| Notification tap | Mark read |
| Mark all notifications | Mark all read |
| Save Profile | 2s success state |
| Sign In | Main Tabs |
| Sign Up | Main Tabs |
| Back button | Stack back navigation |

---

# 9. Reanimated Usage

Animation phải nhẹ, nhanh và professional.

Có thể dùng cho:

- Hero/card entrance nhẹ
- Pressed card feedback
- Progress bar
- Tab indicator
- Accordion nếu có
- Success icon
- Notification state transition

Không lạm dụng.

Không dùng animation chỉ để trang trí nếu làm giảm usability.

---

# 10. Image Rules

Dùng `expo-image`.

Image subject:

- Microgreens
- Indoor farm
- Seed tray
- Sensors
- Camera feed
- Seed products

Không dùng generic rice field/farm ảnh không liên quan.

Image cards:

- cover mode
- rounded corners
- fallback/placeholder

Remote mock URLs có thể tái sử dụng từ Web spec.

---

# 11. Form & Keyboard Rules

Các màn form:

- Sign In
- Sign Up
- Checkout
- Profile
- Rent Tray Config

Phải:

- dùng KeyboardAvoidingView khi cần
- scroll được nếu bàn phím che field
- dùng keyboardType phù hợp:
  - email-address
  - phone-pad
- password dùng secureTextEntry
- touch target cho show/hide đủ lớn

---

# 12. Performance Rules

- FlatList cho list dài.
- Không map list lớn bên trong ScrollView.
- Dùng keyExtractor ổn định.
- Expo Image cho ảnh.
- Tránh nested vertical ScrollView.
- Horizontal scroll chỉ dùng cho:
  - chips
  - related items
  - KPI nếu cần
  - tabs nếu thiếu width

---

# 13. Source Organization

Project Mobile ưu tiên:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── home/
│   ├── seeds/
│   ├── rental/
│   ├── trays/
│   ├── orders/
│   ├── notifications/
│   ├── profile/
│   └── auth/
├── data/
├── constants/
├── hooks/
├── lib/
└── types/
```

Quy tắc:

- `src/app` chỉ route/navigation composition.
- UI feature nằm trong `src/components/<feature>`.
- Generic primitives nằm trong `src/components/ui`.
- Mock data không đặt trong JSX.
- Domain calculation/search/filter/price logic phải tách khỏi screen nếu có thể.
- Không để một screen component quá lớn.
- Không import runtime code từ `smartfarm-fe`.

---

# 14. Mobile-Specific Differences from Web

## Không sử dụng trực tiếp

- Web Header
- Web Footer
- Sticky desktop sidebars
- Desktop tables rộng
- Hover interactions
- Multi-column desktop layouts
- CSS scrollbar
- Breakpoints desktop
- Web hero 2-column
- 11-section long landing Home

## Chuyển đổi

| Web | Mobile |
|---|---|
| Header nav | Bottom Tabs + App Header |
| Footer | Bỏ |
| Sticky sidebar | Bottom/inline summary card |
| Desktop table | Mobile rows/cards |
| Hover | Press feedback |
| 3–4 column grids | 1–2 columns / horizontal list |
| Wide tabs | Horizontal scroll tabs |
| Breadcrumb | Back header |
| Landing Home | Dashboard Home |
| Two-column Auth | Single-column auth |
| Right-side IoT mockup | Active Tray summary |

---

# 15. Target Device Sizes

Kiểm tra tối thiểu:

- 360 × 800
- 390 × 844
- 412 × 915

Yêu cầu:

- Không horizontal overflow
- Không content bị notch che
- Không CTA bị nav bar che
- Bottom Tabs không đè list content
- Form usable khi keyboard mở

---

# 16. Validation Checklist

## Navigation

- [ ] Sign In → Main Tabs
- [ ] 5 Bottom Tabs hoạt động
- [ ] Detail screens back đúng
- [ ] Notifications mở đúng
- [ ] Cart/Checkout flow hoạt động
- [ ] Payment Success navigation đúng

## UX

- [ ] Safe Area đúng
- [ ] Keyboard không che input
- [ ] Touch target chính ≥ khoảng 44 px
- [ ] Không overflow ngang
- [ ] Không copy desktop layout trực tiếp

## UI

- [ ] Inter
- [ ] Primary `#4F8F68`
- [ ] Cards/radius đồng bộ
- [ ] Lucide icons nhất quán
- [ ] Expo Image dùng cho ảnh
- [ ] Status colors nhất quán

## Lists

- [ ] Seeds dùng FlatList khi phù hợp
- [ ] My Trays dùng FlatList
- [ ] Orders dùng FlatList
- [ ] Notifications dùng FlatList

## Mock

- [ ] Seeds
- [ ] Rental pricing
- [ ] Trays
- [ ] Orders
- [ ] Deliveries
- [ ] Notifications
- [ ] Cart
- [ ] Profile
- [ ] Auth

---

# 17. Screen Checklist

- [ ] Sign In
- [ ] Sign Up
- [ ] Home
- [ ] Seeds
- [ ] Seed Detail
- [ ] Rent Tray
- [ ] Rent Tray Config
- [ ] Cart
- [ ] Checkout
- [ ] Payment Success
- [ ] My Trays
- [ ] Tray Detail
- [ ] Orders
- [ ] Order Detail
- [ ] Delivery
- [ ] Notifications
- [ ] Profile

---

# 18. Current Scope Notes

Ở giai đoạn UI/demo hiện tại:

- Backend chưa được kết nối.
- Firebase Auth chưa được kết nối.
- SePay chưa được kết nối.
- Push notification thật chưa được kết nối.
- Sensor/MQTT data đang là mock.
- Camera feed đang dùng mock image.
- Cart/payment/profile changes là local/demo state.
- Mobile app chỉ dành cho **User**, không có Admin/Staff.

Mục tiêu hiện tại là hoàn thiện **frontend mobile UI + navigation + mock interactions** sao cho sau này có thể thay mock data bằng API thật mà không phải thiết kế lại toàn bộ giao diện.
