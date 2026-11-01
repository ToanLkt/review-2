export type UserTray = {
  id: string;
  code: string;
  seedName: string;
  status: "Đang trồng" | "Nảy mầm" | "Sẵn thu hoạch";
  location: string;
  temp: number;
  humidity: number;
  daysLeft: number;
  totalDays: number;
  lastUpdate: string;
  image: string;
};

export const userTrays: UserTray[] = [
  { id: "mt1", code: "TRY-2024-001", seedName: "Rau mầm hướng dương", status: "Đang trồng", location: "Kệ A · Vị trí 3", temp: 24.5, humidity: 68, daysLeft: 4, totalDays: 7, lastUpdate: "5 phút trước", image: "https://images.unsplash.com/photo-1758702087578-46d7eacfb9ca?w=800&h=550&fit=crop&auto=format" },
  { id: "mt2", code: "TRY-2024-002", seedName: "Rau mầm đậu Hà Lan", status: "Nảy mầm", location: "Kệ B · Vị trí 1", temp: 23.2, humidity: 72, daysLeft: 6, totalDays: 8, lastUpdate: "8 phút trước", image: "https://images.unsplash.com/photo-1640671511581-0cc93ea3ebf2?w=800&h=550&fit=crop&auto=format" },
  { id: "mt3", code: "TRY-2024-003", seedName: "Rau mầm củ cải đỏ", status: "Sẵn thu hoạch", location: "Kệ A · Vị trí 5", temp: 22.8, humidity: 65, daysLeft: 0, totalDays: 6, lastUpdate: "2 phút trước", image: "https://images.unsplash.com/photo-1593850684282-82029c1ac6be?w=800&h=550&fit=crop&auto=format" },
];

export function trayProgress(tray: UserTray): number {
  return Math.round(((tray.totalDays - tray.daysLeft) / tray.totalDays) * 100);
}

export function getTraySummary(trays: UserTray[]) {
  return {
    total: trays.length,
    growing: trays.filter((tray) => tray.daysLeft > 0).length,
    ready: trays.filter((tray) => tray.daysLeft === 0).length,
    averageTemp: trays.length ? Number((trays.reduce((sum, tray) => sum + tray.temp, 0) / trays.length).toFixed(1)) : 0,
  };
}

export const trayHistory = [
  { date: "24/01/2024", title: "Bắt đầu gieo hạt", kind: "start" },
  { date: "25/01/2024", title: "Hạt bắt đầu nảy mầm", kind: "growth" },
  { date: "26/01/2024", title: "Điều chỉnh độ ẩm môi trường", kind: "adjust" },
  { date: "27/01/2024", title: "Mầm phát triển ổn định", kind: "growth" },
  { date: "28/01/2024", title: "Cập nhật hình ảnh mới nhất", kind: "growth" },
];

export type TrayEnvironmentReading = {
  time: string;
  temp: number;
  humidity: number;
  light: number;
};

export const environmentReadings: TrayEnvironmentReading[] = [
  { time: "04:30", temp: 23.4, humidity: 69, light: 380 },
  { time: "05:30", temp: 23.5, humidity: 70, light: 520 },
  { time: "06:30", temp: 23.7, humidity: 71, light: 760 },
  { time: "07:30", temp: 23.9, humidity: 70, light: 1040 },
  { time: "08:30", temp: 24.2, humidity: 69, light: 1280 },
  { time: "09:30", temp: 24.5, humidity: 68, light: 1420 },
];
export function trayEnvironmentReadings(tray: UserTray) {
  const lastIndex = environmentReadings.length - 1;
  return environmentReadings.map((reading, index) => ({
    ...reading,
    temp: Number((tray.temp - (lastIndex - index) * 0.2).toFixed(1)),
    humidity: Math.max(0, tray.humidity + ((lastIndex - index) % 3)),
  }));
}
