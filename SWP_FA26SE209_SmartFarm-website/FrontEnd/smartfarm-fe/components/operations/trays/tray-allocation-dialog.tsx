"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Choice, Field, FormError, EmptyState } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { remaining } from "@/lib/operations/selectors";
import type { PhysicalTray } from "@/lib/operations/types";
export function TrayAllocationDialog({
  tray,
  onClose,
}: {
  tray: PhysicalTray;
  onClose: () => void;
}) {
  const { state, orders, execute } = useOperations();
  const [orderId, setOrder] = useState("");
  const [itemId, setItem] = useState("");
  const [error, setError] = useState("");
  const eligible = orders.filter(
    (o) =>
      o.kind === "rental" &&
      o.payment === "Đã xác nhận" &&
      o.status !== "Hoàn tất" &&
      o.status !== "Đã hủy" &&
      state.items.some((i) => i.orderId === o.id && remaining(state, i.id) > 0),
  );
  const items = state.items.filter(
    (i) => i.orderId === orderId && remaining(state, i.id) > 0,
  );
  const item = items.find((i) => i.id === itemId);
  const order = eligible.find((o) => o.id === orderId);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân bổ đơn thuê</DialogTitle>
          <DialogDescription>
            Khay {tray.code} sẽ được giữ chỗ cho đơn đã thanh toán.
          </DialogDescription>
        </DialogHeader>
        {eligible.length ? (
          <div className="space-y-4">
            <Field label="Đơn thuê đã xác nhận thanh toán">
              <Choice
                label="Chọn đơn thuê"
                value={orderId}
                onChange={(v) => {
                  setOrder(v);
                  setItem("");
                }}
                options={[
                  { value: "", label: "Chọn đơn thuê" },
                  ...eligible.map((o) => ({
                    value: o.id,
                    label: o.id + " · " + o.customer,
                  })),
                ]}
              />
            </Field>
            <Field label="Dòng hàng cần phân bổ">
              <Choice
                label="Chọn dòng hàng thuê"
                value={itemId}
                onChange={setItem}
                disabled={!orderId}
                options={[
                  { value: "", label: "Chọn loại rau" },
                  ...items.map((i) => ({
                    value: i.id,
                    label:
                      i.seed + " · còn " + remaining(state, i.id) + " khay",
                  })),
                ]}
              />
            </Field>
            {order && item && (
              <dl className="space-y-2 rounded-xl bg-muted p-4 text-xs">
                <div className="flex justify-between">
                  <dt>Khách hàng</dt>
                  <dd>{order.customer}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Loại rau</dt>
                  <dd>{item.seed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Số khay yêu cầu</dt>
                  <dd>{item.quantity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Còn cần phân bổ</dt>
                  <dd className="font-semibold text-primary">
                    {remaining(state, item.id)}
                  </dd>
                </div>
              </dl>
            )}
            <p className="subtle">
              Phân bổ chỉ giữ chỗ khay. Chu kỳ trồng được tạo riêng tại mục Chu
              kỳ trồng.
            </p>
            <FormError message={error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                disabled={!item}
                onClick={async () => {
                  const r = await execute(
                    { type: "allocate", id: tray.id, itemId },
                    "Đã phân bổ khay cho đơn thuê.",
                  );
                  if (r.ok) onClose();
                  else setError(r.message);
                }}
              >
                Xác nhận phân bổ
              </Button>
            </div>
          </div>
        ) : (
          <>
            <EmptyState
              title="Không có đơn thuê phù hợp"
              description="Cần đơn thuê đã thanh toán, còn hiệu lực và chưa được phân bổ đủ khay."
            />
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
