"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Map, Grid2X2, Sprout } from "lucide-react";
import { CyclesTab } from "./planting-cycles/cycles-tab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AreaOverview } from "./areas/area-overview";
import { TrayTable } from "./trays/tray-table";
import { AreaFormSheet } from "./areas/area-form-sheet";
import { TrayFormSheet } from "./trays/tray-form-sheet";
import { useOperationsRoutes } from "./shared/operations-routes";
import { useOperations } from "./shared/operations-provider";
import { Skeleton } from "@/components/ui/skeleton";
const tabStyle =
  "h-11 rounded-none border-0 px-1 text-xs shadow-none after:bottom-0! after:bg-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-sm";
export function TraysPage({ showCycles = true }: { showCycles?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const routes = useOperationsRoutes();
  const { loading, error, reload } = useOperations();
  const requested = params.get("tab");
  const tab =
    requested === "trays" || (showCycles && requested === "cycles")
      ? requested
      : "areas";
  const [create, setCreate] = useState<"area" | "tray" | null>(null);
  function changeTab(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("tab", value);
    next.delete("cycle");
    next.delete("action");
    next.delete("tray");
    router.push(routes.trays + "?" + next.toString(), { scroll: false });
  }
  return (
    <main className="mx-auto min-h-[calc(100dvh-80px)] w-full max-w-[1700px] min-w-0 bg-white p-4 sm:p-6 lg:p-8">
      <header className="-mx-4 -mt-4 bg-white px-4 pt-10 pb-6 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div>
          <h1 className="text-[26px] font-bold text-foreground">
            Khu vực & khay trồng
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {routes.readOnly
              ? "Theo dõi khu vực, danh sách khay và các chu kỳ trồng trong nông trại."
              : showCycles
                ? "Quản lý cấu trúc vị trí, danh sách khay và các chu kỳ trồng."
                : "Theo dõi cấu trúc vị trí và danh sách khay trong nông trại."}
          </p>
        </div>
      </header>
      {loading ? <div className="mt-6 space-y-3" role="status" aria-label="Đang tải dữ liệu trang trại"><Skeleton className="h-20 w-full"/><Skeleton className="h-56 w-full"/></div> : error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-center"><p className="text-sm text-red-700">Không thể tải dữ liệu trang trại.</p><Button className="mt-4" variant="outline" onClick={() => void reload()}>Thử lại</Button></div> : <Tabs value={tab} onValueChange={changeTab} className="mt-6 gap-5">
        <div className="overflow-x-auto border-b">
          <TabsList
            variant="line"
            style={{ height: 44 }}
            className="gap-3 rounded-none bg-transparent p-0 sm:gap-5"
          >
            <TabsTrigger value="areas" className={tabStyle}>
              <Map className="mr-1 hidden size-4 sm:block" />
              Khu vực & tầng kệ
            </TabsTrigger>
            <TabsTrigger value="trays" className={tabStyle}>
              <Grid2X2 className="mr-1 hidden size-4 sm:block" />
              Danh sách khay
            </TabsTrigger>
            {showCycles && (
              <TabsTrigger value="cycles" className={tabStyle}>
                <Sprout className="mr-1 hidden size-4 sm:block" />
                Chu kỳ trồng
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <TabsContent value="areas">
          <AreaOverview
            onCreate={routes.readOnly ? undefined : () => setCreate("area")}
          />
        </TabsContent>
        <TabsContent value="trays">
          <TrayTable
            onCreate={routes.readOnly ? undefined : () => setCreate("tray")}
          />
        </TabsContent>
        {showCycles && (
          <TabsContent value="cycles">
            <CyclesTab
              key={params.get("cycle") ?? params.get("action") ?? "list"}
            />
          </TabsContent>
        )}
      </Tabs>}
      {!routes.readOnly && create === "area" && (
        <AreaFormSheet onClose={() => setCreate(null)} />
      )}{" "}
      {!routes.readOnly && create === "tray" && (
        <TrayFormSheet onClose={() => setCreate(null)} />
      )}
    </main>
  );
}
