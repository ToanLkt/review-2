# SmartFarm — User Application UI Specification

> **Purpose:** This document describes the complete UI/UX of the SmartFarm user-facing application.
> It is intended for a developer implementing the same interface in a Next.js project.
> It describes *what* to build (layout, content, interactions, design system) — not *how* the current codebase is structured.

---

# 1. Project Overview

## 1.1 Application Purpose

SmartFarm is a Vietnamese-language agritech platform for urban microgreen farming. Users can:
- Rent IoT-monitored growing trays managed by SmartFarm
- Buy microgreen seeds
- Monitor their trays remotely (temperature, humidity, camera feed)
- Schedule harvest and delivery

## 1.2 Design Style

- **Aesthetic:** Premium / clean / editorial agritech
- **Tone:** Professional, modern, trustworthy; not playful or cartoon-like
- **Typography:** Single font family (Inter) used throughout — no decorative serif
- **Color:** Dominant primary green (`#4F8F68`), white cards, dark green dark sections
- **Imagery:** Microgreens, seed trays, indoor farming — no generic field/crop imagery
- **Icons:** Outline monochrome SVG icons (Lucide style), consistent stroke weight
- **Language:** Vietnamese throughout (UI text, labels, error messages, placeholders)

## 1.3 Main Feature Groups

| Group | Screens |
|-------|---------|
| Discovery | Home, Seeds, Seed Detail |
| Tray Rental | Rent Tray, Rent Tray Config, Cart, Checkout, Payment Success |
| My Account | My Trays, Tray Detail, Orders, Order Detail, Delivery, Notifications, Profile |
| Auth | Sign In, Sign Up |

---

# 2. Design System

## 2.1 Typography

| Property | Value |
|----------|-------|
| Font family | `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif` |
| Google Fonts import | `Inter:ital,wght@0,400;0,500;0,600;0,700;0,800` |
| Base size | 16px (`1rem`) |
| Body text | 14px (`text-sm`), weight 400 |
| Small/caption | 11–12px (`text-xs`, `text-[11px]`), weight 400–600 |
| Label/subheading | 12px, weight 600, uppercase, tracking-widest |
| Heading H1 | 36–60px (`text-4xl`–`text-6xl`), weight 700 |
| Heading H2 | 30–36px (`text-3xl`–`text-4xl`), weight 700 |
| Heading H3 | 16–18px, weight 600–700 |
| Monospace | `ui-monospace`, `Cascadia Code`, `Source Code Pro` — used for order codes, tray codes, timestamps |
| Anti-aliasing | `-webkit-font-smoothing: antialiased` |

## 2.2 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary green | `#4F8F68` | Buttons, links, active states, icons, progress bars |
| Primary hover | `#3F7655` | Hover state for primary green elements |
| Light green | `#E8F3EB` | Chip backgrounds, badge backgrounds, icon bg |
| Extra light green | `#F3F8F4` | Section backgrounds, card fills, input fills |
| Dark green | `#1a2e1f` | Dark section backgrounds, primary text color |
| Dark green mid | `#2a3f2f` | Cards within dark sections |
| Dark green deep | `#2a4a33` | Hero gradient endpoint |
| Dark text | `#1a2e1f` | Primary body text |
| Mid text | `#374151` | Secondary text |
| Muted text | `#6b7280` | Descriptive text, placeholders |
| Light text | `#9ca3af` | Timestamps, hints, disabled |
| Dark section text | `#8fa89a` | Body text on dark backgrounds |
| Dark section muted | `#a3b8aa` | Secondary text on dark backgrounds |
| Warning amber | `#F59E0B` | Temperature values, savings labels |
| Success green | `#4F9D69` | Success badges, discount labels |
| Error red | `#EF5350` | Error states, danger zone |
| Info blue | `#3B82F6` | Humidity values, info badges |
| Border | `#e8f3eb` | Card borders, input borders, dividers |
| Background (page) | `#ffffff` | Default page background |
| Background (sections) | `#F3F8F4` | Alternating section fills |
| Background (dark) | `#1a2e1f` | IoT section, knowledge section, hero |

## 2.3 Spacing

- Base grid: 4px (`0.25rem`)
- Common gaps: 12px, 16px, 20px, 24px, 32px
- Section vertical padding: `py-16` (64px) to `py-20` (80px)
- Container horizontal padding: `px-6` (24px)
- Card padding: `p-5` (20px) or `p-6` (24px)
- Small inner gap: `gap-2` (8px) to `gap-4` (16px)

## 2.4 Container

- Max-width: `max-w-7xl` (1280px)
- Centering: `mx-auto`
- Horizontal padding: `px-6` at all breakpoints

## 2.5 Border & Radius

| Element | Radius |
|---------|--------|
| Cards | `rounded-2xl` (16px) |
| Buttons | `rounded-xl` (12px) or `rounded-lg` (8px) |
| Inputs / selects | `rounded-xl` (12px) |
| Badges / chips | `rounded-lg` (8px) or `rounded-full` (pill) |
| Avatar / icon squares | `rounded-full` or `rounded-xl` |
| Image containers | `rounded-2xl` |
| Default border color | `#e8f3eb` |
| Border width | `1px` |

## 2.6 Shadows

- Cards: `shadow-sm` (very subtle, only on elevated elements)
- Hover cards: `shadow-lg` / `shadow-md`
- Header: subtle border-bottom, no box-shadow
- No heavy drop shadows anywhere

## 2.7 Buttons

| Variant | Background | Text | Hover | Border |
|---------|-----------|------|-------|--------|
| Primary | `#4F8F68` | white | `#3F7655` | none |
| Secondary | `#E8F3EB` | `#4F8F68` | `#d1e8d8` | none |
| Outline | transparent | `#4F8F68` | `#f3f8f4` fill | `#e8f3eb` |
| Danger | transparent | `#EF5350` | light red fill | `#EF5350` |
| Ghost/link | transparent | `#4F8F68` | underline or gap shift | none |

- Padding: `px-4 py-2` (small), `px-6 py-3` (medium), `px-7 py-3.5` (large)
- Font: 14px, weight 600
- Disabled: `opacity-50 cursor-not-allowed`
- Transition: `transition-colors` (150ms)

## 2.8 Inputs

- Background: `#f3f8f4`
- Border: `1px solid #e8f3eb`
- Border radius: `rounded-xl`
- Focus ring: `outline-none ring-2 ring-[#4F8F68]/30 border-[#4F8F68]`
- Padding: `px-4 py-3`
- Font: 14px, regular
- Placeholder: `#9ca3af`
- Error: `ring-red-300 border-red-400`

## 2.9 Cards

Standard card:
- Background: white
- Border: `1px solid #e8f3eb`
- Radius: `rounded-2xl`
- Padding: `p-5` or `p-6`
- No shadow by default; `hover:shadow-md` or `hover:shadow-lg` on interactive cards

Dark card (inside dark sections):
- Background: `#2a3f2f`
- Radius: `rounded-2xl`
- No visible border

## 2.10 Badges / Status Chips

Inline pill component. Always `text-[11px] font-semibold px-2 py-0.5 rounded-lg`.

