"use client";
import { SquarePen, Warehouse } from "lucide-react";
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
import { stockStatus, fmtQty, type Material } from "@/lib/inventory";

const statusClass: Record<string, string> = {
  "Đủ dùng": "status-green",
  "Sắp hết": "status-amber",
  "Hết hàng": "status-red",
};

export function InventoryTable({
  materials,
  onUpdate,
  onReset,
  hasData,
}: {
  materials: Material[];
  onUpdate: (id: string) => void;
  onReset: () => void;
  hasData: boolean;
}) {
  if (!materials.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="rounded-2xl bg-secondary p-4">
          <Warehouse className="size-7 text-primary" />
        </span>
        <h3 className="font-semibold">
          {hasData
            ? "Không tìm thấy vật tư phù hợp"
            : "Chưa có vật tư trong kho"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasData
            ? "Thử thay đổi từ khóa hoặc bộ lọc."
            : "Nhập kho vật tư đầu tiên để bắt đầu."}
        </p>
        {hasData && (
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
            {[9, 16, 10, 10, 9, 10, 12, 12, 12].map((w, i) => (
              <col key={i} style={{ width: w + "%" }} />
            ))}
          </colgroup>
          <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#809E8A]">
            <TableRow>
              {[
                "MÃ VẬT TƯ",
                "TÊN VẬT TƯ",
                "NHÓM",
                "TỒN KHO",
                "ĐÃ GIỮ",
                "KHẢ DỤNG",
                "NGƯỠNG TỐI THIỂU",
                "TRẠNG THÁI",
                "THAO TÁC",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => {
              const status = stockStatus(m);
              const belowThreshold = m.available <= m.minThreshold;
              return (
                <TableRow
                  key={m.id}
                  className="hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
                >
                  <TableCell className="text-xs font-semibold text-primary">
                    {m.code}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {m.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.group}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {fmtQty(m.stock)} {m.unit}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-blue-600">
                    {fmtQty(m.reserved)} {m.unit}
                  </TableCell>
                  <TableCell
                    className={
                      "text-xs font-semibold tabular-nums " +
                      (belowThreshold && m.available > 0
                        ? "text-amber-600"
                        : m.available <= 0
                          ? "text-red-600"
                          : "")
                    }
                  >
                    {fmtQty(m.available)} {m.unit}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {fmtQty(m.minThreshold)} {m.unit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        "px-2.5 py-1 text-[11px] font-medium " +
                        (statusClass[status] ?? "")
                      }
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={"Cập nhật " + m.name}
                      onClick={() => onUpdate(m.id)}
                      className="h-8 gap-1.5 px-1.5 text-xs text-muted-foreground"
                    >
                      <SquarePen className="size-3.5" />
                      Cập nhật
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 bg-[#F7FAF8] p-4 md:hidden">
        {materials.map((m) => {
          const status = stockStatus(m);
          const belowThreshold = m.available <= m.minThreshold;
          return (
            <article
              key={m.id}
              className="space-y-3 rounded-2xl border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-primary">
                    {m.code}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{m.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.group}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    "shrink-0 px-2.5 py-1 text-[11px] font-medium " +
                    (statusClass[status] ?? "")
                  }
                >
                  {status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span>
                  Tồn: {fmtQty(m.stock)} {m.unit}
                </span>
                <span className="text-blue-600">
                  Giữ: {fmtQty(m.reserved)} {m.unit}
                </span>
                <span
                  className={
                    belowThreshold && m.available > 0
                      ? "font-semibold text-amber-600"
                      : m.available <= 0
                        ? "font-semibold text-red-600"
                        : ""
                  }
                >
                  KD: {fmtQty(m.available)} {m.unit}
                </span>
              </div>
              <div className="flex justify-end border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => onUpdate(m.id)}
                >
                  <SquarePen className="size-3.5" />
                  Cập nhật
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
