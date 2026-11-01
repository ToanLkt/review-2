"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Search } from "lucide-react";
import { SummaryCard } from "@/components/admin/summary-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Choice } from "@/components/operations/shared/ui";
import { DevicePagination } from "@/components/devices/device-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  categories,
  statuses,
  filterProducts,
  productSummary,
  inventorySummary,
} from "@/lib/products";
import { useProducts } from "./products-provider";
import { ProductTable } from "./product-table";
import { InventoryTable } from "./inventory-table";

const ProductPanel = dynamic(
  () => import("./product-form").then((m) => m.ProductPanel),
  {
    loading: () => (
      <div
        role="status"
        aria-label="Đang tải"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

export function ProductsPage() {
  const { products, batches } = useProducts();
  const [tab, setTab] = useState<"list" | "inventory">("list");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

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

  function reset() {
    setQuery("");
    setCategory("");
    setStatus("");
    setPage(1);
  }

  const filtered = filterProducts(products, query, category, status);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);

  const summary = productSummary(products);
  const invSummary = inventorySummary(products, batches);

  const kpis = [
    {
      value: summary.selling,
      label: "Sản phẩm đang bán",
      support: "Hạt giống đóng gói",
      color: "text-primary",
    },
    {
      value: summary.totalStock + " gói",
      label: "Tổng tồn thực tế",
      support: `Từ ${invSummary.uniqueBatches} lô nhập kho`,
      color: "text-[#88A893]",
    },
    {
      value: summary.totalReserved + " gói",
      label: "Đã giữ cho đơn",
      support:
        products.filter((p) => p.reserved > 0).length + " đơn đang xử lý",
      color: "text-blue-500",
    },
    {
      value: invSummary.expiringSoon + " lô",
      label: "Sắp hết hạn",
      support: "Hạn dùng gần nhất",
      color: "text-amber-600",
    },
  ];

  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">
              Sản phẩm hạt giống
            </h1>
            <p className="mt-2 max-w-4xl text-base leading-relaxed text-muted-foreground">
              Quản lý danh mục hạt giống bán lẻ để khách tự trồng tại nhà và
              tồn kho hạt giống.
            </p>
          </div>
          <Button
            ref={createButton}
            onClick={(e) => openPanel(e.currentTarget, "create")}
            className="h-10 rounded-xl px-4"
          >
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        </header>

        {/* KPI cards */}
        <section
          aria-label="Tổng hợp sản phẩm"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {kpis.map((k) => (
            <SummaryCard key={k.label} {...k} />
          ))}
        </section>

        {/* Main content card */}
        <section
          aria-label="Danh sách sản phẩm"
          className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3020]"
        >
          {/* Tabs */}
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "list" | "inventory");
              setPage(1);
            }}
            className="gap-0"
          >
            <div className="overflow-x-auto border-b px-5 pt-3">
              <TabsList
                variant="line"
                className="h-12! gap-0 rounded-none p-0"
              >
                {[
                  ["list", "Danh sách sản phẩm"],
                  ["inventory", "Tồn kho hạt giống"],
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

          {/* Filters (product list tab only) */}
          {tab === "list" && (
            <div className="flex flex-wrap gap-3 p-5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-2.5 left-3 size-4 text-[#8BAF9A]" />
                <Input
                  aria-label="Tìm sản phẩm"
                  placeholder="Tìm sản phẩm..."
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
                  label="Lọc danh mục"
                  value={category}
                  onChange={(v) => {
                    setCategory(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "Tất cả danh mục" },
                    ...categories.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
              <div className="w-full sm:w-48">
                <Choice
                  label="Lọc trạng thái"
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "Tất cả trạng thái" },
                    ...statuses.map((s) => ({ value: s, label: s })),
                  ]}
                />
              </div>
              {(query || category || status) && (
                <Button
                  variant="ghost"
                  onClick={reset}
                  className="text-xs text-primary"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}

          {/* Table content */}
          {tab === "list" ? (
            <ProductTable
              products={filtered.slice((current - 1) * 10, current * 10)}
              onView={(id) => {
                const btn = document.activeElement as HTMLButtonElement;
                openPanel(btn, "view", id);
              }}
              onEdit={(id) => {
                const btn = document.activeElement as HTMLButtonElement;
                openPanel(btn, "edit", id);
              }}
              onReset={reset}
              hasProducts={products.length > 0}
            />
          ) : (
            <InventoryTable products={products} batches={batches} />
          )}

          {/* Pagination (product list tab only) */}
          {tab === "list" && (
            <DevicePagination
              total={filtered.length}
              page={current}
              onPage={setPage}
            />
          )}
        </section>
      </div>

      {/* Drawer */}
      {panel && (
        <ProductPanel
          initialMode={panel.mode}
          product={products.find((p) => p.id === panel.id)}
          onClose={() => setPanel(null)}
          returnFocus={() => {
            const target = trigger.current?.isConnected
              ? trigger.current
              : createButton.current;
            target?.focus();
          }}
        />
      )}
    </main>
  );
}
