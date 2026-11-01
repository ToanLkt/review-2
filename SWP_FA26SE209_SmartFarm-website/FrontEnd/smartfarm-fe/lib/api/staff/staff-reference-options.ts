import { staffFarmService } from "./staff-farm-instance";
import { staffIoTService } from "./staff-iot-instance";
import { staffOrdersService } from "./staff-orders-instance";
import { staffCultivationService } from "./staff-cultivation-instance";
import { staffDeliveriesService } from "./staff-deliveries-instance";

export type ReferenceKind = "tray" | "availableTray" | "device" | "order" | "confirmedOrder" | "rentalOrder" | "rental" | "seed" | "user" | "staff" | "delivery" | "payment";
export type ReferenceOption = { value: string; label: string; customerId?: number; customerName?: string };

export async function collectPages<T>(load: (page: number) => Promise<{ items: T[]; totalPages: number }>): Promise<T[]> {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) items.push(...(await load(page)).items);
  return items;
}

export async function loadReferenceOptions(kind: ReferenceKind, orderId?: string): Promise<ReferenceOption[]> {
  if (kind === "delivery") {
    const items = await collectPages(page => staffDeliveriesService.list({ page, pageSize: 100 }));
    return items.map(x => ({ value: String(x.deliveryId), label: `${x.orderCode} · ${x.recipientName}` }));
  }
  if (kind === "tray" || kind === "availableTray") {
    const items = await staffFarmService.trays(kind === "availableTray" ? { status: "AVAILABLE" } : {});
    return items.map(x => ({ value: String(x.soilTrayId), label: `${x.trayCode} · tầng ${x.tierIndex}` }));
  }
  if (kind === "device") {
    const items = await collectPages(page => staffIoTService.devices({ page, pageSize: 100 }));
    return items.map(x => ({ value: String(x.deviceId), label: `${x.deviceCode} · ${x.deviceType}` }));
  }
  if (kind === "seed") {
    const items = await staffCultivationService.supplies({ type: "SEED", active: true });
    return items.map(x => ({ value: String(x.supplyId), label: x.supplyName }));
  }
  if (kind === "rental" && orderId) {
    const order = await staffOrdersService.get(Number(orderId));
    return order.rentals.map(x => ({ value: String(x.trayRentalId), label: `${order.orderCode} · ${x.trayCode} · ${order.customerName}` }));
  }
  const orders = await collectPages(page => staffOrdersService.list({ page, pageSize: 100,
    status: kind === "confirmedOrder" ? "CONFIRMED" : undefined,
    orderType: kind === "rentalOrder" || kind === "rental" ? "TRAY_RENTAL" : undefined,
  }));
  if (kind === "rental") return orders.flatMap(order => order.rentals.map(x => ({
    value: String(x.trayRentalId), label: `${order.orderCode} · ${x.trayCode} · ${order.customerName}`,
  })));
  const eligibleOrders = kind === "rentalOrder"
    ? orders.filter(x => ["CONFIRMED", "PREPARING", "DELIVERING"].includes(x.status))
    : orders;
  return eligibleOrders.map(x => ({ value: String(x.orderId), label: `${x.orderCode} · ${x.customerName}`, customerId: x.customerId, customerName: x.customerName }));
}
