"use client";

import { TableSkeleton } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, History, PackageSearch, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LocalDatePicker } from "@/components/ui/local-date-picker";
import { dateTime } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { staffInventoryService } from "@/lib/api/staff/staff-inventory-instance";
import {
  MOVEMENT_TYPES, SUPPLY_TYPES, type InventoryBalance, type InventoryReconciliation,
  type MaterialMovement, type MovementType, type PagedResult, type SupplyType,
} from "@/lib/api/staff/staff-inventory-service";

const emptyInventory: PagedResult<InventoryBalance> = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
const emptyMovements: PagedResult<MaterialMovement> = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };

const supplyTypeLabels: Record<SupplyType, string> = {
  SEED: "Hạt giống", SOIL_SUBSTRATE: "Giá thể", PACKAGING: "Bao bì", EQUIPMENT: "Thiết bị",
};
const movementLabels: Record<MovementType, string> = {
  RECEIPT: "Nhập kho", MANUAL_USAGE: "Sử dụng", SALE: "Xuất bán",
};

type View = "balances" | "movements" | "reconciliation";
type Adjustment = "receipt" | "usage";
const tabStyle =
  "h-11 rounded-none border-0 px-1 text-xs shadow-none after:bottom-0! after:bg-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-sm";

export function StaffInventory() {
  const [view, setView] = useState<View>("balances");
  const [inventory, setInventory] = useState(emptyInventory);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [supplyType, setSupplyType] = useState<SupplyType | "ALL">("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "NORMAL">(useSearchParams().get("lowStock") === "true" ? "LOW" : "ALL");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [movements, setMovements] = useState(emptyMovements);
  const [movementType, setMovementType] = useState<MovementType | "ALL">("ALL");
  const [movementSupplyId, setMovementSupplyId] = useState("ALL");
  const [movementFrom, setMovementFrom] = useState("");
  const [movementTo, setMovementTo] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [reconciliation, setReconciliation] = useState<InventoryReconciliation[]>([]);
  const [reconciliationSupplyId, setReconciliationSupplyId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<InventoryBalance | null>(null);
  const [adjustment, setAdjustment] = useState<Adjustment>("receipt");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (view !== "balances") return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); } });
    staffInventoryService.list({
      supplyType: supplyType === "ALL" ? undefined : supplyType,
      lowStock: stockFilter === "ALL" ? undefined : stockFilter === "LOW",
      search: search || undefined, page: inventoryPage, pageSize: 20,
    }).then((data) => { if (!cancelled) setInventory(data); })
      .catch((reason: unknown) => { if (!cancelled) setError(messageOf(reason, "Không thể tải tồn kho.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [inventoryPage, reloadKey, search, stockFilter, supplyType, view]);

  useEffect(() => {
    if (view !== "movements") return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); } });
    staffInventoryService.movements({
      supplyId: movementSupplyId === "ALL" ? undefined : Number(movementSupplyId),
      type: movementType === "ALL" ? undefined : movementType,
      from: movementFrom ? `${movementFrom}T00:00:00.000Z` : undefined,
      to: movementTo ? `${movementTo}T23:59:59.999Z` : undefined,
      page: movementPage, pageSize: 20,
    }).then((data) => { if (!cancelled) setMovements(data); })
      .catch((reason: unknown) => { if (!cancelled) setError(messageOf(reason, "Không thể tải lịch sử kho.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movementFrom, movementPage, movementSupplyId, movementTo, movementType, reloadKey, view]);

  useEffect(() => {
    if (view !== "reconciliation") return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); } });
    staffInventoryService.reconciliation(reconciliationSupplyId === "ALL" ? undefined : Number(reconciliationSupplyId))
      .then((data) => { if (!cancelled) setReconciliation(data); })
      .catch((reason: unknown) => { if (!cancelled) setError(messageOf(reason, "Không thể tải dữ liệu đối soát.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reconciliationSupplyId, reloadKey, view]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault(); setInventoryPage(1); setSearch(searchInput.trim());
  };

  const openAdjustment = async (item: InventoryBalance, kind: Adjustment) => {
    setOpening(true); setDialogError("");
    try {
      const detail = await staffInventoryService.get(item.supplyId);
      setSelected(detail); setAdjustment(kind); setQuantity(""); setReason("");
    } catch (reason) {
      toast.error(messageOf(reason, "Không thể tải chi tiết vật tư."));
    } finally { setOpening(false); }
  };

  const saveAdjustment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (!selected.unit?.trim()) { setDialogError("Vui lòng cập nhật đơn vị của vật tư trước khi nhập hoặc sử dụng."); return; }
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) { setDialogError("Số lượng phải là số nguyên dương."); return; }
    if (!reason.trim()) { setDialogError("Vui lòng nhập lý do."); return; }
    if (adjustment === "usage" && parsedQuantity > selected.available) { setDialogError(`Chỉ còn ${selected.available} ${selected.unit} khả dụng.`); return; }
    setSaving(true); setDialogError("");
    try {
      const request = { quantity: parsedQuantity, reason: reason.trim() };
      if (adjustment === "receipt") await staffInventoryService.receive(selected.supplyId, request);
      else await staffInventoryService.use(selected.supplyId, request);
      toast.success(`${adjustment === "receipt" ? "Đã nhập kho" : "Đã sử dụng"} ${parsedQuantity.toLocaleString("vi-VN")} ${selected.unit} · ${selected.supplyName}.`);
      setSelected(null); setReloadKey((value) => value + 1);
    } catch (reason) { setDialogError(messageOf(reason, "Không thể cập nhật tồn kho.")); }
    finally { setSaving(false); }
  };

  const totalAvailable = inventory.items.reduce((sum, item) => sum + item.available, 0);
  const totalReserved = inventory.items.reduce((sum, item) => sum + item.reserved, 0);
  const lowStockCount = inventory.items.filter((item) => item.isLowStock).length;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Kho</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Quản lý kho</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi tồn khả dụng, nhập kho, sử dụng vật tư và đối soát biến động.</p></div><Button variant="outline" disabled={loading} onClick={() => setReloadKey((value) => value + 1)}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button></header>

    <section className="grid gap-4 sm:grid-cols-3"><Summary label="Khả dụng trên trang" value={totalAvailable} icon={PackageSearch} loading={loading && view === "balances"} /><Summary label="Đang được giữ" value={totalReserved} icon={History} loading={loading && view === "balances"} /><Summary label="Sắp/hết hàng trên trang" value={lowStockCount} icon={AlertTriangle} warning={lowStockCount > 0} loading={loading && view === "balances"} /></section>

    <Tabs value={view} onValueChange={(value) => setView(value as View)}>
      <div className="overflow-x-auto border-b">
        <TabsList variant="line" style={{ height: 44 }} className="gap-3 rounded-none bg-transparent p-0 sm:gap-5">
          <TabsTrigger value="balances" className={tabStyle}><PackageSearch className="mr-1 hidden size-4 sm:block" />Tồn kho</TabsTrigger>
          <TabsTrigger value="movements" className={tabStyle}><History className="mr-1 hidden size-4 sm:block" />Lịch sử biến động</TabsTrigger>
          <TabsTrigger value="reconciliation" className={tabStyle}><ClipboardCheck className="mr-1 hidden size-4 sm:block" />Đối soát</TabsTrigger>
        </TabsList>
      </div>
    </Tabs>

    {view === "balances" && <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 p-5"><form onSubmit={submitSearch} className="flex min-w-[280px] flex-1 gap-2"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8BAF9A]" /><Input aria-label="Tìm vật tư" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tên vật tư..." className="pl-9" /></label><Button type="submit" variant="outline">Tìm</Button></form><Select value={supplyType} onValueChange={(value) => { setSupplyType(value as SupplyType | "ALL"); setInventoryPage(1); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả loại</SelectItem>{SUPPLY_TYPES.map((type) => <SelectItem value={type} key={type}>{supplyTypeLabels[type]}</SelectItem>)}</SelectContent></Select><Select value={stockFilter} onValueChange={(value) => { setStockFilter(value as typeof stockFilter); setInventoryPage(1); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả mức tồn</SelectItem><SelectItem value="LOW">Tồn thấp</SelectItem><SelectItem value="NORMAL">Tồn bình thường</SelectItem></SelectContent></Select></div>
      <LoadState loading={loading} error={error} empty={!inventory.items.length} emptyText="Không có vật tư phù hợp." retry={() => setReloadKey((value) => value + 1)}>{<div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Vật tư</th><th className="px-5 py-4">Loại</th><th className="px-5 py-4">Tồn thực tế</th><th className="px-5 py-4">Đã giữ</th><th className="px-5 py-4">Khả dụng</th><th className="px-5 py-4">Mức tối thiểu</th><th className="px-5 py-4">Tình trạng</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody>{inventory.items.map((item) => <tr key={item.supplyId} className="border-t border-[#EDF2EE] hover:bg-[#F8FBF9]"><td className="px-5 py-4"><p className="font-semibold text-[#173B29]">{item.supplyName}</p><p className="mt-1 text-xs text-muted-foreground">Đơn vị: {item.unit}</p></td><td className="px-5 py-4">{isSupplyType(item.supplyType) ? supplyTypeLabels[item.supplyType] : item.supplyType}</td><NumberCell value={item.onHand} unit={item.unit} /><NumberCell value={item.reserved} unit={item.unit} /><NumberCell value={item.available} unit={item.unit} strong /><NumberCell value={item.minStockLevel} unit={item.unit} /><td className="px-5 py-4"><Badge variant="outline" className={item.isLowStock ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{item.isLowStock ? "Tồn thấp" : "Bình thường"}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={opening} onClick={() => void openAdjustment(item, "receipt")}><ArrowDownToLine />Nhập</Button><Button size="sm" variant="outline" disabled={opening || item.available <= 0} onClick={() => void openAdjustment(item, "usage")}><ArrowUpFromLine />Dùng</Button></div></td></tr>)}</tbody></table></div>}</LoadState>
      <Pager page={inventoryPage} totalPages={inventory.totalPages} loading={loading} onPage={setInventoryPage} />
    </section>}

    {view === "movements" && <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm"><div className="flex flex-wrap gap-3 p-5"><Select value={movementSupplyId} onValueChange={(value) => { setMovementSupplyId(value); setMovementPage(1); }}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Vật tư" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả vật tư</SelectItem>{inventory.items.map((item) => <SelectItem value={String(item.supplyId)} key={item.supplyId}>{item.supplyName}</SelectItem>)}</SelectContent></Select><Select value={movementType} onValueChange={(value) => { setMovementType(value as MovementType | "ALL"); setMovementPage(1); }}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả biến động</SelectItem>{MOVEMENT_TYPES.map((type) => <SelectItem value={type} key={type}>{movementLabels[type]}</SelectItem>)}</SelectContent></Select><label className="flex items-center gap-2 text-xs text-muted-foreground">Từ <LocalDatePicker allowClear label="Từ ngày biến động" value={movementFrom} onChange={(value) => { setMovementFrom(value); setMovementPage(1); }} className="w-[150px]" /></label><label className="flex items-center gap-2 text-xs text-muted-foreground">Đến <LocalDatePicker allowClear label="Đến ngày biến động" min={movementFrom || undefined} value={movementTo} onChange={(value) => { setMovementTo(value); setMovementPage(1); }} className="w-[150px]" /></label></div><LoadState loading={loading} error={error} empty={!movements.items.length} emptyText="Chưa có biến động kho." retry={() => setReloadKey((value) => value + 1)}>{<div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Vật tư</th><th className="px-5 py-4">Loại</th><th className="px-5 py-4">Số lượng</th><th className="px-5 py-4">Số dư sau</th><th className="px-5 py-4">Lý do</th><th className="px-5 py-4">Nguồn</th></tr></thead><tbody>{movements.items.map((item) => <tr key={item.movementId} className="border-t border-[#EDF2EE]"><td className="px-5 py-4 whitespace-nowrap">{formatStamp(item.createdAt)}</td><td className="px-5 py-4 font-medium">{item.supplyName}</td><td className="px-5 py-4"><Badge variant="outline">{isMovementType(item.movementType) ? movementLabels[item.movementType] : item.movementType}</Badge></td><td className={`px-5 py-4 font-semibold ${item.quantity >= 0 ? "text-emerald-700" : "text-red-600"}`}>{item.quantity > 0 ? "+" : ""}{item.quantity}</td><td className="px-5 py-4">{item.balanceAfter}</td><td className="max-w-[300px] px-5 py-4">{item.reason}</td><td className="px-5 py-4">{item.orderId ? "Đơn hàng" : "Điều chỉnh kho"}</td></tr>)}</tbody></table></div>}</LoadState><Pager page={movementPage} totalPages={movements.totalPages} loading={loading} onPage={setMovementPage} /></section>}

    {view === "reconciliation" && <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EDF2EE] p-5"><div><h2 className="font-semibold text-[#173B29]">Đối soát tồn kho</h2><p className="mt-1 text-xs text-muted-foreground">Công thức dùng số dư đầu kỳ + nhập kho − sử dụng thủ công; giao dịch SALE không bị trừ lần hai.</p></div><Select value={reconciliationSupplyId} onValueChange={setReconciliationSupplyId}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Vật tư" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả vật tư</SelectItem>{inventory.items.map((item) => <SelectItem value={String(item.supplyId)} key={item.supplyId}>{item.supplyName}</SelectItem>)}</SelectContent></Select></div><LoadState loading={loading} error={error} empty={!reconciliation.length} emptyText="Không có dữ liệu đối soát." retry={() => setReloadKey((value) => value + 1)}>{<div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Vật tư</th><th className="px-5 py-4">Đầu kỳ</th><th className="px-5 py-4">Movement ròng</th><th className="px-5 py-4">Dự kiến</th><th className="px-5 py-4">Hiện tại</th><th className="px-5 py-4">Chênh lệch</th><th className="px-5 py-4">Kết quả</th></tr></thead><tbody>{reconciliation.map((item) => <tr key={item.supplyId} className="border-t border-[#EDF2EE]"><td className="px-5 py-4 font-medium">{item.supplyName}</td><td className="px-5 py-4">{item.openingBalance ?? "—"}</td><td className="px-5 py-4">{item.movementNet}</td><td className="px-5 py-4">{item.expectedAvailable}</td><td className="px-5 py-4 font-semibold">{item.currentAvailable}</td><td className={`px-5 py-4 font-semibold ${item.difference === 0 ? "text-emerald-700" : "text-red-600"}`}>{item.difference}</td><td className="px-5 py-4"><Badge variant="outline" className={item.isReconciled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>{reconciliationLabel(item.status)}</Badge></td></tr>)}</tbody></table></div>}</LoadState></section>}

    <Dialog open={!!selected} onOpenChange={(open) => { if (!open && !saving) setSelected(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-balance">{adjustment === "receipt" ? "Nhập kho" : "Xuất kho"}</DialogTitle>
          <DialogDescription className="text-pretty">
            {selected?.supplyName} · khả dụng hiện tại <span className="font-semibold tabular-nums">{selected?.available.toLocaleString("vi-VN")} {selected?.unit?.trim() || "(chưa có đơn vị)"}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={saveAdjustment} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="inventory-adjustment-quantity" className="text-sm font-medium">
              {adjustment === "receipt" ? "Số lượng nhập" : "Số lượng xuất"} 
            </label>
            <div className="flex items-center overflow-hidden rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
              <Input id="inventory-adjustment-quantity" className="min-w-0 flex-1 border-0 bg-transparent tabular-nums shadow-none focus-visible:ring-0" type="number" min={1} max={adjustment === "usage" ? selected?.available : undefined} step={1} required disabled={saving} value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-describedby="inventory-adjustment-unit" />
              <span aria-hidden="true" className="pointer-events-none shrink-0 px-3 text-sm font-semibold text-muted-foreground">{selected?.unit?.trim() || "Chưa có đơn vị"}</span>
            </div>
           
          </div>
          <label className="block space-y-1.5 text-sm font-medium"><span>Lý do *</span><Textarea value={reason} maxLength={500} disabled={saving} onChange={(event) => setReason(event.target.value)} placeholder={adjustment === "receipt" ? "Ví dụ: Nhập từ nhà cung cấp" : "Ví dụ: Dùng cho lứa trồng"} /></label>
          {dialogError && <p role="alert" className="text-sm text-destructive">{dialogError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setSelected(null)}>Hủy</Button>
            <Button type="submit" disabled={saving || !selected?.unit?.trim()}>{saving ? "Đang lưu..." : adjustment === "receipt" ? "Xác nhận nhập kho" : "Xác nhận xuất kho"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}

function messageOf(reason: unknown, fallback: string) { return reason instanceof Error ? reason.message : fallback; }
function isSupplyType(value: string): value is SupplyType { return SUPPLY_TYPES.some((type) => type === value); }
function isMovementType(value: string): value is MovementType { return MOVEMENT_TYPES.some((type) => type === value); }
function formatStamp(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : dateTime(parsed); }
function reconciliationLabel(status: string) { return status === "RECONCILED" ? "Khớp" : status === "NO_MOVEMENTS" ? "Chưa có biến động" : status === "MISMATCH" ? "Lệch" : status; }

function Summary({ label, value, icon: Icon, warning = false, loading = false }: { label: string; value: number; icon: typeof PackageSearch; warning?: boolean; loading?: boolean }) { return <div className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm"><span className={`grid size-10 place-items-center rounded-xl ${warning ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-primary"}`}><Icon className="size-5" /></span>{loading ? <Skeleton className="mt-4 h-9 w-24" /> : <p className="mt-4 text-3xl font-bold tabular-nums text-[#173B29]">{value}</p>}<p className="mt-1 text-sm text-muted-foreground">{label}</p></div>; }
function NumberCell({ value, unit, strong = false }: { value: number; unit: string; strong?: boolean }) { return <td className={`px-5 py-4 tabular-nums ${strong ? "font-semibold text-primary" : ""}`}>{value} <span className="text-xs text-muted-foreground">{unit}</span></td>; }
function LoadState({ loading, error, empty, emptyText, retry, children }: { loading: boolean; error: string; empty: boolean; emptyText: string; retry: () => void; children: React.ReactNode }) { if (error) return <div className="border-t border-red-100 bg-red-50 px-5 py-12 text-center"><p className="font-semibold text-red-700">Không thể tải dữ liệu kho</p><p className="mt-1 text-sm text-red-600">{error}</p><Button variant="outline" className="mt-4" onClick={retry}>Thử lại</Button></div>; if (loading) return <TableSkeleton rows={6} columns={7} className="border-t" />; if (empty) return <div className="border-t px-5 py-16 text-center"><ClipboardCheck className="mx-auto size-10 text-[#8BAF9A]" /><p className="mt-3 font-semibold">{emptyText}</p></div>; return children; }
function Pager({ page, totalPages, loading, onPage }: { page: number; totalPages: number; loading: boolean; onPage: (page: number) => void }) { if (totalPages <= 1) return null; return <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4"><Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {totalPages}</span><Button size="sm" variant="outline" disabled={loading || page >= totalPages} onClick={() => onPage(page + 1)}>Trang sau</Button></div>; }