| Color name | Background | Text |
|-----------|-----------|------|
| green | `#E8F3EB` | `#4F8F68` |
| blue | `#EFF6FF` | `#3B82F6` |
| red | `#FEF2F2` | `#EF5350` |
| yellow | `#FFFBEB` | `#F59E0B` |
| purple | `#F5F3FF` | `#7C3AED` |
| gray | `#F9FAFB` | `#6B7280` |

Used for: seed badges, order status, tray status, difficulty levels, notification types.

## 2.11 Icons

- Style: Outline / stroke icons (Lucide-style), stroke-width 1.75
- Size contexts: 13–14px (inline/badge), 15–18px (buttons/cards), 20–24px (feature cards), 40px (success page hero icon)
- Color: inherits `currentColor`; explicitly set to `text-[#4F8F68]`, `text-white`, `text-[#F59E0B]`, `text-[#3B82F6]` etc.
- No filled icons except `Star` (filled amber on testimonial cards)

---

# 3. Global Layout

## 3.1 Header

- **Position:** Fixed/sticky at top, `z-50`, full width
- **Background:** `rgba(255,255,255,0.92)` with `backdrop-blur-md`
- **Border:** `border-b border-[#e8f3eb]`
- **Height:** 64px (`h-16`)
- **Inner:** `max-w-7xl mx-auto px-6`, full-height flex, space-between

**Left:**
- Logo: 32×32 green rounded-lg square with leaf icon + "SmartFarm" bold text (16px, dark green)

**Center (desktop only — hidden below lg):**
- Nav links: Trang chủ, Thuê khay, Hạt giống, Khay của tôi, Đơn hàng
- Active state: `bg-[#E8F3EB] text-[#4F8F68] rounded-lg px-3 py-1.5`
- Inactive: `text-[#6b7280] hover:text-[#4F8F68]`

**Right:**
- Search button (icon only)
- Bell icon → `/notifications` (red dot badge when unread)
- Cart icon → `/cart`
- User avatar circle (initials "N" on green bg) → `/profile`
- "Thuê khay ngay" primary button → `/rent-tray` (hidden below sm)
- Mobile: hamburger/X menu toggle replaces nav links

**Mobile menu (dropdown):**
- Full-width below header, white bg, border-bottom
- Same 5 nav links stacked vertically with padding
- Each link navigates and closes menu

## 3.2 Footer

- **Background:** `#1a2e1f` (dark green)
- **Padding:** `py-16`
- **Inner:** `max-w-7xl mx-auto px-6`
- **Layout:** 4-column grid on `md`, stacked on mobile

| Column | Content |
|--------|---------|
| Brand | Logo + "Nông nghiệp thông minh cho đô thị" tagline + 4 social icon buttons (FB/IG/YT/TT as text abbreviations in 32×32 rounded-lg dark buttons) |
| Quick links | 5 nav links (Trang chủ, Thuê khay, Hạt giống, Khay của tôi, Đơn hàng) |
| Contact | MapPin + Phone + Mail + Clock rows with icon + text |
| Support | FAQ, Chính sách bảo mật, Điều khoản, Hướng dẫn, Liên hệ |

**Bottom bar:** `border-t border-[#2a3f2f] mt-12 pt-8` — copyright left, green tagline right.

**Excluded from:** `/sign-in`, `/sign-up`, `/payment-success`

## 3.3 Main Content Area

- `flex-1` fills remaining height between header and footer
- Content areas use `max-w-7xl mx-auto px-6` — NOT full-bleed except hero sections and section backgrounds

## 3.4 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| `sm` | 640px | 2-col grids, "Thuê khay ngay" button visible in header |
| `md` | 768px | Footer becomes 4-col, table layouts adapt |
| `lg` | 1024px | Main 2-3 col layouts activate, desktop nav visible, sidebar panels |

---

# 4. Navigation / Routes

| Screen | URL | From | To |
|--------|-----|------|----|
| Home | `/` | Auth success, Logo, PaymentSuccess back links | `/rent-tray`, `/seeds`, `/my-trays` |
| Seeds | `/seeds` | Header nav, Home hero button, SeedDetail related | `/seeds/:id`, `/cart` |
| Seed Detail | `/seeds/:id` | Seeds grid, Home seed section, RentTray related | `/cart`, `/rent-tray`, `/seeds/:id` (related) |
| Rent Tray | `/rent-tray` | Header CTA, Home CTAs, Cart link | `/cart`, `/checkout`, `/rent-tray/:id` |
| Rent Tray Config | `/rent-tray/:id` | Rent Tray page | `/cart`, `/checkout` |
| Cart | `/cart` | Header cart icon, Seeds "Add to cart", RentTray CTAs | `/checkout`, `/seeds`, `/rent-tray` |
| Checkout | `/checkout` | Cart CTA, RentTray "Thanh toán ngay" | `/payment-success` |
| Payment Success | `/payment-success` | Checkout on submit | `/orders`, `/`, `/my-trays` |
| My Trays | `/my-trays` | Header nav, PaymentSuccess | `/my-trays/:id`, `/rent-tray` |
| Tray Detail | `/my-trays/:id` | My Trays cards | `/delivery` |
| Orders | `/orders` | Header nav, PaymentSuccess | `/orders/:id` |
| Order Detail | `/orders/:id` | Orders list | `/orders`, `/delivery` |
| Delivery | `/delivery` | Order Detail, TrayDetail "Giao hàng" | (static) |
| Notifications | `/notifications` | Header bell icon | (read-only) |
| Profile | `/profile` | Header user avatar | (save in-place) |
| Sign In | `/sign-in` | SignUp link | `/` (on login) |
| Sign Up | `/sign-up` | SignIn link | `/` (on register) |

---

# 5. Screen Specifications

---

## Home

### Purpose
Landing page / marketing hub introducing SmartFarm, showcasing the rental model, IoT technology, and converting visitors to tray renters or seed buyers.

### Layout
Full-width sections stacked vertically. Some sections are full-bleed with colored/image backgrounds. Content sections use `max-w-7xl` container. No sidebar.

### Sections (top → bottom)

#### Section 1 — Hero
- **Background:** `#0f1f14` with a full-bleed microgreens photo at 40% opacity, left-side gradient overlay (`from-[#0f1f14]/90 via-[#0f1f14]/60 to-transparent`)
- **Min-height:** 88vh
- **Layout:** 2-col grid (`lg`), single col below

**Left column:**
- Pill badge: pulsing green dot + "IoT Farming · Giám sát 24/7" (green tinted, bordered)
- H1: "Trồng rau mầm / **thông minh** / giữa đô thị" — "thông minh" in `#4F8F68`
- Body: 1–2 lines of descriptive text
- 2 CTAs: "Thuê khay ngay" (primary) → `/rent-tray` | "Khám phá hạt giống" (ghost/glass) → `/seeds`
- Stats row (border-top): 4 stats — "1,200+ Khay đang hoạt động", "98% Tỷ lệ hài lòng", "24/7 Giám sát IoT", "6 loại Giống có sẵn"

