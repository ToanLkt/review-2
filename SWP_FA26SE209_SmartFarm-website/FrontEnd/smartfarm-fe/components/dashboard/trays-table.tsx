"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ArrowRight, ImageOff, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { FilterSelect, Status, Pagination, DetailField } from "./shared";
import { devices } from "@/lib/mock-data";
import { date, number, stamp } from "@/lib/formatters";
import type { Tray } from "@/lib/types";
export function TraysTable({
  trays,
  query,
  setQuery,
  stage,
  setStage,
}: {
  trays: Tray[];
  query: string;
  setQuery: (s: string) => void;
  stage: string;
  setStage: (s: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<keyof Tray>("id");
  const [ascending, setAscending] = useState(true);
  const [selected, setSelected] = useState<Tray | null>(null);
  const sorted = [...trays].sort(
    (a, b) =>
      String(a[sort]).localeCompare(String(b[sort]), "vi") *
      (ascending ? 1 : -1),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(sorted.length / 5)));
  const device = selected
    ? devices.find((d) => d.area === selected.area)
    : undefined;
  function changeSort(key: keyof Tray) {
    setAscending(sort === key ? !ascending : true);
    setSort(key);
  }
  return (
    <>
      <Card className="section-card min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="section-title">
              Khay đang theo dõi{" "}
              <span className="ml-2 rounded-md bg-secondary px-2 py-1 text-[10px] text-primary">
                {trays.length}
              </span>
            </h2>
            <p className="subtle mt-1">
              Tiến độ sinh trưởng và tình trạng khay
            </p>
          </div>
          <Button asChild variant="ghost" className="h-8 text-xs text-primary">
            <Link href="/admin/trays">
              Xem tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 px-5 pb-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
            <Input
              aria-label="Tìm khay hoặc khách hàng"
              placeholder="Tìm mã khay, tên khách hàng..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9 text-xs"
            />
          </div>
          <FilterSelect
            label="Giai đoạn sinh trưởng"
            value={stage}
            onChange={(v) => {
              setStage(v);
              setPage(1);
            }}
            options={[
              "Tất cả giai đoạn",
              "Ươm mầm",
              "Đang phát triển",
              "Sẵn sàng thu hoạch",
            ]}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {(
                [
                  ["id", "Mã khay"],
                  ["customer", "Khách hàng"],
                  ["seed", "Loại rau"],
                  ["area", "Khu vực"],
                  ["sowed", "Ngày gieo"],
                  ["harvest", "Dự kiến thu hoạch"],
                  ["stage", "Giai đoạn"],
                  ["health", "Tình trạng"],
                ] as [keyof Tray, string][]
              ).map(([key, label]) => (
                <TableHead
                  key={key}
                  aria-sort={
                    sort === key
                      ? ascending
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    className="flex items-center gap-1 whitespace-nowrap"
                    onClick={() => changeSort(key)}
                  >
                    {label}
                    <ArrowUpDown className="size-3 opacity-40" />
                  </button>
                </TableHead>
              ))}
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.slice((current - 1) * 5, current * 5).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-semibold text-primary">
                  {t.id}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {t.customer}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Leaf className="size-3.5 text-primary/70" />
                    {t.seed}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{t.area}</TableCell>
                <TableCell>{date(t.sowed)}</TableCell>
                <TableCell>{date(t.harvest)}</TableCell>
                <TableCell>
                  <Status>{t.stage}</Status>
                </TableCell>
                <TableCell>
                  <Status>{t.health}</Status>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-primary"
                    aria-label={`Chi tiết khay ${t.id}`}
                    onClick={() => setSelected(t)}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!sorted.length && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-28 text-center text-muted-foreground"
                >
                  Không có khay phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          page={current}
          total={sorted.length}
          size={5}
          onChange={setPage}
        />
      </Card>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Khay {selected?.id}</SheetTitle>
            <SheetDescription>
              Hồ sơ canh tác và nhật ký chăm sóc
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="px-6 pb-8">
              <dl>
                <DetailField label="Khách hàng">
                  {selected.customer}
                </DetailField>
                <DetailField label="Đơn thuê khay liên kết">
                  <Link className="text-primary underline" href="/admin/orders">
                    {selected.orderId}
                  </Link>
                </DetailField>
                <DetailField label="Loại hạt giống và chu kỳ">
                  {selected.seed} · {selected.cycle}
                </DetailField>
                <DetailField label="Khu vực">{selected.area}</DetailField>
                <DetailField label="Ngày gieo / Dự kiến thu hoạch">
                  {date(selected.sowed)} → {date(selected.harvest)}
                </DetailField>
                <DetailField label="Giai đoạn">
                  <Status>{selected.stage}</Status>
                </DetailField>
                <DetailField label="Tình trạng">
                  <Status>{selected.health}</Status>
                </DetailField>
              </dl>
              {device && (
                <div className="mt-5 rounded-xl bg-muted p-4">
                  <p className="text-xs font-semibold">
                    Số đo gần nhất · {device.id}
                  </p>
                  <p className="mt-2 text-sm">
                    {number(device.temperature)}°C · {device.humidity}% ·{" "}
                    {number(device.light)} lux
                  </p>
                  <p className="subtle mt-2">
                    {stamp(device.received)}
                    {!device.online ? " · Dữ liệu cũ" : ""}
                  </p>
                </div>
              )}
              <div className="mt-5 flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted">
                <ImageOff className="size-7 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Chưa có ảnh khay
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Thời điểm chụp: chưa có
                </p>
              </div>
              <h3 className="mt-6 mb-3 font-semibold">
                Nhật ký chăm sóc gần đây
              </h3>
              <p className="border-l-2 border-primary/30 py-2 pl-4 text-xs">
                08:00 · 15/09/2026
                <br />
                <span className="text-muted-foreground">
                  Kiểm tra khay và ghi nhận số đo môi trường · Minh Anh
                </span>
              </p>
              <p className="border-l-2 border-primary/30 py-2 pl-4 text-xs">
                Ngày {date(selected.sowed)}
                <br />
                <span className="text-muted-foreground">
                  Gieo hạt và khởi tạo chu kỳ {selected.cycle}
                </span>
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
