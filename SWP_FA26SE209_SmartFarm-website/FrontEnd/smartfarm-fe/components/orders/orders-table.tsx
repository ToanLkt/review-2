"use client";

import { ArrowUpRight, CalendarDays, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money, date, time } from "@/lib/formatters";
import type { Order } from "@/lib/types";
import type { OrderRecord } from "@/lib/orders";
import { OrderBadge } from "./order-ui";

export function OrderTable({ orders, records, open, reset, hasOrders }: {
  orders: Order[];
  records: Record<string, OrderRecord>;
  open: (id: string) => void;
  reset: () => void;
  hasOrders: boolean;
}) {
  if (!orders.length) return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F1F7F2] text-primary"><PackageSearch className="size-7" /></span>
      <h3 className="mt-5 text-base font-semibold text-[#173B29]">{hasOrders ? "Không tìm thấy đơn hàng phù hợp" : "Chưa có đơn hàng"}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{hasOrders ? "Thử từ khóa khác hoặc điều chỉnh bộ lọc để xem thêm đơn hàng." : "Đơn thuê khay và đơn mua hạt giống sẽ xuất hiện tại đây khi được tạo."}</p>
      {hasOrders && <Button variant="outline" onClick={reset} className="mt-5">Xóa bộ lọc</Button>}
    </div>
  );
  return <>
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[1120px]">
        <TableHeader className="bg-[#F8FBF9] [&_th]:h-12 [&_th]:px-5 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[#718A78]">
          <TableRow className="border-[#E9F0EB]">
            <TableHead>Đơn hàng</TableHead><TableHead>Khách hàng</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Tổng tiền</TableHead><TableHead>Thanh toán</TableHead><TableHead>Tiến độ</TableHead><TableHead>Giao hẹn</TableHead><TableHead className="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{orders.map((o) => <TableRow key={o.id} className="border-[#EDF2EE] transition-colors hover:bg-[#F8FBF9] [&_td]:px-5 [&_td]:py-4">
          <TableCell><button type="button" onClick={() => open(o.id)} className="font-semibold text-primary hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{o.id}</button><p className="mt-1 text-xs text-muted-foreground">{o.kind === "rental" ? "Thuê khay" : "Mua hạt giống"}</p></TableCell>
          <TableCell><p className="font-medium text-[#203629]">{o.customer}</p><p className="mt-1 text-xs text-muted-foreground">{records[o.id].phone}</p></TableCell>
          <TableCell><p className="text-sm">{date(o.created)}</p><p className="mt-1 text-xs text-muted-foreground">{time(o.created)}</p></TableCell>
          <TableCell className="text-right font-semibold tabular-nums text-[#173B29]">{money(o.total)}</TableCell>
          <TableCell><OrderBadge>{o.payment}</OrderBadge></TableCell><TableCell><OrderBadge>{records[o.id].processing}</OrderBadge></TableCell>
          <TableCell><p className="text-sm">{date(records[o.id].appointment)}</p><p className="mt-1 text-xs text-muted-foreground">08:00 – 10:00</p></TableCell>
          <TableCell className="text-right"><Button type="button" variant="ghost" size="sm" className="text-primary" aria-label={`Xem chi tiết đơn ${o.id}`} onClick={() => open(o.id)}>Xem đơn <ArrowUpRight className="size-4" /></Button></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="space-y-3 bg-[#F8FBF9] p-4 md:hidden">{orders.map((o) => <article key={o.id} className="rounded-2xl border border-[#E1ECE4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><button type="button" onClick={() => open(o.id)} className="font-semibold text-primary hover:underline">{o.id}</button><p className="mt-1 text-xs text-muted-foreground">{o.kind === "rental" ? "Thuê khay" : "Mua hạt giống"} · {date(o.created)}</p></div><strong className="shrink-0 text-sm tabular-nums text-[#173B29]">{money(o.total)}</strong></div>
      <div className="mt-4 border-t border-[#EDF2EE] pt-4"><p className="text-sm font-semibold">{o.customer}</p><p className="mt-1 text-xs text-muted-foreground">{records[o.id].phone}</p></div>
      <div className="mt-4 flex flex-wrap gap-2"><OrderBadge>{records[o.id].processing}</OrderBadge><OrderBadge>{o.payment}</OrderBadge></div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF2EE] pt-3"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{date(records[o.id].appointment)}</p><Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => open(o.id)}>Xem đơn <ArrowUpRight className="size-4" /></Button></div>
    </article>)}</div>
  </>;
}