**Right column (desktop only, hidden on mobile):**
IoT dashboard mockup card — frosted glass (`bg-white/10 backdrop-blur-md`):
- Header: tray code "TRY-2024-001" + "Đang trồng" badge
- Microgreens camera image (h-36)
- 2-col sensor boxes: Nhiệt độ 24.5°C (amber) | Độ ẩm 68% (blue)
- Progress bar: "Tiến trình thu hoạch — Còn 4 ngày"

#### Section 2 — Rau mầm là gì?
- **Background:** white
- **Layout:** 2-col (`lg`) — text left, feature grid right

Left: eyebrow label + H2 "Siêu thực phẩm của thế kỷ 21" + description paragraph + link to `/seeds`
Right: 2×2 grid of numbered feature cards on `#f3f8f4`:
1. "01 — Giàu dinh dưỡng"
2. "02 — Phù hợp đô thị"
3. "03 — Sạch và minh bạch"
4. "04 — Khoa học hiện đại"

Each card: bold number label (amber green), H3, description text.

#### Section 3 — IoT Showcase
- **Background:** `#1a2e1f` (dark)
- **Layout:** Full-width header row + 4-col card grid

Header: eyebrow "CÔNG NGHỆ IOT" + H2 "Giám sát thông minh cho khay rau mầm" + "Xem chi tiết →" link (right-aligned)

4 image cards (tall, rounded-2xl, image fills 100%):
Each card:
- Full-height photo with dark gradient overlay (bottom-weighted)
- Mono number top-left (01/02/03/04) in green
- Title bottom (H3 white)
- Description 1–2 lines (`#8fa89a`)
- Arrow icon appears on hover

| Card | Title | Image subject |
|------|-------|--------------|
| 01 | Theo dõi nhiệt độ | IoT sensor in plant pot |
| 02 | Kiểm soát độ ẩm | Seed trays / microgreens |
| 03 | Camera HD theo dõi khay | Microgreens in tray (close-up) |
| 04 | Cảnh báo tự động | Analytics dashboard on laptop |

Card hover: image scales 105%, opacity increases, arrow appears.

#### Section 4 — Quy trình
- **Background:** white
- **Layout:** Centered header + 5-step horizontal flow

Steps (icons + numbers, sequential):
1. Chọn giống (Sprout icon)
2. Thuê khay (Package icon)
3. SmartFarm lo (Zap icon)
4. Theo dõi từ xa (Smartphone icon)
5. Thu hoạch & giao (Truck icon)

Desktop: horizontal connector line behind step circles, step number badge (-top-1 -right-1).
Each step: icon circle (`w-16 h-16 rounded-full bg-[#E8F3EB]`) + title + description.

#### Section 5 — Seed Catalog Preview
- **Background:** `#f3f8f4`
- **Layout:** Header with "Xem tất cả →" + 3-col seed card grid

Shows first 3 seeds from catalog. Seed card: image (h-48) + badge overlay + seed name + short description + nutrition chips + price + germination days + 2 buttons.

#### Section 6 — Mô hình thuê khay (Editorial Split)
- **Background:** white
- **Layout:** 2-col split (`lg`) — tall image left, content + accordion right

**Left image:** 480–560px tall, rounded-2xl, microgreens tray photo. Dark gradient overlay at bottom. Floating badge card at bottom of image: "SmartFarm quản lý toàn bộ" + "IoT · Camera · Tưới tự động · Hỗ trợ kỹ thuật".

**Right content:**
- Eyebrow "MÔ HÌNH THUÊ KHAY"
- H2 "Thuê khay linh hoạt, phù hợp nhu cầu của bạn"
- Description paragraph
- 4-item accordion (see Interactions below)
- CTA: "Tìm hiểu cách thuê khay →" primary button → `/rent-tray`

Accordion items:
1. Chọn số lượng khay linh hoạt
2. Chọn giống phù hợp
3. SmartFarm chăm sóc & giám sát
4. Theo dõi từ xa và chờ ngày thu hoạch

Default: item 0 open, others collapsed.

#### Section 7 — Vì sao chọn SmartFarm?
- **Background:** `#f3f8f4`
- **Layout:** 2-col (`lg`) — image left, 4 feature rows right

Image: indoor farming photo (h-80, rounded-2xl).
Features (icon square + title + description):
1. Leaf icon — "100% sạch"
2. Activity icon — "IoT 24/7"
3. ShieldCheck icon — "Tiện lợi tối đa"
4. Globe icon — "Cộng đồng đô thị"

#### Section 8 — Testimonials
- **Background:** white
- **Layout:** Centered H2 + 3-col card grid

3 testimonial cards on `#f3f8f4`:
- 5 filled amber stars
- Quote text
- Avatar circle (green, initial letter) + name + role/location

#### Section 9 — Knowledge / Tips
- **Background:** `#1a2e1f` (dark)
- **Layout:** Header with "Xem thêm →" + 3-col article card grid

3 blog-style cards on `#2a3f2f`:
- Image (h-48) with scale hover
- Tag label (uppercase, green)
- Article title (white, bold)
- Description text (muted)

Hover: background shifts to `#334d38`, image opacity goes to 100%.

#### Section 10 — FAQ
- **Background:** white
- **Layout:** Max-width centered (max-w-3xl), accordion list

H2 "Câu hỏi thường gặp" + 4 accordion questions.
Each item: white card, border, `ChevronRight` icon rotates 90° when open.

#### Section 11 — Final CTA
- **Background:** `#4F8F68` (primary green)
- **Layout:** Centered, max-w-3xl

H2 + description + 2 buttons:
- "Thuê khay ngay" (white bg, green text) → `/rent-tray`
- "Xem hạt giống" (darker green bg, white text) → `/seeds`

### User Interactions
- FAQ accordion: click to expand/collapse individual items (one open at a time)
- Tray model accordion: click to expand/collapse (only section 6)
- CTA links navigate to respective pages
- Seed cards navigate to `/seeds/:id`
- IoT cards: hover animation only (no navigation in current design)

### Responsive Behavior
- **Desktop (lg):** All 2-col splits visible, hero right column (IoT mockup) visible, 4-col IoT showcase, 5-col process steps
- **Tablet (md):** Process steps wrap to 3-col, seed grid 2-col, testimonials remain 3-col
- **Mobile (sm):** All splits stack vertically, hero right panel hidden, IoT cards 1-col → 2-col, steps 1-col → 3-col

---

## Seeds

### Purpose
Browsable seed catalog with search, filter by category, and sort.

### Layout
Full page on `#f3f8f4` background. Header/filter bar pinned to top of content area. Grid of seed cards below.

### Sections

#### Filter Bar (white bg, border-bottom)
- `PageHeader`: "Hạt giống" H1 + subtitle
- SearchBar (full-width)
- Right-aligned: Sort `<select>` (Phổ biến / Giá tăng / Giá giảm / Nảy mầm nhanh)
- Category pills (horizontal scroll): "Tất cả" + 6 categories — "Oleaginous", "Legume", "Root", "Cruciferous", "Cereal". Active = `bg-[#4F8F68] text-white`. Inactive = `bg-white border`.

