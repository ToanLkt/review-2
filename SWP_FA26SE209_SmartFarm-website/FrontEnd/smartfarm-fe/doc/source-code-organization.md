# Quy tắc tổ chức source code `smartfarm-fe`

## 1. Mục tiêu và phạm vi

Tài liệu này là quy ước bắt buộc khi thêm mới, chỉnh sửa hoặc review source code của `smartfarm-fe`.

Dự án hiện không có thư mục `src/`. Source code được đặt trực tiếp tại root theo cấu trúc Next.js App Router:

```text
smartfarm-fe/
├── app/          # Route, layout, loading và global style
├── components/   # React component
├── hooks/        # Custom React hook dùng chung
├── lib/          # Kiểu dữ liệu, dữ liệu, rule nghiệp vụ và utility thuần
├── public/       # Static asset
├── tests/        # Unit test
└── doc/          # Tài liệu kỹ thuật
```

Không tạo thêm `src/` nếu chưa có quyết định migrate toàn dự án. Không duy trì đồng thời hai cấu trúc root và `src/`.

## 2. Nguyên tắc tổng quát

1. Tổ chức theo **feature/domain** trước, theo loại file sau.
2. Route trong `app/` phải mỏng; UI và logic tương tác thuộc `components/`; nghiệp vụ thuần thuộc `lib/`.
3. Code chỉ dùng trong một feature phải nằm trong feature đó. Chỉ đưa code ra vùng dùng chung sau khi có từ hai nơi sử dụng thực tế.
4. Ưu tiên Server Component. Chỉ thêm `"use client"` tại ranh giới nhỏ nhất cần state, effect, event handler hoặc browser API.
5. Tránh import vòng và tránh để feature này phụ thuộc trực tiếp vào component nội bộ của feature khác.
6. Mọi rule nghiệp vụ có thể viết thành hàm thuần phải tách khỏi React để kiểm thử trong `tests/`.

## 3. Trách nhiệm của từng thư mục

### `app/` — routing và composition

`app/` phản ánh URL và sử dụng convention của Next.js App Router.

- `page.tsx`: khai báo metadata khi cần và compose page component.
- `layout.tsx`: shell/provider dùng chung cho một route segment.
- `loading.tsx`: loading UI của route segment.
- `[param]/`: dynamic route; tên param phải thể hiện đúng domain, ví dụ `[areaId]`.
- Không đặt mock data, validation, business rule hoặc component lớn trong `page.tsx`.
- Không thêm `"use client"` vào route chỉ để render một client feature; import feature component thay thế.

Ví dụ đang áp dụng:

```tsx
// app/admin/devices/page.tsx
import { DevicesPage } from "@/components/devices/devices-page";

export default function Page() {
  return <DevicesPage />;
}
```

### `components/` — giao diện và state trình bày

Mỗi feature có một thư mục riêng, ví dụ `components/devices/`, `components/orders/`, `components/tasks/`.

Trong một feature, phân tách component theo vai trò:

- `*-page.tsx`: điểm vào UI của feature, điều phối các khối màn hình.
- `*-provider.tsx`: context/state/actions dùng chung trong feature.
- `*-table.tsx`, `*-list.tsx`, `*-card.tsx`: trình bày tập dữ liệu.
- `*-form.tsx`, `*-form-sheet.tsx`: nhập liệu.
- `*-detail.tsx`, `*-detail-sheet.tsx`: xem chi tiết.
- `*-dialog.tsx`, `*-confirmation.tsx`: xác nhận hành động.
- `*-ui.tsx`: helper UI chỉ dùng trong chính feature; không chứa business rule.

Quy định:

- Component dùng riêng cho một feature phải nằm trong thư mục feature đó.
- Component dùng chung cho các feature nghiệp vụ có thể đặt tại thư mục cha phù hợp, ví dụ `components/operations/shared/`.
- Không đưa component mang nghiệp vụ vào `components/ui/`.
- Khi một file bắt đầu đảm nhiệm nhiều vai trò (fetch/state, validation và nhiều khối UI), tách theo các vai trò trên thay vì tiếp tục mở rộng file.

### `components/ui/` — design-system primitives

Chỉ chứa component giao diện nền tảng, không biết về domain SmartFarm, ví dụ `button.tsx`, `dialog.tsx`, `table.tsx`.

