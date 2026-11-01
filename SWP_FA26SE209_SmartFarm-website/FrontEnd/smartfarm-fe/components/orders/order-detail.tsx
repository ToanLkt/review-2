"use client";
import { useState } from "react";
import { Phone, MapPin, Clock3 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { money, date, stamp } from "@/lib/formatters";
import { availableActions, actionLabels, type OrderAction } from "@/lib/orders";
import { useOrders } from "./orders-provider";
import { OrderItems, RelatedTray } from "./order-items";
import { Section, Note, ProcessingTimeline } from "./order-ui";
import { PaymentSection } from "./payment-section";
export function OrderDetail({
  id,
  onClose,
  returnFocus,
}: {
  id: string;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { orders, state, operations, execute } = useOrders(),
    order = orders.find((o) => o.id === id)!,
    record = state.records[id];
  const [action, setAction] = useState<OrderAction | null>(null),
    [tray, setTray] = useState<string | null>(null);
  const actions = availableActions(order, record, operations);
  return (
    <>
      <Sheet open onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="h-dvh w-full! max-w-none! gap-0 overflow-hidden! bg-white sm:w-[80vw]! lg:w-[900px]!"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus();
          }}
        >
          <SheetHeader className="shrink-0 border-b px-6 py-5 pr-12">
            <SheetTitle className="text-base">
              Chi tiết {id} ·{" "}
              {order.kind === "rental" ? "Đơn thuê khay" : "Đơn mua hạt giống"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Ngày tạo: {stamp(order.created)}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {tray ? (
              <RelatedTray id={tray} onBack={() => setTray(null)} />
            ) : (
              <div className="grid gap-7 lg:grid-cols-[1.08fr_1fr]">
                <div className="min-w-0 space-y-6">
                  <OrderItems order={order} onTray={setTray} />
                  <Section title="TỔNG TIỀN">
                    <dl className="space-y-3 rounded-xl border p-4 text-sm">
                      <div className="flex justify-between">
                        <dt>Tạm tính</dt>
                        <dd>{money(order.total - record.shippingFee)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Phí giao hàng</dt>
                        <dd>{money(record.shippingFee)}</dd>
                      </div>
                      <div className="flex justify-between border-t pt-3 font-bold text-primary">
                        <dt>Tổng cộng</dt>
                        <dd>{money(order.total)}</dd>
                      </div>
                    </dl>
                  </Section>
                </div>
                <div className="min-w-0 space-y-6">
                  <Section title="KHÁCH HÀNG & GIAO HẸN">
                    <div className="space-y-3 rounded-xl bg-[#F7FAF8] p-4 text-xs">
                      <h4 className="text-sm font-semibold">
                        {order.customer}
                      </h4>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" />
                        <a
                          href={"tel:" + record.phone}
                          className="hover:text-primary"
                        >
                          {record.phone}
                        </a>
                      </p>
                      <p className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="size-4 shrink-0" />
                        {record.address}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Clock3 className="size-4" />
                        {date(record.appointment)} 08:00 – 10:00
                      </p>
                    </div>
                  </Section>
                  <Section title="TRẠNG THÁI XỬ LÝ">
                    <ProcessingTimeline
                      kind={order.kind}
                      status={record.processing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Giao hàng: {record.delivery}
                    </p>
                    <Note>
                      Chỉ đặt ‘Đang giao hàng’ sau khi ghi nhận bàn giao thực
                      tế, và ‘Hoàn tất’ sau khi xác nhận khách đã nhận hàng.
                      Không tự động chuyển trạng thái.
                    </Note>
                    {order.payment !== "Đã xác nhận" && (
                      <Note warm>
                        Chỉ tiếp tục xử lý sau khi thanh toán được xác nhận.
                      </Note>
                    )}
                    {order.kind === "rental" &&
                      record.processing === "Đang trồng" && (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Chỉ xác nhận sẵn sàng thu hoạch khi đã cấp phát đủ
                          khay và mọi chu kỳ liên quan đã sẵn sàng. Ghi nhận thu
                          hoạch tại mô-đun Chu kỳ trồng trước khi đóng gói.
                        </p>
                      )}
                  </Section>
                  <PaymentSection order={order} record={record} />
                  {record.events.length > 0 && (
                    <Section title="NHẬT KÝ XỬ LÝ">
                      {record.events.map((e, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-muted/50 p-3 text-xs"
                        >
                          <p>{e.text}</p>
                          <p className="mt-1 text-muted-foreground">
                            {stamp(e.at)}
                          </p>
                        </div>
                      ))}
                    </Section>
                  )}
                </div>
              </div>
            )}
          </div>
          <SheetFooter className="shrink-0 flex-row flex-wrap justify-end border-t px-6 py-4">
            {!tray &&
              actions.map((a) => (
                <Button
                  key={a}
                  variant={a === "cancel" ? "outline" : "default"}
                  className={
                    a === "cancel"
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : ""
                  }
                  onClick={() => setAction(a)}
                >
                  {actionLabels[a]}
                </Button>
              ))}
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {action && (
        <AlertDialog open onOpenChange={(v) => !v && setAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {action === "cancel"
                  ? "Hủy đơn hàng?"
                  : actionLabels[action] + "?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {action === "cancel"
                  ? "Bạn có chắc muốn hủy đơn " +
                    id +
                    "? Hành động này sẽ cập nhật trạng thái đơn hàng và có thể ảnh hưởng đến việc giữ khay, chu kỳ trồng hoặc tồn kho."
                  : action === "handover"
                    ? "Xác nhận đã bàn giao thực tế đơn " +
                      id +
                      " cho đơn vị vận chuyển. Hạt giống đã giữ sẽ được xuất kho đúng một lần."
                    : action === "receive"
                      ? "Chỉ xác nhận sau khi có thông tin khách đã thực sự nhận đủ hàng của đơn " +
                        id +
                        "."
                      : action === "complete"
                        ? "Xác nhận kết thúc xử lý đơn " +
                          id +
                          " sau khi khách đã nhận đủ hàng."
                        : "Xác nhận cập nhật bước xử lý đơn " + id + "."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
              <Button
                variant={action === "cancel" ? "destructive" : "default"}
                onClick={() => {
                  execute(id, action);
                  setAction(null);
                }}
              >
                {action === "cancel" ? "Xác nhận hủy đơn" : "Xác nhận"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
