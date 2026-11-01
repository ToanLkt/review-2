"use client";
import { useState } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  Grid2X2,
  Sprout,
  CheckCircle2,
  Wrench,
  X,
} from "lucide-react";
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
import { Pagination } from "@/components/dashboard/shared";
import { Choice, SummaryCards, PhysicalStatus, EmptyState } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { useTrayActions } from "./operations-dialogs";
import { TrayActionMenu } from "./tray-action-menu";
import { trayStatuses } from "@/lib/operations/types";
import {
  locationOf,
  currentAssignment,
  currentCycle,
  normalize,
} from "@/lib/operations/selectors";
import { date } from "@/lib/formatters";
export function TrayTable({ onCreate }: { onCreate?: () => void }) {
  const { state } = useOperations();
  const { openAction } = useTrayActions();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [shelf, setShelf] = useState("");
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState("code");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const rows = state.trays.map((t) => {
    const loc = locationOf(state, t),
      assignment = currentAssignment(state, t.id),
      cycle = currentCycle(state, t.id);
    return {
      tray: t,
      loc,
      code: t.code,
      location: loc.label,
      customer: assignment?.customer ?? "",
      order: assignment?.orderId ?? "",
      seed:
        cycle?.seed ??
        (assignment
          ? (state.items.find((i) => i.id === assignment.itemId)?.seed ?? "")
          : ""),
      cycle: cycle?.id ?? "",
      sowed: cycle?.sowed ?? "",
      harvest: cycle?.harvest ?? "",
      status: t.status,
      stage: cycle?.stage ?? "",
    };
  });
  const filtered = rows
    .filter(
      (r) =>
        (!area ||
          (area === "unassigned"
            ? !r.loc.position
            : r.loc.area?.id === area)) &&
        (!shelf || r.loc.shelf?.id === shelf) &&
        (!status || r.status === status) &&
        (!stage || r.stage === stage) &&
        normalize(r.code + " " + r.customer + " " + r.order).includes(
          normalize(query),
        ),
    )
    .sort(
      (a, b) =>
        String(a[sort as keyof typeof a] ?? "").localeCompare(
          String(b[sort as keyof typeof b] ?? ""),
          "vi",
        ) * (asc ? 1 : -1),
    );
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / Number(size))),
  );
  const active = !!(query || area || shelf || status || stage);
  const reset = () => {
    setQuery("");
    setArea("");
    setShelf("");
    setStatus("");
    setStage("");
    setPage(1);
  };
  const columns = [
    ["code", "Mã khay"],
    ["location", "Vị trí"],
    ["customer", "Khách hàng"],
    ["seed", "Loại rau"],
    ["cycle", "Chu kỳ trồng"],
    ["sowed", "Ngày gieo"],
    ["harvest", "Dự kiến thu hoạch"],
    ["status", "Trạng thái khay"],
    ["stage", "Giai đoạn cây"],
  ];
  return (
    <div className="space-y-5">
      <SummaryCards
        catalogStyle
        label="Toàn nông trại · không thay đổi theo bộ lọc bảng"
        items={[
          {
            label: "Tổng khay",
            detail: "Toàn nông trại",
            value: state.trays.length,
            icon: <Grid2X2 className="size-4" />,
          },
          {
            label: "Sẵn sàng",
            detail: "Có thể phân bổ đơn thuê",
            color: "text-primary",
            value: state.trays.filter((t) => t.status === "Sẵn sàng").length,
            icon: <CheckCircle2 className="size-4" />,
          },
          {
            label: "Đang trồng",
            detail: "Đang có chu kỳ trồng",
            color: "text-primary",
            value: state.trays.filter((t) => t.status === "Đang trồng").length,
            icon: <Sprout className="size-4" />,
          },
          {
            label: "Chờ vệ sinh / Bảo trì",
            detail: "Cần xử lý trước khi sử dụng",
            color: "text-amber-600",
            value:
              state.trays.filter((t) => t.status === "Chờ vệ sinh").length +
              " / " +
              state.trays.filter((t) => t.status === "Bảo trì").length,
            icon: <Wrench className="size-4" />,
          },
        ]}
      />
      <div className="section-card min-w-0 overflow-hidden">
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">
              Danh sách khay{" "}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {filtered.length} kết quả
              </span>
            </h2>
            {onCreate && (
              <Button onClick={onCreate} className="ml-auto h-9 text-xs">
                <Plus className="size-4" />
                Thêm khay
              </Button>
            )}
            <div className="relative w-full sm:w-80">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Tìm mã khay, khách hàng, mã đơn"
                placeholder="Tìm mã khay, khách hàng, mã đơn..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            {[
              {
                label: "Lọc khu vực",
                value: area,
                change: (v: string) => {
                  setArea(v);
                  setShelf("");
                },
                options: [
                  { value: "", label: "Tất cả khu vực" },
                  { value: "unassigned", label: "Chưa bố trí" },
                  ...state.areas.map((a) => ({ value: a.id, label: a.name })),
                ],
              },
              {
                label: "Lọc kệ",
                value: shelf,
                change: setShelf,
                options: [
                  { value: "", label: "Tất cả kệ" },
                  ...(
                    state.areas.find((a) => a.id === area)?.shelves ?? []
                  ).map((s) => ({ value: s.id, label: s.name })),
                ],
                disabled: !area || area === "unassigned",
              },
              {
                label: "Lọc trạng thái khay",
                value: status,
                change: setStatus,
                options: [
                  { value: "", label: "Tất cả trạng thái" },
                  ...trayStatuses.map((s) => ({ value: s, label: s })),
                ],
              },
              {
                label: "Lọc giai đoạn cây",
                value: stage,
                change: setStage,
                options: [
                  { value: "", label: "Tất cả giai đoạn" },
                  ...["Ươm mầm", "Đang phát triển", "Sẵn sàng thu hoạch"].map(
                    (s) => ({ value: s, label: s }),
                  ),
                ],
              },
            ].map((f) => (
              <div key={f.label} className="min-w-0 lg:w-44">
                <Choice
                  label={f.label}
                  value={f.value}
                  onChange={(v) => {
                    f.change(v);
                    setPage(1);
                  }}
                  options={f.options}
                  disabled={f.disabled}
                />
              </div>
            ))}
            {active && (
              <Button variant="ghost" className="h-9 text-xs" onClick={reset}>
                <X className="size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(([key, label]) => (
                <TableHead
                  key={key}
                  aria-sort={
                    sort === key ? (asc ? "ascending" : "descending") : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setSort(key);
                      setAsc(sort === key ? !asc : true);
                      setPage(1);
                    }}
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    {label}
                    <ArrowUpDown className="size-3 opacity-50" />
                  </button>
                </TableHead>
              ))}
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered
              .slice((current - 1) * Number(size), current * Number(size))
              .map((r) => (
                <TableRow key={r.tray.id}>
                  <TableCell>
                    <button
                      className="whitespace-nowrap font-semibold text-primary hover:underline"
                      onClick={() => openAction("detail", r.tray.id)}
                    >
                      {r.code}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="block min-w-32">
                      {r.loc.area?.name ?? "Chưa bố trí"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {r.loc.shelf
                        ? r.loc.shelf.name +
                          " · Tầng " +
                          r.loc.position?.level +
                          " · VT " +
                          r.loc.position?.slot
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.customer || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.seed || "—"}
                  </TableCell>
                  <TableCell>{r.cycle || "—"}</TableCell>
                  <TableCell>{r.sowed ? date(r.sowed) : "—"}</TableCell>
                  <TableCell>{r.harvest ? date(r.harvest) : "—"}</TableCell>
                  <TableCell>
                    <PhysicalStatus status={r.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {r.stage || "—"}
                  </TableCell>
                  <TableCell>
                    <TrayActionMenu tray={r.tray} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <EmptyState
            title={
              state.trays.length ? "Không tìm thấy khay" : "Chưa có khay trồng"
            }
            description="Thử thay đổi bộ lọc hoặc thêm khay vật lý mới."
            action={
              active && (
                <Button variant="outline" onClick={reset}>
                  Xóa bộ lọc
                </Button>
              )
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between border-t">
          <div className="flex items-center gap-2 px-5 py-2 text-xs text-muted-foreground">
            <span>Số dòng</span>
            <div className="w-20">
              <Choice
                label="Số dòng mỗi trang"
                value={size}
                onChange={(v) => {
                  setSize(v);
                  setPage(1);
                }}
                options={["10", "20", "50"].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </div>
          </div>
          <Pagination
            page={current}
            size={Number(size)}
            total={filtered.length}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
