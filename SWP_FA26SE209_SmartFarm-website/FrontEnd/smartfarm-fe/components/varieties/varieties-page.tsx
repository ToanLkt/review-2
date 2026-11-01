"use client";
import { useRef, useState } from "react";
import { SummaryCard } from "@/components/admin/summary-card";
import { Plus, Search, Sprout, Clock, Eye, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useVarieties } from "./varieties-provider";
import { VarietyPanel } from "./variety-form";
import { DisableVarietyDialog } from "./disable-dialog";
import { catalogSummary, filterVarieties } from "@/lib/varieties";
const greens = ["bg-[#E8F3EB]", "bg-[#EDF5EA]", "bg-[#E6F1E9]", "bg-[#EFF6EB]"];
export function VarietiesPage() {
  const { catalog, setEnabled, loading, error, reload } = useVarieties();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [panel, setPanel] = useState<{
    mode: "create" | "view" | "edit";
    id?: string;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const createButton = useRef<HTMLButtonElement | null>(null);
  function openPanel(
    button: HTMLButtonElement,
    mode: "create" | "view" | "edit",
    id?: string,
  ) {
    trigger.current = button;
    setPanel({ mode, id });
  }
  const [disable, setDisable] = useState<string | null>(null);
  const summary = catalogSummary(catalog);
  const visible = filterVarieties(catalog, query, status);
  const cards = [
    {
      value: summary.total,
      label: "Tổng số giống",
      support: "Trong danh mục",
      color: "text-[#88A893]",
    },
    {
      value: summary.enabled,
      label: "Cho phép chọn khi thuê",
      support: "Hiển thị cho đơn mới",
      color: "text-primary",
    },
    {
      value: summary.disabled,
      label: "Đang tắt chọn",
      support: "Ẩn khỏi đơn mới",
      color: "text-amber-600",
    },
    {
      value:
        new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
          summary.average,
        ) + " ngày",
      label: "Thời gian sinh trưởng TB",
      support: "Tham khảo",
      color: "text-blue-500",
    },
  ];
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">Giống rau</h1>
            <p className="mt-2 max-w-4xl text-base leading-relaxed text-muted-foreground">
              Danh mục giống rau tham khảo. Không quản lý nhập/xuất tồn kho hạt
              giống tại đây.
            </p>
          </div>
          <Button
            ref={createButton}
            onClick={(event) => openPanel(event.currentTarget, "create")}
            className="h-10 rounded-xl px-4"
          >
            <Plus className="size-4" />
            Thêm giống rau
          </Button>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <Button variant="outline" size="sm" onClick={() => void reload()}>Thử lại</Button></div>}
        {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải giống rau...</p>}
        <section
          aria-label="Tổng hợp toàn danh mục"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((c) => (
            <SummaryCard key={c.label} {...c} />
          ))}
        </section>
        <section
          aria-label="Danh mục giống rau"
          className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3004]"
        >
          <div className="flex flex-wrap gap-3 p-5 lg:p-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute top-3 left-3.5 size-4 text-[#8BAA97]" />
              <Input
                aria-label="Tìm giống rau"
                placeholder="Tìm giống rau..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 rounded-xl pl-10 text-sm shadow-none"
              />
            </div>
            <Select
              value={status || "all"}
              onValueChange={(v) => setStatus(v === "all" ? "" : v)}
            >
              <SelectTrigger
                aria-label="Trạng thái giống rau"
                className="h-10 w-full rounded-xl shadow-none sm:w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="enabled">Cho phép</SelectItem>
                <SelectItem value="disabled">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table className="min-w-[1050px] table-fixed">
            <colgroup>
              {[18, 9, 26, 15, 19, 13].map((width, index) => (
                <col key={index} style={{ width: width + "%" }} />
              ))}
            </colgroup>
            <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#809E8A] [&_th]:whitespace-normal">
              <TableRow>
                {[
                  "GIỐNG RAU",
                  "MÃ GIỐNG",
                  "MÔ TẢ",
                  "TG SINH TRƯỞNG (THAM KHẢO)",
                  "CHO PHÉP CHỌN KHI THUÊ MỚI",
                  "THAO TÁC",
                ].map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((v, i) => (
                <TableRow
                  key={v.id}
                  className="hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          "flex size-10 shrink-0 items-center justify-center rounded-xl text-primary " +
                          greens[i % greens.length]
                        }
                      >
                        <Sprout className="size-4.5" strokeWidth={1.7} />
                      </span>
                      <span className="break-words text-sm font-semibold">
                        {v.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.code}
                  </TableCell>
                  <TableCell className="text-xs leading-5 text-muted-foreground">
                    {v.description || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-xs">
                      <Clock className="size-4 shrink-0 text-[#8BAA97]" />
                      <strong className="font-semibold">
                        {v.referenceGrowthDays}
                      </strong>
                      <span>ngày</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        aria-label={"Cho phép chọn khi thuê mới: " + v.name}
                        checked={v.enabledForNewRentals}
                        onCheckedChange={(enabled) =>
                          enabled ? void setEnabled(v.id, true) : setDisable(v.id)
                        }
                      />
                      <Badge
                        variant="outline"
                        className={
                          v.enabledForNewRentals
                            ? "border-0 bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary"
                            : "border-0 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {v.enabledForNewRentals ? "Cho phép" : "Đã tắt"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={"Xem " + v.name}
                        onClick={(event) =>
                          openPanel(event.currentTarget, "view", v.id)
                        }
                        className="h-8 gap-1.5 px-1.5 text-xs text-primary"
                      >
                        <Eye className="size-3.5" />
                        Xem
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={"Sửa " + v.name}
                        onClick={(event) =>
                          openPanel(event.currentTarget, "edit", v.id)
                        }
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
          {!loading && !error && !visible.length && (
            <div className="space-y-3 px-5 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Không tìm thấy giống rau phù hợp
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </section>
      </div>
      {panel && (
        <VarietyPanel
          initialMode={panel.mode}
          variety={catalog.find((v) => v.id === panel.id)}
          onClose={() => setPanel(null)}
          returnFocus={() => {
            const target = trigger.current?.isConnected
              ? trigger.current
              : createButton.current;
            target?.focus();
          }}
        />
      )}
      <DisableVarietyDialog
        open={!!disable}
        onCancel={() => setDisable(null)}
        onConfirm={() => {
          if (disable) void setEnabled(disable, false);
          setDisable(null);
        }}
      />
    </main>
  );
}
