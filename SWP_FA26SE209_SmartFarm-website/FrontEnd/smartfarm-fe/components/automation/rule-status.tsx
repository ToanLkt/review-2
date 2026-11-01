import {
  Check,
  RefreshCw,
  SquarePen,
  Clock,
  WifiOff,
  CircleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { syncLabels, type SyncStatus } from "@/lib/automation";
const styles = {
  draft: { Icon: SquarePen, color: "bg-slate-100 text-slate-600" },
  sending: { Icon: RefreshCw, color: "bg-blue-50 text-blue-600" },
  waiting: { Icon: Clock, color: "bg-blue-50 text-blue-600" },
  acknowledged: { Icon: Check, color: "bg-secondary text-primary" },
  failed: { Icon: CircleAlert, color: "bg-red-50 text-red-700" },
  offline: { Icon: WifiOff, color: "bg-amber-50 text-amber-700" },
};
export function RuleStatus({ status }: { status: SyncStatus }) {
  const { Icon, color } = styles[status];
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-md border-transparent px-2.5 py-1 text-xs font-medium ${color}`}
    >
      <Icon className="size-3.5" />
      {syncLabels[status]}
    </Badge>
  );
}