- API phải tổng quát và tái sử dụng được.
- Không import từ `components/<feature>/` hoặc `lib/<feature>.ts`.
- Không chứa tên như device, tray, order, farm, area trong props hoặc nội dung mặc định.
- Giữ cách tùy biến thống nhất với shadcn/ui và theme trong `app/globals.css`.

### `lib/` — domain và logic thuần

Mỗi domain ưu tiên một module cùng tên feature, ví dụ `lib/devices.ts`, `lib/orders.ts`, `lib/pricing.ts`.

Module `lib/` có thể chứa:

- type/interface và constant của domain;
- mock/fixture data hiện dùng bởi ứng dụng;
- selector, formatter, validation và state transition thuần;
- hàm chuyển đổi dữ liệu, tính KPI hoặc xuất dữ liệu.

Khi một domain lớn lên, chuyển sang thư mục như cấu trúc hiện có tại `lib/operations/`:

```text
lib/<feature>/
├── types.ts
├── selectors.ts
├── transitions.ts
├── mock-data.ts
└── index.ts          # Chỉ thêm khi cần public API rõ ràng
```

Quy định:

- `lib/` không import React component.
- Hàm nghiệp vụ ưu tiên deterministic, không truy cập DOM và không tự tạo side effect.
- Type chỉ dùng nội bộ đặt gần implementation; type dùng xuyên domain đặt trong module domain hoặc `lib/types.ts` khi thật sự dùng chung.
- `lib/utils.ts` chỉ dành cho utility tổng quát. Không biến file này thành nơi chứa mọi helper.
- Không thêm dữ liệu domain mới vào `lib/mock-data.ts` nếu đã có module riêng cho domain đó.

### `hooks/` — hook dùng chung

- Tên file bắt đầu bằng `use-`, tên export bắt đầu bằng `use`.
- Chỉ đặt tại `hooks/` khi hook được dùng bởi nhiều feature.
- Hook chỉ dùng trong một feature đặt cạnh component của feature đó.
- Business rule độc lập với React phải nằm trong `lib/`, không bọc thành hook.

### `tests/` — kiểm thử nghiệp vụ

- Tên file: `<domain>.test.ts` hoặc `<unit>.test.ts`.
- Test logic thuần trong `lib/`, đặc biệt validation, selector, transition và các edge case.
- Mỗi thay đổi business rule phải cập nhật hoặc bổ sung test tương ứng.
- Test không phụ thuộc thứ tự chạy, thời gian hệ thống hoặc network thật.
- Dữ liệu ngày giờ mô phỏng phải cố định hoặc được truyền vào hàm.

### `public/` và `doc/`

- `public/`: ảnh, icon và file tĩnh được phục vụ trực tiếp; dùng tên file kebab-case.
- `doc/`: kiến trúc, convention, quyết định kỹ thuật và hướng dẫn phát triển; không chứa source runtime.

## 4. Luồng phụ thuộc cho phép

```text
app/*
  └── components/<feature>/*
        ├── components/ui/*
        ├── hooks/*
        └── lib/*

tests/* ──> lib/*
```

Chiều phụ thuộc bắt buộc:

- `app` có thể import `components`, `hooks`, `lib`.
- Feature component có thể import `components/ui`, `hooks`, `lib`.
- `components/ui` chỉ phụ thuộc utility tổng quát và thư viện UI nền tảng.
- `lib` không phụ thuộc `app` hoặc `components`.
- Feature A không import file nội bộ của feature B. Nếu cần dùng chung, tách contract/logic sang `lib/` hoặc component sang vùng `shared` phù hợp.

## 5. Quy tắc đặt tên và export

- Folder và file: `kebab-case`, ví dụ `device-detail-sheet.tsx`.
- React component, type/interface: `PascalCase`.
- Function, variable, hook: `camelCase`.
- Constant chỉ dùng `UPPER_SNAKE_CASE` khi thực sự là hằng số cấu hình bất biến; các map/domain constant hiện tại có thể dùng `camelCase`.
- Route entry giữ đúng tên Next.js: `page.tsx`, `layout.tsx`, `loading.tsx`.
- Ưu tiên named export cho component và hàm; chỉ route entry dùng default export theo convention Next.js.
- TypeScript strict; không dùng `any` khi có thể mô tả kiểu cụ thể hoặc `unknown` rồi thu hẹp kiểu.

## 6. Quy tắc import