#### Seed Grid
- 3 columns (`lg`), 2 columns (`sm`), 1 column (mobile)
- `gap-6` between cards

Each card:
- Image h-48, `object-cover`, hover scale 105% over 500ms
- Badge overlay (top-left): color by seed type
- Difficulty chip (top-right): white bg, small text
- Card body: seed name (bold), short description, 2 nutrition chips (green pill), price (bold green) + unit, germination days (right-aligned muted)
- 2 buttons: "Chi tiết" (secondary, links to `/seeds/:id`) | "Thêm giỏ hàng" (primary, links to `/cart`)

#### Empty State
When search returns 0 results: centered icon + "Không tìm thấy hạt giống phù hợp" + suggestion text.

#### Pagination
3 page buttons (static): page 1 active = primary green bg.

### User Interactions
- Search input: filters seed list by name in real-time
- Category pills: toggle active filter (single selection)
- Sort select: re-sorts grid
- Card "Chi tiết" → `/seeds/:id`
- Card "Thêm giỏ hàng" → `/cart`

### States
- Default: full grid
- Filtered: subset grid
- Empty: empty state UI

### Responsive Behavior
- **Desktop:** 3-col grid, filter bar single row
- **Tablet:** 2-col grid
- **Mobile:** 1-col grid, category pills horizontally scrollable

---

## Seed Detail

### Purpose
Full detail page for a single seed, with quantity selector and purchase/rental CTAs.

### Layout
`max-w-7xl` container, `py-10`. Breadcrumb → 2-col hero → usage guide → related seeds.

### Sections

#### Breadcrumb
Trang chủ `/` → Hạt giống `/seeds` → {seed name} (plain text)

#### Hero — 2-col
**Left (image):**
- Rounded-2xl, h-80 (tablet: h-96)
- `object-cover`
- Badge overlay top-left

**Right (info):**
- Category eyebrow (uppercase, green)
- H1 seed name
- Description paragraph (`text-[#6b7280]`)
- Nutrition chips (green pills, flex-wrap)
- 3-col detail grid: Thời gian / Độ khó / Đơn vị (each on `#f3f8f4` bg)
- Price: large (`text-3xl font-bold text-[#4F8F68]`) + "/{unit}" muted
- Quantity stepper: Minus / number / Plus buttons (bordered, icon buttons)
- Subtotal line: "Tổng: {qty × price}₫"
- 2 buttons: "Thêm vào giỏ hàng" (primary) | "Thuê khay trồng" (secondary)

#### Usage Guide
`bg-[#f3f8f4] rounded-2xl p-8`, H2 + 3-col grid:
- 01. Ngâm hạt
- 02. Gieo vào khay
- 03. Tưới và chờ

Each: uppercase numbered label + instruction text.

#### Related Seeds
H2 + 3-col card grid (same card as Seeds page, image only + name + price, link to `/seeds/:id`).

### User Interactions
- Qty Minus: decrement (min 1)
- Qty Plus: increment
- "Thêm vào giỏ hàng" → `/cart`
- "Thuê khay trồng" → `/rent-tray`
- Related card click → `/seeds/:id`

### Responsive Behavior
- **Desktop:** 2-col hero
- **Mobile:** Stacked (image top, info below), 3-col detail grid may wrap, related seeds 1-col

---

## Rent Tray

### Purpose
Main rental configurator — choose seed, quantity, duration — with live pricing and order summary.

### Layout
Dark hero banner → `max-w-7xl` content — 3-col grid (left 2 + right 1 sticky) → dark comparison section.

### Sections

#### Hero
- `bg-gradient-to-br from-[#1a2e1f] to-[#2a4a33]`, `py-16`
- Eyebrow + H1 "Thuê khay trồng rau mầm" + description

#### How It Works — 4-icon Grid
`bg-[#f3f8f4]` card, H2 + 2×2 grid:
- Sprout "Chọn giống"
- Leaf "Chọn số khay"
- Zap "SmartFarm lo"
- Activity "Theo dõi"

Each: 48×48 white icon box (bordered) + title + description.

#### Seed Selection
White card, H2, 2×3 image button grid. Selected seed: `border-[#4F8F68] bg-[#f3f8f4]` + "✓ Đã chọn" text (green, small).

#### Quantity & Duration
White card:
- H2 "Số lượng khay" + description "Thuê nhiều khay, giá mỗi khay giảm dần"
- Large qty stepper: 44×44 bordered buttons with Minus/Plus, large number center (text-4xl)
- Discount tier chips (flex-wrap): 4 pills showing tier ranges. Active = `border-[#4F8F68] bg-[#E8F3EB] text-[#4F8F68]`. Inactive = `border-[#e8f3eb] text-[#9ca3af]`.
- Duration buttons: "1 tháng" / "2 tháng" (+ amber "Tiết kiệm hơn") / "3 tháng" (+ amber label)

#### Included Features
White card, 2×3 grid of icon + label rows:
- Camera HD theo dõi 24/7
- Cảm biến nhiệt độ thời gian thực
- Tưới tự động thông minh
- Dashboard IoT đầy đủ
- Thông báo tự động khi bất thường
- Hỗ trợ kỹ thuật trực tuyến

#### Right Sticky Sidebar — Order Summary
White card, `sticky top-24`:
- H2 "Tóm tắt"
- Detail rows: Giống trồng / Số khay / Thời gian / Đơn giá/khay / Giảm giá (conditional)
- Total: large green price + "cho {n} tháng"
- Primary link → `/cart`
- Secondary link → `/checkout`
- Note: "Có thể hủy bất cứ lúc nào"

#### Comparison Table
Dark card `bg-[#1a2e1f]`, H2 "SmartFarm so với tự trồng thông thường":
- 2-col grid
- Left (SmartFarm): 6 green checkmark items
- Right (Tự trồng): 6 red × items

### User Interactions
- Seed grid buttons: toggle selected seed
- Minus/Plus: update qty, trigger live price recalculation
- Duration buttons: toggle selected duration
- All changes update order summary in real-time
- "Thêm vào giỏ hàng" → `/cart`
- "Thanh toán ngay" → `/checkout`

### States
- Discount tier highlight updates as qty changes
- "Tiết kiệm hơn" label shows for duration ≥ 2 months

### Responsive Behavior
- **Desktop (lg):** 3-col layout with sticky sidebar
- **Mobile:** All sections stacked, sidebar below all config panels

---

## Rent Tray Config (`/rent-tray/:id`)

### Purpose
Alternative entry point for tray rental configuration (same interaction as Rent Tray main page, slightly different layout).

### Layout
Breadcrumb → 3-col grid (left 2 + right 1 sticky).

### Differences from Rent Tray Page
- Breadcrumb: Trang chủ / Thuê khay / Cấu hình đơn thuê
- Seed buttons are smaller (h-16 image, not h-20)
- Additional "Ghi chú" Textarea FormField
- Uses `FormField` wrapper component for each input group
- Buttons use `BtnPrimary` / `BtnSecondary` components (same style)

---

## Cart

### Purpose
Shopping cart review before checkout.

### Layout
`max-w-7xl`, `py-10`. H1 with item count → 3-col grid (left 2 + right 1 sticky). Empty state replaces grid if no items.

