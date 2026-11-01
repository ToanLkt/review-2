import { Badge } from "@/components/ui/badge";
import type { MeasurementStatus } from "@/lib/environment";
const statuses = {
  current: { label: "Hiện tại", color: "bg-[#E8F3EB] text-[#3F7655]" },
  stale: { label: "Dữ liệu cũ", color: "bg-amber-50 text-amber-700" },
  offline: { label: "Mất kết nối", color: "bg-red-50 text-red-600" },
};
export function MeasurementStatusBadge({
  status,
}: {
  status: MeasurementStatus;
}) {
  const item = statuses[status];
  return (
    <Badge
      variant="outline"
      className={
        "shrink-0 rounded-md border-0 px-2.5 py-1 text-xs " + item.color
      }
    >
      {item.label}
    </Badge>
  );
}
