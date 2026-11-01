import { createContext, useContext, useState, type ReactNode } from "react";
import { cartTotal } from "@/lib/catalog";
import { availableTrayCapacity } from "@/lib/capacity";
import { orderFromDemoPayment, type DemoPayment } from "@/lib/payment";
import {
  deliveries,
  initialNotifications,
  initialProfile,
  orders,
  trays,
  type CartItem,
  type Delivery,
  type NotificationItem,
  type Order,
  type Tray,
  type UserProfile,
} from "@/data/mock";
type Store = {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  setQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  orders: Order[];
  trays: Tray[];
  payments: DemoPayment[];
  migratePaymentOwner: (previousEmail: string, nextEmail: string) => void;
  beginPayment: (address: string, userId: string) => DemoPayment;
  completePayment: (id: string, status: DemoPayment["status"]) => boolean;
  deliveries: Delivery[];
  scheduleDelivery: (orderId: string, address: string, date: string, slot: string) => boolean;
  updateDelivery: (
    id: string,
    status: Delivery["status"],
    date?: string,
  ) => void;
  notifications: NotificationItem[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  profile: UserProfile;
  saveProfile: (value: UserProfile) => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderList, setOrderList] = useState<Order[]>(orders);
  const [trayList] = useState<Tray[]>(trays);
  const [deliveryList, setDeliveryList] = useState<Delivery[]>(deliveries);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const addItem = (item: CartItem) =>
    setCart((items) => {
      const existing = items.find((value) => value.id === item.id);
      return existing
        ? items.map((value) =>
            value.id === item.id
              ? { ...value, qty: value.qty + item.qty }
              : value,
          )
        : [...items, item];
    });
  const setQuantity = (id: string, qty: number) =>
    setCart((items) =>
      items.map((value) =>
        value.id === id ? { ...value, qty: Math.max(1, qty) } : value,
      ),
    );
  return (
    <Context.Provider
      value={{
        cart,
        addItem,
        setQuantity,
        removeItem: (id) =>
          setCart((items) => items.filter((item) => item.id !== id)),
        clearCart: () => setCart([]),
        orders: orderList,
        trays: trayList,
        payments,
        migratePaymentOwner: (previousEmail, nextEmail) => setPayments((items) => items.map((item) => item.userId === previousEmail ? { ...item, userId: nextEmail.trim().toLowerCase() } : item)),
        beginPayment: (address, userId) => { const stamp = Date.now(); const payment: DemoPayment = { id: `PAY-${stamp}`, orderId: `DH-${stamp}`, userId, status: "Pending", amount: cartTotal(cart), createdAt: new Date().toISOString(), method: "SePay QR", address, items: cart.map((item) => ({ ...item })) }; setPayments((items) => [payment, ...items]); return payment; },
        completePayment: (id, status) => { const payment = payments.find((item) => item.id === id); if (!payment || payment.status !== "Pending") return false; if (status === "Paid" && payment.items.filter((item) => item.type === "tray").reduce((sum, item) => sum + item.qty, 0) > availableTrayCapacity(payments)) return false; setPayments((items) => items.map((item) => item.id === id ? { ...item, status } : item)); if (status !== "Paid") return true; const order = orderFromDemoPayment(payment); setOrderList((items) => [order, ...items]); setCart([]); return true; },
        deliveries: deliveryList,
        scheduleDelivery: (orderId, address, date, slot) => { const order = orderList.find((item) => item.id === orderId && item.status !== "Đã hủy"); if (!order || !address.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date().toISOString().slice(0, 10) || deliveryList.some((item) => item.orderCode === order.code)) return false; setDeliveryList((items) => [{ id: `delivery-${order.id}`, orderCode: order.code, items: order.items.map((item) => item.name).join(", "), status: "Đã đặt lịch", statusColor: "blue", expectedDate: `${date} · ${slot}`, address: address.trim() }, ...items]); return true; },
        updateDelivery: (id, status, date) =>
          setDeliveryList((items) =>
            items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    statusColor:
                      status === "Đang giao"
                        ? "blue"
                        : status === "Đã giao"
                          ? "green"
                          : "yellow",
                    expectedDate: date ?? item.expectedDate,
                  }
                : item,
            ),
          ),
        notifications,
        markRead: (id) =>
          setNotifications((items) =>
            items.map((item) =>
              item.id === id ? { ...item, read: true } : item,
            ),
          ),
        markAllRead: () =>
          setNotifications((items) =>
            items.map((item) => ({ ...item, read: true })),
          ),
        profile,
        saveProfile: setProfile,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("useStore requires StoreProvider");
  return value;
}
