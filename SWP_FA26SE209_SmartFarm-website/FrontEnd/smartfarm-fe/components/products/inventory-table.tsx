"use client";
import { Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { date } from "@/lib/formatters";
import type { Product, Batch } from "@/lib/products";

const TODAY = "2026-09-17";
const THREE_MONTHS_FROM_TODAY = "2026-12-16";

export function InventoryTable({
  products,
  batches,
}: {
  products: Product[];
  batches: Batch[];
}) {
  if (!batches.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="rounded-2xl bg-secondary p-4">
          <Package className="size-7 text-primary" />
        </span>
        <h3 className="font-semibold">Chưa có lô nhập kho</h3>
        <p className="text-sm text-muted-foreground">
          Các lô nhập hạt giống sẽ xuất hiện tại đây.
        </p>
      </div>
    );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table className="min-w-[900px] table-fixed">
          <colgroup>
            {[12, 22, 14, 14, 14, 12, 12].map((w, i) => (
              <col key={i} style={{ width: w + "%" }} />
            ))}
          </colgroup>
          <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#809E8A]">
            <TableRow>
              {[
                "MÃ LÔ",
                "SẢN PHẨM",
                "NGÀY NHẬP",
                "HẠN SỬ DỤNG",
                "SỐ LƯỢNG",
                "TRẠNG THÁI SP",
                "TÌNH TRẠNG",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => {
              const product = products.find((p) => p.id === b.productId);
              const expiring =
                b.expiryDate >= TODAY &&
                b.expiryDate <= THREE_MONTHS_FROM_TODAY;
              const expired = b.expiryDate < TODAY;
              return (
                <TableRow
                  key={b.id}
                  className="hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
                >
                  <TableCell className="text-xs font-semibold text-primary">
                    {b.id}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {b.productName}
                  </TableCell>
                  <TableCell className="text-xs">
                    {date(b.importDate)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-xs " +
                      (expired
                        ? "font-semibold text-red-600"
                        : expiring
                          ? "font-semibold text-amber-600"
                          : "")
                    }
                  >
                    {date(b.expiryDate)}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {b.quantity} gói
                  </TableCell>
                  <TableCell>
                    {product && (
                      <Badge
                        variant="outline"
                        className={
                          "px-2.5 py-1 text-[11px] font-medium " +
                          (product.status === "Đang bán"
                            ? "status-green"
                            : product.status === "Hết hàng"
                              ? "status-red"
                              : "border-0 bg-slate-100 text-muted-foreground")
                        }
                      >
                        {product.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        "px-2.5 py-1 text-[11px] font-medium " +
                        (expired
                          ? "status-red"
                          : expiring
                            ? "status-amber"
                            : "status-green")
                      }
                    >
                      {expired
                        ? "Đã hết hạn"
                        : expiring
                          ? "Sắp hết hạn"
                          : "Còn hạn"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 bg-[#F7FAF8] p-4 md:hidden">
        {batches.map((b) => {
          const product = products.find((p) => p.id === b.productId);
          const expiring =
            b.expiryDate >= TODAY && b.expiryDate <= THREE_MONTHS_FROM_TODAY;
          const expired = b.expiryDate < TODAY;
          return (
            <article
              key={b.id}
              className="space-y-3 rounded-2xl border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-primary">{b.id}</p>
                  <p className="mt-1 text-sm font-medium">{b.productName}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    "shrink-0 px-2.5 py-1 text-[11px] font-medium " +
                    (expired
                      ? "status-red"
                      : expiring
                        ? "status-amber"
                        : "status-green")
                  }
                >
                  {expired
                    ? "Đã hết hạn"
                    : expiring
                      ? "Sắp hết hạn"
                      : "Còn hạn"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>Nhập: {date(b.importDate)}</span>
                <span
                  className={
                    expired
                      ? "font-semibold text-red-600"
                      : expiring
                        ? "font-semibold text-amber-600"
                        : ""
                  }
                >
                  HSD: {date(b.expiryDate)}
                </span>
                <span className="font-medium text-foreground">
                  {b.quantity} gói
                </span>
              </div>
              {product && (
                <Badge
                  variant="outline"
                  className={
                    "px-2.5 py-1 text-[11px] font-medium " +
                    (product.status === "Đang bán"
                      ? "status-green"
                      : product.status === "Hết hàng"
                        ? "status-red"
                        : "border-0 bg-slate-100 text-muted-foreground")
                  }
                >
                  {product.status}
                </Badge>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
