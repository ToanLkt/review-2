"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, Grid2X2, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Status, Pagination, DetailField } from "./shared";
import { money, date } from "@/lib/formatters";
import { useLiveDashboard } from "./live-dashboard-provider";
import type { Order } from "@/lib/types";
export function OrdersTable({
  orders,
  tab,
  setTab,
}: {
  orders: Order[];
  tab: string;
  setTab: (s: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const { orders: allOrders, trays, fulfill } = useLiveDashboard();
  const order = allOrders.find((o) => o.id === selected);
  const current = Math.min(page, Math.max(1, Math.ceil(orders.length / 5)));
  return (
    <>
      <Card className="section-card min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="section-title">Đơn hàng gần đây</h2>
            <p className="subtle mt-1">
              Thuê khay và mua hạt giống được quản lý riêng
            </p>
          </div>
          <Button asChild variant="ghost" className="text-xs text-primary">
            <Link href="/admin/orders">
              Xem tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          className="px-5 pb-4"
        >
          <TabsList className="h-9 bg-muted">
            {[
              ["all", "Tất cả"],
              ["rental", "Thuê khay"],
              ["retail", "Mua hạt giống"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Mã đơn",
                "Khách hàng",
                "Loại đơn",
                "Tổng tiền",
                "Thanh toán",
                "Trạng thái",
                "Ngày tạo",
                "Thao tác",
              ].map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice((current - 1) * 5, current * 5).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-semibold text-primary">
                  {o.id}
                </TableCell>
                <TableCell>{o.customer}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {o.kind === "rental" ? (
                      <Grid2X2 className="size-3.5 text-primary" />
                    ) : (
                      <Package className="size-3.5 text-muted-foreground" />
                    )}
                    {o.kind === "rental" ? "Thuê khay" : "Mua hạt giống"}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{money(o.total)}</TableCell>
                <TableCell>
                  <Status>{o.payment}</Status>
                </TableCell>
                <TableCell>
                  <Status>{o.status}</Status>
                </TableCell>
                <TableCell>{date(o.created)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    aria-label={`Chi tiết đơn ${o.id}`}
                    onClick={() => setSelected(o.id)}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!orders.length && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-28 text-center text-muted-foreground"
                >
                  Không có đơn hàng trong khoảng ngày và loại đơn đã chọn.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          page={current}
          total={orders.length}
          size={5}
          onChange={setPage}
        />
      </Card>
      <Sheet open={!!order} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Đơn hàng {order?.id}</SheetTitle>
            <SheetDescription>
              {order?.kind === "rental"
                ? "Đơn thuê khay và các đợt giao rau"
                : "Đơn mua hạt giống đóng gói"}
            </SheetDescription>
          </SheetHeader>
          {order && (
            <div className="px-6 pb-8">
              <dl>
                <DetailField label="Khách hàng">{order.customer}</DetailField>
                <DetailField label="Ngày tạo">
                  {date(order.created)}
                </DetailField>
                <DetailField label="Tổng tiền">
                  {money(order.total)}
                </DetailField>
                <DetailField label="Thanh toán">
                  <Status>{order.payment}</Status>
                </DetailField>
                <DetailField label="Trạng thái đơn hàng">
                  <Status>{order.status}</Status>
                </DetailField>
              </dl>
              {order.kind === "rental" ? (
                <>
                  <h3 className="mt-6 mb-3 font-semibold">
                    Khay thuê và hạt giống đã chọn
                  </h3>
                  {order.trayIds.map((id) => {
                    const tray = trays.find((t) => t.id === id);
                    return (
                      tray && (
                        <div key={id} className="mb-2 rounded-lg border p-3">
                          <p className="text-sm font-medium">
                            {tray.id} · {tray.seed}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Status>{tray.stage}</Status>
                            <span className="subtle">{date(tray.harvest)}</span>
                          </div>
                        </div>
                      )
                    );
                  })}
                  <h3 className="mt-6 mb-2 font-semibold">
                    Các đợt giao dưới cùng một đơn
                  </h3>
                  <p className="subtle mb-3">
                    Các loại rau có thời gian trưởng thành khác nhau được giao
                    riêng; không thu tiền lại theo đợt.
                  </p>
                  {order.batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="mb-3 rounded-xl bg-muted p-4"
                    >
                      <p className="flex items-center gap-2 text-xs font-semibold">
                        <Truck className="size-4 text-primary" />
                        {batch.id} · {date(batch.date)}
                      </p>
                      <p className="subtle mt-2">{batch.trayIds.join(", ")}</p>
                      <div
                        role="progressbar"
                        aria-label={`Tiến độ ${batch.id}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                          batch.status === "Đã giao"
                            ? 100
                            : batch.status === "Chờ giao"
                              ? 70
                              : 35
                        }
                        className="mt-3 h-1.5 rounded-full bg-border"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width:
                              batch.status === "Đã giao"
                                ? "100%"
                                : batch.status === "Chờ giao"
                                  ? "70%"
                                  : "35%",
                          }}
                        />
                      </div>
                      <p className="subtle mt-2">
                        {batch.status} ·{" "}
                        {batch.status === "Đã giao"
                          ? "100"
                          : batch.status === "Chờ giao"
                            ? "70"
                            : "35"}
                        %
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <h3 className="mt-6 mb-3 font-semibold">
                    Sản phẩm hạt giống
                  </h3>
                  {order.products.map((p) => (
                    <div key={p.name} className="rounded-xl bg-muted p-4">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="subtle mt-2">
                        {p.quantity} gói × {money(p.price)}
                      </p>
                    </div>
                  ))}
                  <dl>
                    <DetailField label="Vận chuyển">
                      {order.status === "Hoàn tất"
                        ? "Đã giao hàng"
                        : order.status === "Đã hủy"
                          ? "Đã hủy giao hàng"
                          : order.shipping}
                    </DetailField>
                  </dl>
                </>
              )}
              {order.status !== "Hoàn tất" && order.status !== "Đã hủy" && (
                <div className="mt-6">
                  <Button
                    className="w-full"
                    disabled={
                      order.payment !== "Đã xác nhận" ||
                      order.status !== "Chờ xử lý"
                    }
                    onClick={() => void fulfill(order.id)}
                  >
                    {order.status === "Đang xử lý"
                      ? "Đã tiếp nhận xử lý"
                      : "Tiếp nhận xử lý đơn"}
                  </Button>
                  {order.payment !== "Đã xác nhận" && (
                    <p className="subtle mt-2">
                      Chỉ xử lý đơn sau khi thanh toán được xác nhận.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
