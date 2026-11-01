"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useDemo } from "@/components/dashboard/demo-provider";
import { useOperations } from "@/components/operations/shared/operations-provider";
import {
  initialOrderState,
  transitionOrder,
  type OrderAction,
} from "@/lib/orders";
function useOrderState() {
  const { orders, setOrders } = useDemo(),
    { state: operations, releaseOrder } = useOperations();
  const [state, setState] = useState(() =>
    initialOrderState(orders, operations),
  );
  const ref = useRef(state);
  function synchronized(source: typeof state) {
    return {
      ...source,
      records: Object.fromEntries(
        Object.entries(source.records).map(([id, record]) => {
          const order = orders.find((o) => o.id === id);
          return [
            id,
            record.processing === "Chờ xử lý" && order?.status === "Đang xử lý"
              ? {
                  ...record,
                  processing:
                    order.kind === "rental"
                      ? ("Cấp phát khay" as const)
                      : ("Đã xác nhận" as const),
                }
              : record,
          ];
        }),
      ),
    };
  }
  function execute(id: string, action: OrderAction) {
    try {
      const next = transitionOrder(
        synchronized(ref.current),
        orders,
        operations,
        id,
        action,
        new Date().toISOString(),
      );
      if (action === "cancel") releaseOrder(id);
      ref.current = next;
      setState(next);
      setOrders((old) =>
        old.map((o) =>
          o.id === id
            ? {
                ...o,
                status:
                  action === "cancel"
                    ? "Đã hủy"
                    : action === "complete"
                      ? "Hoàn tất"
                      : "Đang xử lý",
              }
            : o,
        ),
      );
      toast.success("Đã cập nhật đơn " + id, {
        description: "Chỉ lưu trong phiên hiện tại.",
      });
      return true;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Không thể cập nhật đơn hàng.",
      );
      return false;
    }
  }
  return { state: synchronized(state), orders, operations, execute };
}
const Context = createContext<ReturnType<typeof useOrderState> | null>(null);
export function OrdersProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useOrderState()}>{children}</Context.Provider>
  );
}
export function useOrders() {
  const value = useContext(Context);
  if (!value) throw new Error("Thiếu dữ liệu đơn hàng");
  return value;
}
