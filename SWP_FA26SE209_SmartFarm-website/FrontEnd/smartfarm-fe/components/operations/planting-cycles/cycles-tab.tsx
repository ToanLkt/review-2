"use client";
import { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Choice, EmptyState } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { useVarieties } from "@/components/varieties/varieties-provider";
import { VarietyPanel } from "@/components/varieties/variety-form";
import { TrayDetailSheet } from "../trays/tray-detail-sheet";
import { CycleSheet, type CyclePanelMode } from "./cycle-sheet";
import { CycleStatus } from "./cycle-status";
import { OrderBadge } from "@/components/orders/order-ui";
import { cycleStages } from "@/lib/operations/types";
import { cycleLocation, lifecycleOf } from "@/lib/operations/cycles";
import { normalize } from "@/lib/operations/selectors";
import { date, money } from "@/lib/formatters";
import { useOperationsRoutes } from "../shared/operations-routes";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { toast } from "sonner";

export function CyclesTab() {
  const { state, orders, reload } = useOperations();
  const { catalog } = useVarieties();
  const params = useSearchParams();
  const router = useRouter();
  const routes = useOperationsRoutes();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(1);
  const [pendingCycleAction, setPendingCycleAction] = useState<string | null>(null);
  const [panel, setPanel] = useState<{
    mode: CyclePanelMode;
    id?: string;
  } | null>(() =>
    params.get("cycle")
      ? { mode: "view", id: params.get("cycle")! }
      : !routes.readOnly && params.get("action") === "create"
        ? { mode: "create" }
        : null,
  );
  const [related, setRelated] = useState<"tray" | "variety" | "order" | null>(
    null,
  );
  const trigger = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const selected = state.cycles.find((c) => c.id === panel?.id);
  const selectedTray = state.trays.find((t) => t.id === selected?.trayId);
  const assignment = state.assignments.find(
    (a) => a.id === selected?.assignmentId,
  );
  const order = orders.find(
    (o) => o.id === assignment?.orderId && o.kind === "rental",
  );
  const variety = catalog.find(
    (v) =>
      v.id === selected?.varietyId ||
      normalize(v.name) === normalize(selected?.seed ?? ""),
  );
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const todayTime = Date.parse(today);
  const filtered = state.cycles.filter((c) => {
    const loc = cycleLocation(state, c);
    return (
      (!area || loc.areaId === area) &&
      (!stage || lifecycleOf(c) === stage) &&
      normalize(`${c.id} ${c.seed} ${loc.tray}`).includes(normalize(query))
    );
  }).sort((a, b) =>
    Math.abs(Date.parse(a.sowed) - todayTime) -
      Math.abs(Date.parse(b.sowed) - todayTime) ||
    b.sowed.localeCompare(a.sowed) ||
    a.id.localeCompare(b.id),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 5, current * 5);
  function open(mode: CyclePanelMode, id?: string) {
    if (routes.readOnly && mode !== "view") return;
    trigger.current = document.activeElement as HTMLElement;
    setPanel({ mode, id });
  }
  function returnFocus() {
    (trigger.current?.isConnected
      ? trigger.current
      : addButton.current
    )?.focus();
  }
  function close() {
    setPanel(null);
    setRelated(null);
    if (params.has("cycle") || params.has("action")) {
      const next = new URLSearchParams(params.toString());
      next.delete("cycle");
      next.delete("action");
      next.delete("tray");
      router.replace(routes.trays + "?" + next, { scroll: false });
    }
  }
  async function cycleAction(id: string, kind: "next" | "tasks") {
    if (pendingCycleAction) return;
    setPendingCycleAction(id);
    try {
      if (kind === "next") {
        await staffCultivationService.nextCycle(Number(id));
        toast.success("Đã bắt đầu chu kỳ gieo tiếp theo.");
      } else {
        const result = await staffCultivationService.generateTasks(Number(id));
        toast.success(`Đã tạo ${result.created} công việc chăm sóc.`);
      }
      await reload();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật chu kỳ.");
    } finally { setPendingCycleAction(null); }
  }
  const reset = () => {
    setQuery("");
    setArea("");
    setStage("");
    setPage(1);
  };
  return (
    <>
      <section
        aria-label="Danh sách chu kỳ trồng"
        className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3004]"
      >
        <div className="flex flex-wrap items-center gap-3 p-5 lg:p-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Tìm chu kỳ, giống rau, mã khay"
              placeholder="Tìm chu kỳ, giống rau, mã khay..."
              className="h-9 pl-9 text-xs"
            />
          </div>
          <div className="w-40">
            <Choice
              label="Lọc khu vực chu kỳ"
              value={area}
              onChange={(v) => {
                setArea(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả khu vực" },
                ...state.areas.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
          <div className="w-44">
            <Choice
              label="Lọc giai đoạn chu kỳ"
              value={stage}
              onChange={(v) => {
                setStage(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả giai đoạn" },
                ...cycleStages.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
          {!routes.readOnly && (
            <Button
              ref={addButton}
              className="ml-auto h-9"
              onClick={() => open("create")}
            >
              <Plus className="size-4" />
              Tạo chu kỳ
            </Button>
          )}
        </div>
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              {[
                "Mã chu kỳ",
                "Giống rau",
                "Khay",
                "Vị trí",
                "Đơn thuê",
                "Khách thuê",
                "Ngày gieo",
                "Thu hoạch dự kiến",
                "Giai đoạn",
                "Thao tác",
              ].map((h) => (
                <TableHead
                  key={h}
                  className="whitespace-nowrap text-[10px] uppercase"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((c) => {
              const loc = cycleLocation(state, c);
              const assigned = state.assignments.find(
                (a) => a.id === c.assignmentId,
              );
              const lifecycle = lifecycleOf(c);
              return (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-secondary/30"
                  onClick={() => open("view", c.id)}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="rounded font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        open("view", c.id);
                      }}
                    >
                      {c.id}
                    </button>
                  </TableCell>
                  <TableCell className="min-w-36 font-medium">
                    {c.seed}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {loc.tray}
                  </TableCell>
                  <TableCell className="min-w-32">
                    {loc.area} · {loc.shelf}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {assigned?.orderCode || assigned?.orderId || "—"}
                  </TableCell>
                  <TableCell className="min-w-40">
                    {assigned?.customer ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {date(c.sowed)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {date(c.harvest)}
                  </TableCell>
                  <TableCell>
                    <CycleStatus stage={lifecycle} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={"Thao tác chu kỳ " + c.id}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => open("view", c.id)}>
                          Xem chi tiết
                        </DropdownMenuItem>
                        {!routes.readOnly && c.hasNextCycle && lifecycle === "Đã thu hoạch" && <DropdownMenuItem disabled={pendingCycleAction !== null} onSelect={() => void cycleAction(c.id, "next")}>Bắt đầu chu kỳ tiếp theo</DropdownMenuItem>}
                        {!routes.readOnly && c.active && <DropdownMenuItem disabled={pendingCycleAction !== null} onSelect={() => void cycleAction(c.id, "tasks")}>Tạo công việc chăm sóc</DropdownMenuItem>}
                        {!routes.readOnly && c.active && (
                          <>
                            {lifecycle !== "Sẵn sàng thu hoạch" && (
                              <DropdownMenuItem
                                onSelect={() => open("stage", c.id)}
                              >
                                Cập nhật giai đoạn
                              </DropdownMenuItem>
                            )}
                            {lifecycle === "Sẵn sàng thu hoạch" && (
                              <DropdownMenuItem
                                onSelect={() => open("harvest", c.id)}
                              >
                                Ghi nhận thu hoạch
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => open("cancel", c.id)}
                            >
                              Hủy chu kỳ
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!visible.length && (
          <EmptyState
            title="Không tìm thấy chu kỳ phù hợp"
            description="Thử tìm theo mã chu kỳ, giống rau hoặc mã khay."
            action={
              <Button variant="outline" onClick={reset}>
                Xóa bộ lọc
              </Button>
            }
          />
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
          <p>
            Hiển thị {filtered.length ? (current - 1) * 5 + 1 : 0} –{" "}
            {Math.min(current * 5, filtered.length)} trong {filtered.length} kết
            quả
          </p>
          <nav
            aria-label="Phân trang chu kỳ"
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Trang trước"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter(
                (n) => n === 1 || n === pages || Math.abs(n - current) <= 1,
              )
              .map((n, i, arr) => (
                <span key={n} className="flex items-center">
                  {i > 0 && n - arr[i - 1] > 1 && (
                    <span className="px-1">…</span>
                  )}
                  <Button
                    aria-label={"Trang " + n}
                    aria-current={n === current ? "page" : undefined}
                    variant={n === current ? "default" : "ghost"}
                    className="size-8 rounded-lg"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                </span>
              ))}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Trang sau"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </nav>
        </footer>
      </section>
      {panel && !related && (panel.mode === "create" || selected) && (
        <CycleSheet
          key={panel.mode + panel.id}
          mode={panel.mode}
          cycle={selected}
          initialTray={params.get("tray") ?? undefined}
          onClose={close}
          returnFocus={returnFocus}
          onRelated={setRelated}
        />
      )}
      {panel?.id && !selected && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Không tìm thấy chu kỳ được yêu cầu.{" "}
          <button className="text-primary underline" onClick={close}>
            Đóng
          </button>
        </p>
      )}
      {related === "tray" && selectedTray && (
        <TrayDetailSheet tray={selectedTray} onClose={() => setRelated(null)} />
      )}
      {related === "variety" && variety && (
        <VarietyPanel
          initialMode="view"
          variety={variety}
          onClose={() => setRelated(null)}
          returnFocus={() => {}}
        />
      )}
      {related === "variety" && !variety && (
        <Sheet open onOpenChange={(v) => !v && setRelated(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{selected?.seed}</SheetTitle>
              <SheetDescription>
                Giống rau được lưu trên hồ sơ chu kỳ.
              </SheetDescription>
            </SheetHeader>
            <p className="px-6 text-sm">
              Giống này không còn trong danh mục lựa chọn hiện tại.
            </p>
            <Button className="mx-6" onClick={() => setRelated(null)}>
              Về chu kỳ
            </Button>
          </SheetContent>
        </Sheet>
      )}
      {related === "order" && order && (
        <Sheet open onOpenChange={(v) => !v && setRelated(null)}>
          <SheetContent className="h-dvh max-w-[500px]! gap-0 overflow-hidden! bg-white">
            <SheetHeader className="shrink-0 border-b bg-[#F3F8F4] px-6 py-6 pr-12">
              <SheetTitle className="text-xl font-bold tracking-tight text-[#173B29]">
                Chi tiết đơn thuê
              </SheetTitle>
              <SheetDescription className="sr-only">
                Thông tin đơn hàng {assignment?.orderCode || "—"}
              </SheetDescription>
            </SheetHeader>
            <dl className="min-h-0 flex-1 divide-y overflow-y-auto px-6 text-sm">
              {[
                ["Mã đơn hàng", assignment?.orderCode || "—"],
                ["Khách thuê", order.customer],
                ["Tổng tiền", money(order.total)],
                ["Thanh toán", order.payment],
                ["Trạng thái", order.status],
                ["Ngày tạo", date(order.created)],
              ].map(([label, value], index) => (
                <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={`break-words font-medium ${index === 0 ? "font-semibold text-primary" : ""}`}>
                    {label === "Thanh toán" || label === "Trạng thái" ? (
                      <OrderBadge>{value}</OrderBadge>
                    ) : value}
                  </dd>
                </div>
              ))}
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-4">
                <dt className="text-muted-foreground">Khay đã phân bổ</dt>
                <dd className="break-words font-medium">
                  {state.assignments
                    .filter((a) => a.orderId === order.id)
                    .map(
                      (a) => state.trays.find((t) => t.id === a.trayId)?.code,
                    )
                    .join(", ") || "—"}
                </dd>
              </div>
            </dl>
            <Button
              variant="outline"
              className="mx-6 mb-6 mt-4 shrink-0 self-start"
              onClick={() => setRelated(null)}
            >
              Về chu kỳ trồng
            </Button>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
