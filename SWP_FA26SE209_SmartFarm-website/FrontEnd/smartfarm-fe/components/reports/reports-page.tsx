"use client";

import { useRef, useState } from "react";
import { ArrowRight, Download, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalDatePicker } from "@/components/ui/local-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportTab } from "@/lib/reports";
type ViewTab = ReportTab | "iot";
import { RevenueReport } from "./revenue-report";
import { HarvestReport } from "./harvest-report";
import { InventoryReport } from "./inventory-report";
import { IoTReport } from "./iot-report";
import { ExportReportSheet } from "./export-report-sheet";
import { ReportsProvider, useReports } from "./reports-provider";

export function ReportsPage() {
  return <ReportsProvider><ReportsContent /></ReportsProvider>;
}

function ReportsContent() {
  const [tab, setTab] = useState<ViewTab>("revenue");
  const [exportOpen, setExportOpen] = useState(false);
  const exportButton = useRef<HTMLButtonElement>(null);
  const { from, to, setFrom, setTo, loading, error, reload } = useReports();

  return (
    <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1F2937]">
              Báo cáo quản trị
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Tổng hợp doanh thu, kết quả thu hoạch và tình hình tồn kho.
            </p>
          </div>
          {tab !== "iot" && <Button
            ref={exportButton}
            className="h-10 rounded-xl px-4"
            onClick={() => setExportOpen(true)}
          >
            <Download /> Xuất báo cáo
          </Button>}
        </header>

        <section className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 shadow-[0_1px_4px_#244a3014]">
          <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Từ</span><LocalDatePicker label="Từ ngày" value={from} max={to} onChange={setFrom} className="h-10 w-44 rounded-xl" /></div>
          <ArrowRight className="mb-3 hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
          <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Đến</span><LocalDatePicker label="Đến ngày" value={to} min={from} onChange={setTo} className="h-10 w-44 rounded-xl" /></div>
          {loading && <span className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Đang tải báo cáo...</span>}
        </section>
        {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={reload}><RefreshCw className="size-4" />Thử lại</Button></div>}

        <section
          aria-label="Báo cáo và nhật ký"
          className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3014]"
        >
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as ViewTab)}
            className="gap-0"
          >
            <div className="overflow-x-auto border-b px-5 pt-3 sm:px-6">
              <TabsList variant="line" className="h-12! gap-0 rounded-none p-0">
                {[
                  ["revenue", "Doanh thu"],
                  ["harvest", "Sản lượng thu hoạch"],
                  ["inventory", "Tồn kho"],
                  ["iot", "IoT"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-12 rounded-none px-4 font-semibold after:bottom-0! after:bg-primary data-[state=active]:text-primary"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="revenue" className="mt-0">
              <RevenueReport />
            </TabsContent>
            <TabsContent value="harvest" className="mt-0">
              <HarvestReport />
            </TabsContent>
            <TabsContent value="inventory" className="mt-0">
              <InventoryReport />
            </TabsContent>
            <TabsContent value="iot" className="mt-0"><IoTReport /></TabsContent>
          </Tabs>
        </section>
      </div>
      {exportOpen && tab !== "iot" && (
        <ExportReportSheet
          initialTab={tab}
          onClose={() => setExportOpen(false)}
          returnFocus={() => exportButton.current?.focus()}
        />
      )}
    </main>
  );
}
