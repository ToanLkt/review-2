"use client";
import { Warehouse } from "lucide-react";
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
import { date as fmtDate } from "@/lib/formatters";
import { fmtQty, type Transaction } from "@/lib/inventory";

const typeClass: Record<string, string> = {
  "Nhập kho": "status-green",
  "Xuất dùng": "status-amber",
  "Bán lẻ":
    "border-0 bg-blue-50 text-blue-700",
};

export function HistoryTable({
  transactions,
  onReset,
  hasData,
}: {
  transactions: Transaction[];
  onReset: () => void;
  hasData: boolean;
}) {
  if (!transactions.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="rounded-2xl bg-secondary p-4">
          <Warehouse className="size-7 text-primary" />
        </span>
        <h3 className="font-semibold">
          {hasData
            ? "Không tìm thấy giao dịch phù hợp"
            : "Chưa có lịch sử nhập xuất"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasData
            ? "Thử thay đổi từ khóa hoặc bộ lọc."
            : "Các giao dịch nhập xuất kho sẽ hiển thị tại đây."}
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
        <Table className="min-w-[1000px] table-fixed">
          <colgroup>
            {[11, 10, 14, 18, 10, 22, 15].map((w, i) => (
              <col key={i} style={{ width: w + "%" }} />
            ))}
          </colgroup>
          <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#809E8A]">
            <TableRow>
              {[
                "NGÀY",
                "MÃ PHIẾU",
                "LOẠI",
                "VẬT TƯ",
                "SỐ LƯỢNG",
                "NGUỒN / LÝ DO / ĐƠN LIÊN QUAN",
                "NGƯỜI THỰC HIỆN",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow
                key={t.id}
                className="hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
              >
                <TableCell className="text-xs">
                  {fmtDate(t.date)}
                </TableCell>
                <TableCell className="text-xs font-semibold text-primary">
                  {t.code}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      "px-2.5 py-1 text-[11px] font-medium " +
                      (typeClass[t.type] ?? "")
                    }
                  >
                    {t.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {t.materialName}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {t.quantity > 0 ? "+" : ""}
                  {fmtQty(t.quantity)} {t.unit}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.reason}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.performer}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 bg-[#F7FAF8] p-4 md:hidden">
        {transactions.map((t) => (
          <article
            key={t.id}
            className="space-y-3 rounded-2xl border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-primary">{t.code}</p>
                <p className="mt-1 text-sm font-medium">{t.materialName}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  "shrink-0 px-2.5 py-1 text-[11px] font-medium " +
                  (typeClass[t.type] ?? "")
                }
              >
                {t.type}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>{fmtDate(t.date)}</span>
              <span className="font-medium text-foreground">
                {t.quantity > 0 ? "+" : ""}
                {fmtQty(t.quantity)} {t.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t.reason}</p>
            {t.performer !== "—" && (
              <p className="text-xs text-muted-foreground">
                {t.performer}
              </p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
