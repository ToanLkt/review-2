import { Droplets, Sun, Wind, SquarePen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  actionText,
  thresholdText,
  type AutomationRule,
} from "@/lib/automation";
import { controllers, deviceTimestamp, type Device } from "@/lib/devices";
import { RuleStatus } from "./rule-status";
export function RuleCard({
  rule,
  devices,
  onEdit,
  onToggle,
  onRetry,
}: {
  rule: AutomationRule;
  devices: Device[];
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onRetry: () => void;
}) {
  const c = rule.requested,
    sensor = devices.find((d) => d.id === c.sensorId)!,
    output = devices.find((d) => d.id === c.outputId)!;
  const Icon =
    output.type === "pump" ? Droplets : output.type === "lamp" ? Sun : Wind;
  const last = rule.lastAttemptAt ?? rule.lastAcknowledgedAt;
  const effective = rule.acknowledged;
  const pending = !effective || effective.version !== rule.version;
  const offline =
    controllers.find((controller) => controller.id === c.controllerId)
      ?.connection === "offline";
  return (
    <article
      aria-label={c.name}
      className="rounded-2xl border bg-white p-5 shadow-[0_1px_4px_#244a3004] sm:p-6"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="size-6" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-base font-bold">{c.name}</h2>
            <Badge className="border-0 bg-blue-50 font-medium text-blue-600">
              Bộ điều khiển khu {c.area}
            </Badge>
          </div>
          <Badge className="mt-2 border-0 bg-secondary font-normal text-primary">
            Khu {c.area} · {c.location}
          </Badge>
        </div>
        <div className="ml-auto flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor={`auto-${rule.id}`}
              className="text-xs text-muted-foreground"
            >
              Chế độ tự động
            </label>
            <Switch
              id={`auto-${rule.id}`}
              aria-label={`Chế độ tự động: ${c.name}`}
              checked={c.enabled}
              disabled={rule.inFlight}
              onCheckedChange={onToggle}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            disabled={rule.inFlight}
            aria-label={`Chỉnh sửa ${c.name}`}
            onClick={onEdit}
          >
            <SquarePen className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-x-10 gap-y-4 text-sm lg:ml-16 lg:grid-cols-2">
        <div className="space-y-3">
          <p>
            <span className="font-semibold text-[#59645E]">
              Cảm biến đầu vào:{" "}
            </span>
            <span className="text-muted-foreground">
              {sensor.name} ({sensor.id})
            </span>
          </p>
          <p>
            <span className="font-semibold text-[#59645E]">
              Thiết bị đầu ra:{" "}
            </span>
            <span className="text-muted-foreground">{output.name}</span>
          </p>
        </div>
        <div className="space-y-3">
          <p>
            <span className="font-semibold text-[#59645E]">
              Điều kiện ngưỡng:{" "}
            </span>
            <span className="text-muted-foreground">
              {thresholdText(c, devices)}
            </span>
          </p>
          <p>
            <span className="font-semibold text-[#59645E]">Hành động: </span>
            <span className="text-muted-foreground">
              {actionText(c, devices)}
            </span>
          </p>
        </div>
      </div>
      <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-4 lg:ml-16">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="rounded focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RuleStatus status={rule.status} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-80 leading-5">
            Yêu cầu phiên bản {rule.version}: {c.enabled ? "bật" : "tắt"} tự
            động.{" "}
            {effective
              ? `Đã xác nhận phiên bản ${effective.version}: ${effective.config.enabled ? "bật" : "tắt"} tự động; ${thresholdText(effective.config, devices)}.`
              : "Chưa có cấu hình được xác nhận."}
            {pending ? " Cấu hình yêu cầu chưa có hiệu lực." : ""}
            {offline
              ? " Bộ điều khiển đang mất kết nối; chưa thể xác định trạng thái thiết bị hiện tại."
              : ""}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="rounded text-left text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring">
              Đồng bộ cuối: {last ? deviceTimestamp(last) : "—"}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-80 leading-5">
            Lần gửi gần nhất:{" "}
            {rule.lastAttemptAt ? deviceTimestamp(rule.lastAttemptAt) : "—"}.
            Xác nhận thành công gần nhất:{" "}
            {rule.lastAcknowledgedAt
              ? deviceTimestamp(rule.lastAcknowledgedAt)
              : "—"}
            . Gửi cấu hình không đồng nghĩa đã có hiệu lực.
          </TooltipContent>
        </Tooltip>
        {["failed", "offline"].includes(rule.status) && (
          <Button
            className="ml-auto text-primary"
            size="sm"
            variant="ghost"
            onClick={onRetry}
          >
            <RefreshCw />
            Gửi lại
          </Button>
        )}
      </footer>
      {rule.error && (
        <p role="alert" className="mt-3 text-xs text-red-700 lg:ml-16">
          {rule.error}
        </p>
      )}
    </article>
  );
}
