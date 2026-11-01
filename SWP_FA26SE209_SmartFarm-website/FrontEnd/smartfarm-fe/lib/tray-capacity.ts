export const demoTrayCapacity = { available: 12, total: 24, optionName: "Khay rau mầm tiêu chuẩn" };
export function isValidTrayQuantity(quantity: number) { return Number.isInteger(quantity) && quantity > 0 && quantity <= demoTrayCapacity.available; }
export function remainingTrayCapacity(payments: { status: string; items: { type: string; qty: number; trayQuantity?: number }[] }[]): number { const used = payments.filter((payment) => payment.status === "Paid").reduce((total, payment) => total + payment.items.filter((item) => item.type === "tray").reduce((sum, item) => sum + (item.trayQuantity ?? 1) * item.qty, 0), 0); return Math.max(0, demoTrayCapacity.available - used); }
export function availableTrayCapacity(): number {
  if (typeof window === "undefined") return demoTrayCapacity.available;
  try { const payments: { status: string; items: { type: string; qty: number; trayQuantity?: number }[] }[] = JSON.parse(localStorage.getItem("smartfarm_demo_payments") ?? "[]"); return remainingTrayCapacity(payments); } catch { return demoTrayCapacity.available; }
}
