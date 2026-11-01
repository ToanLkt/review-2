export const number = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
export const date = (value: string | Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
export const time = (value: string | Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
export const stamp = (value: string) => time(value) + " · " + date(value);
export const dateTime = (value: string | Date) => date(value) + " " + time(value);
export const dayKey = (value: Date) =>
  [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
export function inRange(value: string, from?: Date, to?: Date) {
  const key = value.slice(0, 10);
  return (!from || key >= dayKey(from)) && (!to || key <= dayKey(to));
}