### Sections

#### Cart Items (left panel)
White card per item:
- 80×80 image (rounded-xl)
- Type badge chip (green: "Hạt giống" or "Thuê khay")
- Item name (font-medium)
- Remove button (X icon, top-right, `text-[#9ca3af]`)
- Qty stepper: 32×32 icon buttons, number center
- Line total (bold green)

Below items: "+ Thêm hạt giống" link → `/seeds` | "+ Thuê thêm khay" link → `/rent-tray`

#### Order Summary (right sticky sidebar)
White card:
- Subtotal row
- Shipping row (30,000₫)
- Total row (bold, larger)
- Coupon code input + "Áp dụng" button
- Primary button: "Tiến hành thanh toán" → `/checkout`
- Link: "Tiếp tục mua sắm" → `/seeds`

#### Empty State
When cart is empty: Tag icon + "Giỏ hàng trống" + description + "Mua hạt giống ngay" link.

### User Interactions
- X button: remove item from cart
- Minus/Plus: change item quantity
- "Áp dụng" coupon: (static in current design)
- "Tiến hành thanh toán" → `/checkout`

### Responsive Behavior
- **Desktop:** 3-col with sidebar
- **Mobile:** Stacked, sidebar below items

---

## Checkout

### Purpose
Order confirmation and payment method selection.

### Layout
`max-w-7xl`, `py-10`. H1 → 5-col grid (left 3 + right 2 sticky).

### Sections

#### Delivery Information (left panel 1)
White card:
- FormField: Họ và tên (full-width)
- 2-col: Số điện thoại | Email
- FormField: Địa chỉ giao hàng (full-width)
- FormField: Ghi chú (Textarea)

#### Payment Method (left panel 2)
White card, H2 "Phương thức thanh toán":
3 radio-style selectable rows (click to select):
| Method | Icon | Label |
|--------|------|-------|
| bank | Banknote | "Chuyển khoản ngân hàng" |
| ewallet | Wallet | "Ví điện tử (MoMo/ZaloPay)" |
| cod | Truck | "Thanh toán khi nhận hàng" |

Selected row: `border-[#4F8F68] bg-[#f3f8f4]`. Bank shows QR code block when selected.

#### Order Summary Sidebar (right sticky)
White card:
- 2 order line items (name + price)
- Subtotal + Shipping + Total rows
- Lock icon + "Thanh toán an toàn 256-bit SSL" note
- Primary button: "Xác nhận thanh toán" → `/payment-success`

### User Interactions
- Form fields: controlled text inputs
- Payment method: click row to select (visual toggle)
- "Xác nhận thanh toán" → `/payment-success`

### Responsive Behavior
- **Desktop (lg):** 5-col layout
- **Mobile:** Stacked panels

---

## Payment Success

### Purpose
Confirmation screen shown after successful payment. No header/footer.

### Layout
`min-h-[80vh]`, centered flex column, `max-w-lg`.

### Sections
- Success icon: 40px CheckCircle2 inside 80×80 green circle
- H1 "Thanh toán thành công!"
- Thank-you message
- Order code in monospace pill
- Summary card (`bg-[#f3f8f4]`, 5 rows):
  - Mã đơn hàng
  - Sản phẩm
  - Tổng tiền
  - Phương thức thanh toán
  - Giao đến
- 3 action links:
  - "Xem đơn hàng" → `/orders`
  - "Về trang chủ" → `/`
  - "Khay của tôi" → `/my-trays`

### Responsive Behavior
Fully centered, single column at all breakpoints.

---

## My Trays

### Purpose
Dashboard overview of all rented trays with live sensor data.

### Layout
`max-w-7xl`, `py-10`. PageHeader → KPI row → tray card grid.

### Sections

#### PageHeader
H1 "Khay của tôi" + "+ Thuê thêm khay" button → `/rent-tray` (right slot).

#### KPI Row
4 `KpiCard` components side-by-side:
| Label | Value | Unit | Icon | Color |
|-------|-------|------|------|-------|
| Tổng khay | 3 | khay | Package | green |
| Đang trồng | 2 | khay | Activity | blue |
| Sẵn thu hoạch | 1 | khay | CheckCircle2 | yellow |
| TB nhiệt độ | 23.5 | °C | Thermometer | yellow |

#### Tray Cards (3-col → 1-col)
Each card:
- Camera image (h-44, object-cover)
- Overlays on image:
  - Status Badge top-left
  - "LIVE" chip top-right (red Wifi dot + "LIVE" text on dark bg)
  - Tray code bottom-left (monospace, white on dark bg)
  - Location bottom-right
- Below image:
  - Seed name (bold)
  - 2-col sensor boxes: temp (amber bg) | humidity (blue bg)
  - Progress bar OR "Sẵn sàng thu hoạch" green box
  - Footer: last-updated text + "Chi tiết →" link → `/my-trays/:id`

### User Interactions
- "Chi tiết →" or card click → `/my-trays/:id`
- "+ Thuê thêm khay" → `/rent-tray`

### States
- Default: tray cards with live data
- "Sẵn thu hoạch" tray: progress bar replaced by green success box

### Responsive Behavior
- **Desktop:** 3-col grid
- **Tablet:** 2-col
- **Mobile:** 1-col

---

## Tray Detail

### Purpose
IoT monitoring detail for a single tray. 4-tab interface.

### Layout
`max-w-7xl`, `py-10`. Breadcrumb → header → KPI row → Tabs → tab content.

### Sections

#### Breadcrumb
Khay của tôi → {tray.code}

#### Header Row
- Left: seed name (H1) + Status Badge + tray code (monospace) + location (muted)
- Right: "Lên lịch thu hoạch" (outline button) | "Giao hàng" (primary) → `/delivery`

#### KPI Row (4 cards)
- Nhiệt độ (°C) — amber icon
- Độ ẩm (%) — blue icon
- Ngày trồng (elapsed / total)
- Còn lại (days or "Thu hoạch")

#### Tabs
["Tổng quan", "Chỉ số môi trường", "Hình ảnh", "Lịch sử"]

Pill-style tabs on `bg-[#f3f8f4]` bar. Active: white bg + shadow.

---

**Tab: Tổng quan**
2-col (3-col grid, left takes 2):
- Left: Camera feed card — header with Wifi icon + "Camera trực tiếp" + last-updated. Image area with time overlay (bottom-right, monospace, dark bg).
- Right: 2 stacked cards:
  - Progress card: H3 + ProgressBar + "Còn {n} ngày" or "Sẵn sàng thu hoạch" green box
  - System status card: 4 rows (Tưới tự động / Ánh sáng LED / Cảm biến nhiệt / Kết nối mạng) each with green badge

**Tab: Chỉ số môi trường**
Full-width white card, data table:
- Columns: Thời gian | Nhiệt độ (°C) | Độ ẩm (%) | Trạng thái
- 6 rows, monospace time, amber temp, blue humidity, green status badge
- Alternating hover bg

**Tab: Hình ảnh**
3-col image grid (2-col on mobile), 6 photos:
- Aspect-square, rounded-2xl
- "Ngày {n}" label overlay bottom-left (dark bg)

