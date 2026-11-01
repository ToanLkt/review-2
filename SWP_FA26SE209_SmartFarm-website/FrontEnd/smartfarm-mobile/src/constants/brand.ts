export const brand = {
  ink: "#1A2E1F",
  forest: "#4F8F68",
  green: "#4F8F68",
  dark: "#3F7655",
  mid: "#2A3F2F",
  mint: "#E8F3EB",
  canvas: "#F3F8F4",
  muted: "#6B7280",
  secondary: "#374151",
  lightMuted: "#9CA3AF",
  line: "#E8F3EB",
  white: "#FFFFFF",
  orange: "#F59E0B",
  danger: "#EF5350",
  info: "#3B82F6",
} as const;
export const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
