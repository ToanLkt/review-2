"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, ArrowUpFromLine, Search } from "lucide-react";
import { SummaryCard } from "@/components/admin/summary-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Choice } from "@/components/operations/shared/ui";
import { DevicePagination } from "@/components/devices/device-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  groups,
  statusLabels,
  filterMaterials,
  filterTransactions,
  inventorySummary,
} from "@/lib/inventory";
import { useInventory } from "./inventory-provider";
import { InventoryTable } from "./inventory-table";
import { HistoryTable } from "./history-table";

const ImportDrawer = dynamic(
  () => import("./inventory-drawers").then((m) => m.ImportDrawer),
  {
    loading: () => (
      <div
        role="status"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

const ExportDrawer = dynamic(
  () => import("./inventory-drawers").then((m) => m.ExportDrawer),
  {
    loading: () => (
      <div
        role="status"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

const UpdateDrawer = dynamic(
  () => import("./inventory-drawers").then((m) => m.UpdateDrawer),
  {
    loading: () => (
      <div
        role="status"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

type DrawerState =
  | null
  | { kind: "import" }
  | { kind: "export" }
  | { kind: "update"; id: string };

export function InventoryPage() {
  const { materials, transactions } = useInventory();
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const trigger = useRef<HTMLElement | null>(null);

  function reset() {
    setQuery("");
    setGroup("");
    setStatus("");
    setPage(1);
  }

  // Inventory tab
  const filteredMaterials = filterMaterials(materials, query, group, status);
  const matPages = Math.max(1, Math.ceil(filteredMaterials.length / 10));
  const matPage = Math.min(page, matPages);

  // History tab — reuse group for type filter
  const filteredTxs = filterTransactions(transactions, query, group, status);
  const txPages = Math.max(1, Math.ceil(filteredTxs.length / 10));
  const txPage = Math.min(page, txPages);

  const summary = inventorySummary(materials);

  const kpis = [
    {
      value: summary.totalTypes,
      label: "Loại vật tư",
      support: `${summary.uniqueGroups} nhóm vật tư`,
      color: "text-primary",
    },
    {
      value: summary.low,
      label: "Sắp hết",
      support: "Cần đặt hàng bổ sung",
      color: "text-amber-600",
    },
    {
      value: summary.out,
      label: "Hết hàng",
      support: "Cần nhập kho ngay",
      color: "text-red-600",
    },
  ];

  // History-tab filter options differ from stock tab
  const groupOptions =
    tab === "stock"
      ? [
          { value: "", label: "Tất cả nhóm" },
          ...groups.map((g) => ({ value: g, label: g })),
        ]
      : [
          { value: "", label: "Tất cả loại" },
          { value: "Nhập kho", label: "Nhập kho" },
          { value: "Xuất dùng", label: "Xuất dùng" },
          { value: "Bán lẻ", label: "Bán lẻ" },
        ];

  const statusOptions =
    tab === "stock"
      ? [
          { value: "", label: "Tất cả trạng thái" },
          ...statusLabels.map((s) => ({ value: s, label: s })),
        ]
      : [];

  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">
              Kho vật tư
            </h1>
            <p className="mt-2 max-w-4xl text-base leading-relaxed text-muted-foreground">
              Theo dõi tồn kho và lịch sử sử dụng vật tư.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setDrawer({ kind: "export" });
              }}
            >
              <ArrowUpFromLine className="size-4" />
              Xuất kho
            </Button>
            <Button
              className="h-10 gap-2 rounded-xl px-4"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setDrawer({ kind: "import" });
              }}
            >
              <ArrowDownToLine className="size-4" />
              Nhập kho
            </Button>
          </div>
        </header>

        {/* KPI cards — 3 columns */}
        <section
          aria-label="Tổng hợp kho vật tư"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {kpis.map((k) => (
            <SummaryCard key={k.label} {...k} />
          ))}
        </section>

        {/* Main content card */}
        <section
          aria-label="Chi tiết kho vật tư"
          className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3020]"
        >
          {/* Tabs */}
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "stock" | "history");
              reset();
            }}
            className="gap-0"
          >
            <div className="overflow-x-auto border-b px-5 pt-3">
              <TabsList
                variant="line"
                className="h-12! gap-0 rounded-none p-0"
              >
                {[
                  ["stock", "Tồn kho"],
                  ["history", "Lịch sử nhập xuất"],
                ].map(([v, l]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="h-12 rounded-none px-4 after:bottom-0! after:bg-primary data-[state=active]:text-primary"
                  >
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-2.5 left-3 size-4 text-[#8BAF9A]" />
              <Input
                aria-label="Tìm vật tư"
                placeholder="Tìm vật tư..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 pl-9 shadow-none"
              />
            </div>
            <div className="w-full sm:w-48">
              <Choice
                label={tab === "stock" ? "Lọc nhóm" : "Lọc loại giao dịch"}
                value={group}
                onChange={(v) => {
                  setGroup(v);
                  setPage(1);
                }}
                options={groupOptions}
              />
            </div>
            {tab === "stock" && statusOptions.length > 0 && (
              <div className="w-full sm:w-48">
                <Choice
                  label="Lọc trạng thái"
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                  options={statusOptions}
                />
              </div>
            )}
            {(query || group || status) && (
              <Button
                variant="ghost"
                onClick={reset}
                className="text-xs text-primary"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Table */}
          {tab === "stock" ? (
            <InventoryTable
              materials={filteredMaterials.slice(
                (matPage - 1) * 10,
                matPage * 10,
              )}
              onUpdate={(id) => {
                trigger.current = document.activeElement as HTMLElement;
                setDrawer({ kind: "update", id });
              }}
              onReset={reset}
              hasData={materials.length > 0}
            />
          ) : (
            <HistoryTable
              transactions={filteredTxs.slice(
                (txPage - 1) * 10,
                txPage * 10,
              )}
              onReset={reset}
              hasData={transactions.length > 0}
            />
          )}

          {/* Pagination */}
          <DevicePagination
            total={
              tab === "stock" ? filteredMaterials.length : filteredTxs.length
            }
            page={tab === "stock" ? matPage : txPage}
            onPage={setPage}
          />
        </section>
      </div>

      {/* Drawers */}
      {drawer?.kind === "import" && (
        <ImportDrawer
          onClose={() => setDrawer(null)}
          returnFocus={() => trigger.current?.focus()}
        />
      )}
      {drawer?.kind === "export" && (
        <ExportDrawer
          onClose={() => setDrawer(null)}
          returnFocus={() => trigger.current?.focus()}
        />
      )}
      {drawer?.kind === "update" && (
        <UpdateDrawer
          material={materials.find((m) => m.id === drawer.id)!}
          onClose={() => setDrawer(null)}
          returnFocus={() => trigger.current?.focus()}
        />
      )}
    </main>
  );
}