**Tab: Lịch sử**
Vertical timeline:
- Left: vertical line (`w-0.5 bg-[#e8f3eb]`)
- Each event: colored dot (green=start, blue=growth, amber=adjust) + monospace date + event text
- 5 events total

### User Interactions
- Tab switch: updates displayed content
- "Giao hàng" → `/delivery`

### Responsive Behavior
- **Desktop:** 2-col Tổng quan tab layout
- **Mobile:** All sections stacked, image gallery 2-col, timeline full-width

---

## Orders

### Purpose
Order history with filtering by status.

### Layout
`max-w-7xl`, `py-10`. PageHeader → tabs + search → order cards.

### Sections

#### PageHeader
H1 "Đơn hàng của tôi"

#### Filter Row
- Tabs: ["Tất cả", "Chờ xử lý", "Hoàn thành", "Đã hủy"] (pill tabs, left-aligned)
- SearchBar: `w-72`, right-aligned

#### Order Cards (full-width, stacked)
Each card (white, border, rounded-2xl):
- Top row: order code (monospace pill, `bg-[#f3f8f4]`) + Status Badge + date + total (bold green)
- Middle: item list (name × qty — price per item)
- Bottom row: payment method chip + truncated address (MapPin icon) + "Xem chi tiết →" link → `/orders/:id`

#### Empty State
ClipboardList icon + "Chưa có đơn hàng nào" text (shown when tab filter returns 0).

### User Interactions
- Tab click: filters by status
- Search: filters by order code or item name
- "Xem chi tiết →" → `/orders/:id`

### Responsive Behavior
- Cards are full-width at all breakpoints
- Bottom row wraps on mobile

---

## Order Detail

### Purpose
Complete information for a single order, including tracking status and delivery.

### Layout
`max-w-7xl`, `py-10`. Breadcrumb → header → tracking stepper → items table → 2-col info cards → action row.

### Sections

#### Breadcrumb
Đơn hàng → {order.code}

#### Header
- H1 "Chi tiết đơn hàng"
- Order code (monospace) + Status Badge + date (muted)

#### Tracking Stepper (horizontal)
5 steps:
1. Đặt hàng
2. Xác nhận
3. Đang xử lý
4. Đang giao
5. Hoàn thành

Each step: circle (✓ green filled if completed, number gray otherwise) + label below + date below label.
Connector lines between steps: green if both adjacent steps are completed.

#### Items Table (white card)
Columns: Sản phẩm | Số lượng | Đơn giá | Thành tiền
Rows: each order item
Footer: Total row.

#### 2-col Info Cards
Left — Payment:
- Method name + icon
- "Đã thanh toán" green badge

Right — Delivery:
- Address (MapPin icon)
- Expected date

#### Action Row
- "← Quay lại" → `/orders`
- "Xem lịch giao hàng →" → `/delivery` (hidden if status = "Đã hủy")

### Responsive Behavior
- Tracking stepper: horizontal on desktop, may overflow-x-scroll on mobile
- Info cards: 2-col → 1-col stacked on mobile

---

## Delivery

### Purpose
Delivery schedule management.

### Layout
`max-w-7xl`, `py-10`. PageHeader → delivery card list.

### Sections

#### PageHeader
H1 "Lịch giao hàng"

#### Delivery Cards (full-width, stacked)
Each card (white, border):
- Top row: order code (monospace) + items summary (Package icon) + Status Badge
- 2-col detail grid: Ngày dự kiến (Calendar icon) | Địa chỉ (MapPin icon)
- If status = "Chờ xác nhận": 2 action buttons — "Xác nhận lịch" (primary) | "Đổi lịch" (secondary)

### States
| Status | Badge color | Action buttons |
|--------|------------|----------------|
| Đang giao | blue | none |
| Đã giao | green | none |
| Chờ xác nhận | yellow | "Xác nhận lịch" + "Đổi lịch" |

---

## Notifications

### Purpose
Notification center. Mark individual or all as read.

### Layout
`max-w-7xl` (narrower: `max-w-3xl`), `py-10`. PageHeader → notification list.

### Sections

#### PageHeader
H1 + unread count badge + "Đánh dấu tất cả đã đọc" action (CheckCheck icon, visible only when unread > 0).

#### Notification Cards (full-width, stacked)
Each card:
- Colored icon square (32×32, color by type: green=tray, blue=payment, amber=delivery, purple=reminder)
- Title: bold if unread, regular if read
- Body text (muted)
- Time (right-aligned, `text-[11px]`)
- Unread indicator: green left border (`border-[#4F8F68]/30 bg-[#f3fdf7]`) + green dot (top-right inside icon area)

### User Interactions
- Click notification card: marks as read, removes unread styling
- "Đánh dấu tất cả đã đọc": marks all read

### States
- Unread: `bg-[#f3fdf7] border-[#4F8F68]/30`, bold title, green dot
- Read: white bg, normal border, regular title

---

## Profile

### Purpose
User account management — edit info, change password, danger zone.

### Layout
`max-w-7xl`, `py-10`. H1 → 4-col grid (left 1 + right 3).

### Sections

#### Left Sidebar
- 80×80 User icon in green circle
- User name (bold)
- Email (muted)
- "Đổi ảnh đại diện" link (green)
- Stats list (3 rows): Khay đang thuê / Tổng đơn hàng / Thành viên từ

#### Right — Edit Profile (white card)
- FormField: Họ và tên
- 2-col: Số điện thoại | Email
- FormField: Địa chỉ
- BtnPrimary: "Lưu thay đổi" → on success shows CheckCircle2 + "Đã lưu!" for 2 seconds

#### Right — Change Password (white card)
- FormField: Mật khẩu hiện tại
- 2-col: Mật khẩu mới | Xác nhận mật khẩu
- BtnSecondary: "Đổi mật khẩu"

#### Right — Danger Zone (red border card)
- H3 + warning text
- "Xóa tài khoản" button (red outline)

### User Interactions
- Form inputs: controlled
- "Lưu thay đổi": shows success state briefly
- "Xóa tài khoản": (no navigation in current design — destructive action placeholder)

### States
- Save button: default → loading → success ("Đã lưu!" with icon, auto-resets after 2s)

### Responsive Behavior
- **Desktop (lg):** 4-col layout with left sidebar
- **Mobile:** Sidebar stacks above right panels

---

## Sign In

### Purpose
User authentication. No header/footer.

### Layout
2-col split, `min-h-[92vh]`.

### Sections

**Left column (desktop only):**
- Full-bleed microgreens image, `opacity-50`, dark overlay
- Bottom overlay: SmartFarm logo + italic quote + tagline

**Right column:**
- `bg-[#f3f8f4]`, flex center
- Mobile logo (shown only when left col hidden)
- H1 "Đăng nhập"
- FormField: Email
- FormField: Mật khẩu + "Quên mật khẩu?" right-aligned link
- BtnPrimary "Đăng nhập" → `/`
- Divider: "hoặc"
- Google button (white bg, border, Google SVG logo)
- "Chưa có tài khoản? **Đăng ký ngay**" link → `/sign-up`

