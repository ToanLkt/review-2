export type ControlKind = "fan" | "light" | "pump";

export const controlDefinitions: { kind: ControlKind; name: string; description: string }[] = [
  { kind: "fan", name: "Quạt thông gió", description: "Lưu thông không khí trong khu vực trồng" },
  { kind: "light", name: "Đèn chiếu sáng", description: "Bổ sung ánh sáng cho khay trồng" },
  { kind: "pump", name: "Bơm nước", description: "Cấp nước cho hệ thống tưới" },
];

export function controlsForDevice(deviceType: string) {
  const type = deviceType.toUpperCase();
  if (/CAMERA|^CAM|SENSOR|CẢM BIẾN/.test(type)) return [];
  if (/FAN|QUẠT/.test(type)) return controlDefinitions.filter((item) => item.kind === "fan");
  if (/LED|LIGHT|ĐÈN/.test(type)) return controlDefinitions.filter((item) => item.kind === "light");
  if (/PUMP|BƠM/.test(type)) return controlDefinitions.filter((item) => item.kind === "pump");
  return controlDefinitions;
}