- Dùng alias `@/` khi import qua thư mục khác: `@/components/ui/button`, `@/lib/devices`.
- Dùng relative import cho file cùng feature: `./device-table`.
- Dùng `import type` khi chỉ import type.
- Thứ tự nhóm import: thư viện ngoài → alias nội bộ → relative; có thể ngăn nhóm bằng dòng trống khi giúp dễ đọc.
- Không import từ file build (`.next/`) hoặc đường dẫn sâu trong `node_modules/`.
- Không tạo barrel export chỉ để rút ngắn import; chỉ tạo khi module cần một public API có chủ đích và không gây import vòng.

## 7. Server/Client Component và quản lý state

- Mặc định mọi component là Server Component.
- Client Component chỉ dùng khi có tương tác, state, effect, context, event handler hoặc browser API.
- Đặt provider ở layout gần nhất bao phủ đúng các route cần state, không mặc định đưa mọi provider lên root layout.
- State cục bộ thuộc component; state dùng chung trong một feature thuộc `*-provider.tsx`.
- Derived state phải được tính từ state nguồn, không lưu trùng nếu có thể suy ra.
- Timer, subscription và listener phải cleanup trong `useEffect`.
- Query string dùng cho trạng thái cần liên kết/chia sẻ như tab, filter hoặc entity đang mở; state tạm thời của form giữ cục bộ.
- Component không chứa business transition phức tạp; gọi hàm thuần từ `lib/` rồi cập nhật state/hiển thị toast.

## 8. Mẫu thêm feature mới

Ví dụ thêm feature `harvests`:

```text
app/admin/harvests/
├── page.tsx
└── loading.tsx

components/harvests/
├── harvests-page.tsx
├── harvests-provider.tsx       # Chỉ khi cần shared client state
├── harvest-table.tsx
├── harvest-detail-sheet.tsx
└── harvest-form.tsx

lib/harvests.ts                 # Type, data, validation, selector/transition
tests/harvests.test.ts
```

Trình tự triển khai:

1. Định nghĩa type và rule nghiệp vụ trong `lib`.
2. Viết test cho validation/transition/selector.
3. Tạo UI trong `components/<feature>`.
4. Tạo route mỏng trong `app/admin/<feature>`.
5. Bổ sung navigation và tài liệu khi cần.
6. Chạy `npm run lint`, `npm test` và `npm run build` trước khi hoàn tất.

## 9. Khi nào cần tách file hoặc thư mục

Tách file khi có ít nhất một dấu hiệu:

- Có thể đặt tên rõ ràng cho một khối UI độc lập.
- Logic nghiệp vụ cần test mà không cần render React.
- Một phần state cần chia sẻ cho nhiều component cùng feature.
- File có nhiều lý do thay đổi hoặc trộn domain model với UI.
- Một domain đã có nhiều nhóm logic riêng như types, selectors, transitions và mock data.

Không tách chỉ để đạt số dòng tùy ý. Một file gắn kết tốt có thể dài hơn một file bị chia vụn nhưng phụ thuộc chéo.

## 10. Các cách tổ chức không chấp nhận

- Tạo `src/` cho riêng feature mới trong khi code cũ vẫn ở root.
- Đặt toàn bộ màn hình và logic vào `app/**/page.tsx`.
- Đưa component có nghiệp vụ vào `components/ui/`.
- Đặt validation hoặc state transition quan trọng trực tiếp trong JSX/event handler.
- Tạo các thư mục chung chung như `helpers/`, `common/`, `misc/` mà không có ranh giới trách nhiệm.
- Sao chép type hoặc constant giữa các feature.
- Import ngược từ `lib/` vào `components/` hoặc `app/`.
- Thêm file mới vào `.next/`, `node_modules/` hoặc chỉnh sửa generated code.

## 11. Checklist review cấu trúc

- [ ] File nằm đúng domain và đúng tầng (`app`, `components`, `hooks`, `lib`, `tests`).
- [ ] Route mỏng và chưa bị biến thành nơi chứa business logic.
- [ ] `"use client"` được đặt ở ranh giới nhỏ nhất cần thiết.
- [ ] Code dùng chung là dùng chung thực tế, không phải abstraction dự đoán trước.
- [ ] Import tuân thủ đúng chiều phụ thuộc và không tạo vòng lặp.
- [ ] Type, validation và transition của domain nằm trong `lib`.
- [ ] Business rule mới hoặc thay đổi đã có test.
- [ ] Tên file/export nhất quán với convention.
- [ ] Không tạo thêm cấu trúc song song với source code hiện tại.
- [ ] `npm run lint`, `npm test`, `npm run build` chạy thành công.