### Responsive Behavior
- **Desktop:** 2-col split (image left, form right)
- **Mobile:** Right column only (full width), mobile logo shown

---

## Sign Up

### Purpose
New user registration. No header/footer.

### Layout
Same 2-col split as Sign In.

**Left column (desktop only):**
- Same image treatment as Sign In
- Stats overlay: "1,200+ Khay đang hoạt động", "98% Tỷ lệ hài lòng", "6+ Loại giống"
- Heading + tagline

**Right column:**
- H1 "Tạo tài khoản"
- FormField: Họ và tên
- FormField: Email
- FormField: Số điện thoại
- FormField: Mật khẩu
- Terms agreement text (links to privacy + terms)
- BtnPrimary "Tạo tài khoản" → `/`
- Divider "hoặc"
- Google button
- "Đã có tài khoản? **Đăng nhập**" → `/sign-in`

---

# 6. Reusable Components

## 6.1 Header
Used on all pages except `/sign-in`, `/sign-up`.
See Section 3.1 for full specification.

## 6.2 Footer
Used on all pages except `/sign-in`, `/sign-up`, `/payment-success`.
See Section 3.2 for full specification.

## 6.3 Seed Card
Used on: Seeds (grid), Home (seed preview section), Seed Detail (related seeds).
Contains: image, badge overlay, name, short description, price, germination days. Variant without buttons on Home/related.

## 6.4 Tray Card
Used on: My Trays.
Contains: camera image with overlays (badge, LIVE chip, code, location), sensor boxes, progress bar, footer row.

## 6.5 Status Badge
Used on: Seeds (difficulty), My Trays (status), Tray Detail (status), Orders (status), Order Detail (status), Delivery (status), Notifications (type indicator), Cart (item type).
Spec: `text-[11px] font-semibold px-2 py-0.5 rounded-lg`. 6 color variants.

## 6.6 KPI Card
Used on: My Trays (4 stats), Tray Detail (4 stats).
Contains: 40×40 colored icon square, label, large value, unit string.

## 6.7 Progress Bar
Used on: Tray Detail (harvest progress), My Trays (tray cards).
Spec: `h-2 rounded-full`, `bg-[#e8f3eb]` track, fill percentage from value/max.

## 6.8 Tabs Component
Used on: Tray Detail (4 tabs), Orders (4 tabs).
Spec: `bg-[#f3f8f4] p-1 rounded-xl`, active tab `bg-white shadow-sm rounded-lg`.

## 6.9 BtnPrimary / BtnSecondary
Used everywhere (see Section 2.7 for specs).

## 6.10 FormField
Used on: RentTrayDetail, Checkout, Profile, SignIn, SignUp.
Contains: label, optional hint, children (Input/Textarea/Select).

## 6.11 SearchBar
Used on: Seeds (filter bar), Orders (filter row).
Contains: Search icon left + text input.

## 6.12 Order Summary Sidebar
Used on: RentTray, RentTrayDetail, Cart, Checkout.
Contains: detail rows, total, CTA buttons, note.

## 6.13 Quantity Stepper
Used on: Seed Detail, Rent Tray, Rent Tray Config, Cart.
Contains: Minus button / number / Plus button. Bordered, with min constraint.

## 6.14 Accordion Item
Used on: Home (FAQ, Tray Model section).
Contains: button row with chevron, collapsible body.

## 6.15 Breadcrumb
Used on: Seed Detail, RentTrayDetail, TrayDetail, OrderDetail.
Format: `Link / Link / plain text` with `/` separators, `text-[#9ca3af]` links.

## 6.16 Page Header (`PageHeader`)
Used on: Seeds, My Trays, Orders, Delivery, Notifications.
Contains: H1 + optional subtitle + optional right-slot action.

---

# 7. Mock Data Requirements

## 7.1 Seeds

```
{
  id: string             // e.g. "s1"
  name: string           // e.g. "Rau Mầm Hướng Dương"
  shortDesc: string      // 1-line description
  description: string    // full paragraph
  price: number          // in VND (e.g. 85000)
  unit: string           // "100g"
  badge: string          // e.g. "Phổ biến"
  badgeColor: string     // "green" | "blue" | "red" | "purple"
  category: string       // e.g. "Oleaginous"
  growDays: number       // e.g. 7
  difficulty: string     // "Dễ" | "Rất dễ" | "Trung bình"
  nutrition: string[]    // chip labels e.g. ["Vitamin C", "Protein cao"]
  img: string            // Unsplash URL with ?w=600&h=400&fit=crop&auto=format
}
```

6 seeds: Hướng Dương, Đậu Hà Lan, Củ Cải Đỏ, Broccoli, Đậu Xanh, Lúa Mì.

## 7.2 Tray Pricing

```
{
  basePrice: number      // 350000 VND per tray per month
  discounts: [
    { min: number, max: number, pct: number, label: string }
    // 1–2 trays: 0%, 3–5: 5%, 6–9: 10%, 10+: 15%
  ]
}
```

## 7.3 My Trays

```
{
  id: string             // e.g. "mt1"
  code: string           // e.g. "TRY-2024-001"
  seedName: string
  status: string         // "Đang trồng" | "Nảy mầm" | "Sẵn thu hoạch"
  statusColor: string    // badge color name
  location: string       // e.g. "Kệ A - Vị trí 3"
  temp: number           // e.g. 24.5
  humidity: number       // e.g. 68
  daysLeft: number       // 0 = harvest ready
  totalDays: number
  lastUpdate: string     // e.g. "5 phút trước"
  img: string            // Unsplash URL
}
```

## 7.4 Orders

```
{
  id: string             // e.g. "ord1"
  code: string           // e.g. "ORD-2024-0128"
  status: string         // "Đang xử lý" | "Hoàn thành" | "Đã hủy"
  statusColor: string    // badge color name
  date: string           // e.g. "28/01/2024"
  total: number          // in VND
  items: [
    { name: string, qty: number, price: number }
  ]
  payment: string        // e.g. "Chuyển khoản"
  address: string        // full address string
}
```

## 7.5 Deliveries

```
{
  id: string
  orderCode: string
  items: string          // item summary e.g. "2 sản phẩm"
  status: string         // "Đang giao" | "Đã giao" | "Chờ xác nhận"
  statusColor: string
  expectedDate: string
  address: string
}
```

## 7.6 Notifications

```
{
  id: string
  type: string           // "tray" | "payment" | "delivery" | "reminder"
  title: string
  body: string
  time: string           // e.g. "5 phút trước"
  read: boolean
}
```

## 7.7 Cart Items

```
{
  id: string
  type: string           // "seed" | "tray"
  name: string
  img: string
  price: number
  qty: number
}
```

## 7.8 User / Profile

```
{
  name: string
  email: string
  phone: string
  address: string
  avatarInitial: string  // first character of name
  activeTrays: number    // e.g. 3
  totalOrders: number    // e.g. 12
  memberSince: string    // e.g. "01/2024"
}
```

---

# 8. Interaction Summary

