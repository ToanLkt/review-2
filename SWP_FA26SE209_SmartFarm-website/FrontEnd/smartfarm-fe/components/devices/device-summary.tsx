import { SummaryCard } from "@/components/admin/summary-card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { deviceSummary, controllers, type Device } from "@/lib/devices";
export function DeviceSummary({ devices }: { devices: Device[] }) {
  const s = deviceSummary(devices),
    offline = controllers.filter((c) => c.connection === "offline");
  const cards = [
    {
      value: s.total,
      label: "Tổng thiết bị",
      support: `${s.types} loại · ${s.controllers} bộ điều khiển`,
      color: "text-[#759580]",
    },
    {
      value: s.online,
      label: "Trực tuyến",
      support: `${s.total ? Math.round((s.online / s.total) * 100) : 0}% hoạt động bình thường`,
      color: "text-primary",
    },
    {
      value: s.offline,
      label: "Mất kết nối",
      support:
        offline.map((c) => `Khu ${c.area} · ${c.id} mất kết nối`).join(", ") ||
        "Không có thiết bị mất kết nối",
      color: "text-red-600",
    },
  ];
  return (
    <section aria-label="Tổng hợp thiết bị" className="space-y-3">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <Tooltip key={c.label}>
            <TooltipTrigger asChild>
              <div
                tabIndex={0}
                aria-label={`${c.label}: ${c.value}. ${c.support}`}
                className="min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring [&>div]:h-full"
              >
                <SummaryCard {...c} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {i === 0
                ? "Số loại là năm loại chỉ số cảm biến, không bao gồm loại thiết bị điều khiển."
                : i === 1
                  ? "Tỷ lệ kết nối trực tuyến; không có nghĩa mọi số đo đều hiện tại."
                  : "Kết nối độc lập với độ mới số đo và trạng thái bật/tắt."}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {s.unregistered > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          {s.unregistered} thiết bị mới chưa kết nối
        </p>
      )}
    </section>
  );
}
