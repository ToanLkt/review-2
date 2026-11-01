import {
  rentalPricing,
  type CartItem,
  type Order,
  type Seed,
} from "@/data/mock";
export const rentalDiscount = (qty: number) =>
  rentalPricing.discounts.find(
    (tier) => qty >= tier.min && (tier.max === undefined || qty <= tier.max),
  )?.pct ?? 0;
export const rentalTotal = (qty: number, duration: number) =>
  Math.round(
    rentalPricing.basePrice *
      Math.max(1, qty) *
      Math.max(1, duration) *
      (1 - rentalDiscount(qty) / 100),
  );
export const cartLineTotal = (item: CartItem) =>
  item.type === "tray"
    ? rentalTotal(item.qty, item.duration ?? 1)
    : item.price * item.qty;
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + cartLineTotal(item), 0);
export const cartShipping = (items: CartItem[]) =>
  items.some((item) => item.type === "seed") ? 30000 : 0;
export const cartTotal = (items: CartItem[]) =>
  cartSubtotal(items) + cartShipping(items);
export function filterSeeds(
  items: Seed[],
  query: string,
  category: string,
  sort: "popular" | "price-asc" | "price-desc",
) {
  const normalized = query.trim().toLocaleLowerCase("vi");
  const result = items.filter(
    (seed) =>
      (category === "Tất cả" || seed.category === category) &&
      `${seed.name} ${seed.shortDesc}`
        .toLocaleLowerCase("vi")
        .includes(normalized),
  );
  return sort === "popular"
    ? result
    : [...result].sort((a, b) =>
        sort === "price-asc" ? a.price - b.price : b.price - a.price,
      );
}
export const filterOrders = (items: Order[], query: string, status: string) =>
  items.filter(
    (order) =>
      (status === "Tất cả" ||
        order.status === status ||
        (status === "Chờ xử lý" && order.status === "Đang xử lý")) &&
      `${order.code} ${order.items.map((item) => item.name).join(" ")}`
        .toLocaleLowerCase("vi")
        .includes(query.trim().toLocaleLowerCase("vi")),
  );
export const trayProgress = (daysLeft: number, totalDays: number) =>
  totalDays
    ? Math.max(
        0,
        Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)),
      )
    : 0;
