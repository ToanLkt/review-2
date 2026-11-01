"use client";

import { Sprout } from "lucide-react";
import { CyclesTab } from "@/components/operations/planting-cycles/cycles-tab";
import { OperationsProvider } from "@/components/operations/shared/operations-provider";
import { OperationsRoutesProvider, type OperationsRoutes } from "@/components/operations/shared/operations-routes";
import { VarietiesProvider } from "@/components/varieties/varieties-provider";
import type { CropStatus } from "@/lib/api/staff/staff-cultivation-service";

const cropStatusLabels: Record<CropStatus, string> = {
  WAITING_PLANTING: "Chờ gieo", PLANTED: "Đã trồng", GERMINATING: "Nảy mầm",
  GROWING: "Sinh trưởng", READY_TO_HARVEST: "Sẵn sàng thu hoạch",
  HARVESTED: "Đã thu hoạch", FAILED: "Thất bại",
};

export function cropStatusLabel(status: string) {
  return cropStatusLabels[status as CropStatus] ?? status;
}

const staffOperationsRoutes: OperationsRoutes = {
  trays: "/staff/trays",
  cycles: "/staff/trays?tab=cycles",
  orders: "/staff/orders",
  monitoring: "/staff/devices",
  readOnly: false,
};

export function StaffCyclesPage({ embedded = false }: { embedded?: boolean }) {
  return <VarietiesProvider>
    <OperationsRoutesProvider routes={staffOperationsRoutes}>
      <OperationsProvider farmScope="staff">
        <div className="space-y-6">
          {!embedded && <header>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Canh tác</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-[#173B29]"><Sprout className="size-7 text-primary" />Chu kỳ trồng</h1>
            <p className="mt-2 text-sm text-muted-foreground">Quản lý chu kỳ trồng, cập nhật giai đoạn, ghi nhận thu hoạch và theo dõi khay.</p>
          </header>}
          <CyclesTab />
        </div>
      </OperationsProvider>
    </OperationsRoutesProvider>
  </VarietiesProvider>;
}
