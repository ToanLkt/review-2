"use client";
import { Eye, Package, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/products";

const statusClass: Record<string, string> = {
  "Đang bán": "status-green",
  "Hết hàng": "status-red",
  "Tạm ngừng": "border-0 bg-slate-100 text-muted-foreground",
};

const greens = ["bg-[#E8F3EB]", "bg-[#EDF5EA]", "bg-[#E6F1E9]", "bg-[#EFF6EB]"];

export function ProductTable({
  products,
  onView,
  onEdit,
  onReset,
  hasProducts,
}: {
  products: Product[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onReset: () => void;
  hasProducts: boolean;
}) {
  if (!products.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="rounded-2xl bg-secondary p-4">
          <Package className="size-7 text-primary" />
        </span>
        <h3 className="font-semibold">
          {hasProducts
            ? "Không tìm thấy sản phẩm phù hợp"
            : "Chưa có sản phẩm"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasProducts
            ? "Thử thay đổi từ khóa hoặc bộ lọc."
            : "Các sản phẩm hạt giống sẽ xuất hiện tại đây."}
        </p>
        {hasProducts && (
          <Button variant="outline" onClick={onReset}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table className="min-w-[1050px] table-fixed">
          <colgroup>
            {[18, 8, 10, 10, 11, 9, 10, 12, 12].map((w, i) => (
              <col key={i} style={{ width: w + "%" }} />
            ))}
          </colgroup>
          <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#809E8A]">
            <TableRow>
              {[
                "SẢN PHẨM",
                "MÃ",
                "QUY CÁCH",
                "GIÁ BÁN",
                "TỒN THỰC TẾ",
                "ĐÃ GIỮ",
                "KHẢ DỤNG",
                "TRẠNG THÁI",
                "THAO TÁC",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p, i) => (
              <TableRow
                key={p.id}
                className="hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
              >
                {/* Product name + icon */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "flex size-10 shrink-0 items-center justify-center rounded-xl text-primary " +
                        greens[i % greens.length]
                      }
                    >
                      <Package className="size-4.5" strokeWidth={1.7} />
                    </span>
                    <span className="text-sm font-semibold">{p.name}</span>
                  </div>
                </TableCell>

                {/* Code */}
                <TableCell className="text-xs text-muted-foreground">
                  {p.code}
                </TableCell>

                {/* Packaging */}
                <TableCell className="text-xs">
                  Gói {p.weight} g
                </TableCell>

                {/* Price */}
                <TableCell className="text-xs font-semibold tabular-nums">
                  {new Intl.NumberFormat("vi-VN").format(p.price)} ₫
                </TableCell>

                {/* Actual stock */}
                <TableCell className="text-xs tabular-nums">
                  {p.actualStock} gói
                </TableCell>

                {/* Reserved */}
                <TableCell
                  className={
                    "text-xs tabular-nums " +
                    (p.reserved > 0 ? "text-blue-600" : "")
                  }
                >
                  {p.reserved} gói
                </TableCell>

                {/* Available */}
                <TableCell
                  className={
                    "text-xs font-semibold tabular-nums " +
                    (p.available === 0 ? "text-red-600" : "")
                  }
                >
                  {p.available} gói
                </TableCell>

                {/* Status badge */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      "px-2.5 py-1 text-[11px] font-medium " +
                      (statusClass[p.status] ?? "")
                    }
                  >
                    {p.status}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={"Xem " + p.name}
                      onClick={() => onView(p.id)}
                      className="h-8 gap-1.5 px-1.5 text-xs text-primary"
                    >
                      <Eye className="size-3.5" />
                      Xem
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={"Sửa " + p.name}
                      onClick={() => onEdit(p.id)}
                      className="h-8 gap-1.5 px-1.5 text-xs text-muted-foreground"
                    >
                      <SquarePen className="size-3.5" />
                      Sửa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 bg-[#F7FAF8] p-4 md:hidden">
        {products.map((p) => (
          <article
            key={p.id}
            className="space-y-4 rounded-2xl border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.code}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  "shrink-0 px-2.5 py-1 text-[11px] font-medium " +
                  (statusClass[p.status] ?? "")
                }
              >
                {p.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span>
                Gói {p.weight} g ·{" "}
                <strong>
                  {new Intl.NumberFormat("vi-VN").format(p.price)} ₫
                </strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>Tồn: {p.actualStock}</span>
              <span className={p.reserved > 0 ? "text-blue-600" : ""}>
                Giữ: {p.reserved}
              </span>
              <span
                className={
                  p.available === 0 ? "font-semibold text-red-600" : ""
                }
              >
                KD: {p.available}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => onView(p.id)}
              >
                <Eye className="size-3.5" />
                Xem
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onEdit(p.id)}
              >
                <SquarePen className="size-3.5" />
                Sửa
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
