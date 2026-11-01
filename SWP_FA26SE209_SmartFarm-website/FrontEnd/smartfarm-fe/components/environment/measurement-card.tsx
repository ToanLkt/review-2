import { Clock, Droplets, Sun, Thermometer, WifiOff, Wind } from "lucide-react";
import { MeasurementStatusBadge } from "./measurement-status-badge";
import {
  measurementStatus,
  measurementValue,
  metricLabels,
  type Measurement,
  type EnvironmentDevice,
  type MeasurementLocation,
} from "@/lib/environment";
import { dateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
const icons = {
  temperature: Thermometer,
  airHumidity: Wind,
  soilMoisture: Droplets,
  light: Sun,
  waterLevel: Droplets,
};
const accents = {
  temperature: "text-red-500",
  airHumidity: "text-blue-500",
  soilMoisture: "text-primary",
  light: "text-orange-500",
  waterLevel: "text-cyan-600",
};
export function MeasurementCard({
  measurement,
  device,
  location,
  layout = "grid",
}: {
  measurement: Measurement;
  device: EnvironmentDevice;
  location: MeasurementLocation;
  layout?: "grid" | "list";
}) {
  const status = measurementStatus(measurement, device),
    Icon = icons[measurement.metric];
  const timestamp = dateTime(measurement.updatedAt);
  const place = location.areaName + " · " + location.name;
  return (
    <article
      aria-label={metricLabels[measurement.metric] + " — " + location.areaName}
      className={cn(
        "min-w-0 rounded-2xl border bg-white p-5 shadow-[0_1px_4px_#244a3004]",
        layout === "grid"
          ? "flex flex-col xl:p-6"
          : "lg:grid lg:grid-cols-[minmax(240px,.9fr)_minmax(180px,.5fr)_minmax(360px,1.3fr)] lg:items-center lg:gap-6",
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className={
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] " +
            (status === "offline"
              ? "text-slate-400"
              : accents[measurement.metric])
          }
        >
          <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-6">
            {metricLabels[measurement.metric]}
          </h2>
          <p className="mt-1 text-xs text-[#6F8D7B]">{place}</p>
        </div>
        <MeasurementStatusBadge status={status} />
      </header>
      <div
        className={cn(
          "flex-1 py-6",
          layout === "grid" ? "min-h-32" : "min-h-0 lg:py-0",
        )}
      >
        <p className="text-[32px] font-bold leading-tight tracking-tight tabular-nums">
          {measurementValue(measurement, device)}
        </p>
        {status === "stale" && (
          <p className="mt-2 text-xs leading-5 text-amber-700">
            Dữ liệu cũ — có thể không phản ánh giá trị hiện tại
          </p>
        )}
        {(status === "offline" ||
          (measurement.value === null && !measurement.levelState)) && (
          <p className="mt-2 text-xs text-red-600">Không có dữ liệu</p>
        )}
      </div>
      <dl
        className={cn(
          "space-y-3 border-t pt-4 text-xs leading-5",
          layout === "list" && "lg:border-t-0 lg:border-l lg:py-1 lg:pl-6",
        )}
      >
        {[
          ["Cảm biến nguồn", device.name],
          ["Mã cảm biến", device.id],
          ["Khu vực / vị trí đo", place],
        ].map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3"
          >
            <dt className="text-[#6F8D7B]">{label}</dt>
            <dd className="break-words text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
          <dt className="text-[#6F8D7B]">Cập nhật cuối</dt>
          <dd
            className={
              "flex flex-wrap items-center justify-end gap-1.5 text-right " +
              (status === "offline" ? "text-red-600" : "text-muted-foreground")
            }
          >
            {status === "offline" ? (
              <WifiOff className="size-3.5" aria-hidden="true" />
            ) : (
              <Clock className="size-3.5" aria-hidden="true" />
            )}
            <time dateTime={measurement.updatedAt}>{timestamp}</time>
          </dd>
        </div>
      </dl>
    </article>
  );
}