| Interaction | Element | Result |
|------------|---------|--------|
| Click primary nav links | Header nav | SPA navigation |
| Click hamburger | Header (mobile) | Dropdown nav opens/closes |
| Click logo | Header | Navigate to `/` |
| Toggle bell | Header | Navigate to `/notifications` |
| Click cart icon | Header | Navigate to `/cart` |
| Click user avatar | Header | Navigate to `/profile` |
| Search input | Seeds, Orders | Filters list in real-time |
| Category pill | Seeds | Filters by category (single select) |
| Sort select | Seeds | Re-sorts grid |
| Click seed card | Seeds, Home, SeedDetail | Navigate to `/seeds/:id` |
| Qty Minus/Plus | SeedDetail, RentTray, RentTrayDetail, Cart | Updates count + recalculates price |
| Seed selection buttons | RentTray, RentTrayDetail | Toggles selected seed |
| Duration buttons | RentTray, RentTrayDetail | Toggles duration, updates total |
| Discount tier chips | RentTray | Visual-only (react to qty), no click |
| Add to cart | Seeds, SeedDetail, RentTray, RentTrayDetail | Navigate to `/cart` |
| Remove from cart | Cart | Removes item, recalculates |
| Apply coupon | Cart | Static (no effect in current design) |
| Payment method select | Checkout | Visual toggle between 3 options |
| Confirm payment | Checkout | Navigate to `/payment-success` |
| Tab switch | TrayDetail, Orders | Updates displayed content |
| Accordion toggle | Home FAQ, Home Tray Model | Expand/collapse body |
| Notification click | Notifications | Marks individual as read |
| Mark all read | Notifications | Marks all as read |
| Save profile | Profile | Shows 2s success state |
| Sign in submit | SignIn | Navigate to `/` |
| Sign up submit | SignUp | Navigate to `/` |
| Delivery confirm | Delivery (Chờ xác nhận) | (static in current design) |
| Hover on IoT cards | Home IoT section | Scale image + reveal arrow |
| Hover on seed cards | Seeds | Scale image |
| Hover on knowledge cards | Home Tips | Darken bg + scale image |

---

# 9. Implementation Notes

## 9.1 Images

- All images use Unsplash CDN with explicit sizing parameters: `?w={width}&h={height}&fit=crop&auto=format`
- Card images: `object-cover` always — never `object-contain`
- Hero images: `absolute inset-0 w-full h-full object-cover` with `opacity-40`
- Camera feed images inside tray cards: `w-full h-full object-cover`
- Seed card images: aspect ratio enforced by fixed height container (`h-48`)
- IoT showcase cards: tall aspect ratio (`h-72 lg:h-80`)

## 9.2 Overlays & Gradients

- Hero overlay: `bg-gradient-to-r from-[#0f1f14]/90 via-[#0f1f14]/60 to-transparent` (left-heavy)
- IoT card overlay: `bg-gradient-to-t from-[#0f1a11]/90 via-[#0f1a11]/30 to-transparent` (bottom-heavy)
- Dark section tray model image overlay: `bg-gradient-to-t from-[#0f1a11]/40 to-transparent`
- Auth screen image: single dark overlay `opacity-50` on image + `bg-gradient-to-t from-black/60` bottom overlay for text

## 9.3 Sticky Elements

- Header: `sticky top-0 z-50`
- Sidebar (RentTray, RentTrayDetail, Cart, Checkout, TrayDetail): `sticky top-24` (24 = header height + margin)

## 9.4 Animations & Transitions

- Image hover scale: `transition-transform duration-500` → `group-hover:scale-105`
- Button hover: `transition-colors` (no duration = 150ms default)
- Mobile nav: instant show/hide (no animation)
- Accordion: instant expand/collapse (no transition animation)
- IoT card arrow: `opacity-0 group-hover:opacity-100 transition-opacity`
- Pulse dot (hero badge): `animate-pulse`
- Chevron rotation (FAQ, accordion): `transition-transform`, `rotate-90` or `rotate-180`
- Save button: JS-controlled 2-second timer to revert state

## 9.5 Section Spacing

- Hero sections: `py-16` to `py-24`
- Standard page sections: `py-20`
- Compact page sections: `py-16`
- Inner card spacing: `p-5` or `p-6`
- Gap between section cards: `gap-5` or `gap-6`
- Tray detail tabs gap: `mt-6` below tabs

## 9.6 Typography Precision

- Eyebrow labels: `text-xs font-semibold text-[#4F8F68] uppercase tracking-widest mb-3 or mb-4`
- Monospace values (codes, timestamps): explicit `font-mono` class
- Large numbers (prices, KPI values): `font-bold` — not `font-semibold`
- Section headings: always `font-bold` not `font-semibold`

## 9.7 Grid Column Ratios

| Page | Left | Right |
|------|------|-------|
| RentTray | `lg:col-span-2` | `lg:col-span-1` |
| RentTrayDetail | `lg:col-span-2` | `lg:col-span-1` |
| Cart | `lg:col-span-2` | `lg:col-span-1` |
| Checkout | `lg:col-span-3` | `lg:col-span-2` (in 5-col grid) |
| Profile | `lg:col-span-1` | `lg:col-span-3` (in 4-col grid) |
| TrayDetail overview | `lg:col-span-2` | `lg:col-span-1` (in 3-col) |

## 9.8 Dark Section Contrast

Inside `bg-[#1a2e1f]` sections:
- Primary text: white (`text-white`)
- Secondary text: `text-[#8fa89a]`
- Cards: `bg-[#2a3f2f]`
- Sub-cards/hover: `bg-[#334d38]`
- Links: `text-[#8fa89a] hover:text-white`
- Borders: `border-[#2a3f2f]`

## 9.9 Header Height Offset

- Header is `h-16` (64px)
- Sticky sidebars use `top-24` (96px = header + 32px gap) to clear header

## 9.10 Scrollbar

Custom thin scrollbar (6px): `#c4d9cb` default, `#4F8F68` on hover. Implement via CSS `::-webkit-scrollbar` rules.

## 9.11 Auth Pages

- No header, no footer
- Left column: `hidden lg:block` (disappears on mobile)
- Right column: `flex-1` always visible
- Form container: `max-w-sm w-full` centered within right column
- Google button: white bg, border, plain text + SVG icon — not a real OAuth button in this design

---

# Screen Checklist

- [ ] Home (`/`)
- [ ] Seeds (`/seeds`)
- [ ] Seed Detail (`/seeds/:id`)
- [ ] Rent Tray (`/rent-tray`)
- [ ] Rent Tray Config (`/rent-tray/:id`)
- [ ] Cart (`/cart`)
- [ ] Checkout (`/checkout`)
- [ ] Payment Success (`/payment-success`)
- [ ] My Trays (`/my-trays`)
- [ ] Tray Detail (`/my-trays/:id`)
- [ ] Orders (`/orders`)
- [ ] Order Detail (`/orders/:id`)
- [ ] Delivery (`/delivery`)
- [ ] Notifications (`/notifications`)
- [ ] Profile (`/profile`)
- [ ] Sign In (`/sign-in`)
- [ ] Sign Up (`/sign-up`)
