"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { measurementStatus } from "@/lib/environment";
import { loadEnvironment, type EnvironmentSnapshot } from "@/lib/api/staff/environment-service";
import { EnvironmentFilters } from "./environment-filters";
import { MeasurementCard } from "./measurement-card";
import { RelatedAlertsPanel } from "./related-alerts-panel";
import { AreaConnectivityPanel } from "./area-connectivity-panel";

const empty: EnvironmentSnapshot = { devices: [], locations: [], measurements: [], alerts: [], areas: [] };
const environmentRefreshMs = 5_000;

export function EnvironmentPage() {
  const [area, setArea] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [snapshot, setSnapshot] = useState<EnvironmentSnapshot>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useSearchParams(), router = useRouter();
  const device = params.get("device") ?? "";
  const reload = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try { setSnapshot(await loadEnvironment()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu môi trường."); }
    finally { if (showLoading) setLoading(false); }
  }, []);
  useEffect(() => {
    const initialTimer = window.setTimeout(() => { void reload(); }, 0);
    const timer = window.setInterval(() => { void reload(false); }, environmentRefreshMs);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [reload]);

  const locationById = new Map(snapshot.locations.map((location) => [location.id, location]));
  const devices = snapshot.devices.filter((item) => !area || locationById.get(item.locationId)?.areaId === area);
  const selected = devices.some((item) => item.id === device) ? device : "";
  const visibleDevices = selected ? devices.filter((item) => item.id === selected) : devices;
  const visibleIds = new Set(visibleDevices.map((item) => item.id));
  const measurements = snapshot.measurements.filter((item) => visibleIds.has(item.deviceId));
  const counts = { current: 0, stale: 0, offline: 0 };
  for (const measurement of measurements) {
    const source = visibleDevices.find((item) => item.id === measurement.deviceId);
    if (source) counts[measurementStatus(measurement, source)]++;
  }
  const visibleAreas = snapshot.areas.filter((item) => !area || item.id === area);
  const alerts = snapshot.alerts.filter((item) => visibleIds.has(item.deviceCode));

  function setDevice(next: string) {
    const query = new URLSearchParams(params.toString());
    if (next) query.set("device", next); else query.delete("device");
    router.replace(`/admin/iot?${query}`, { scroll: false });
  }
  function changeArea(next: string) {
    setArea(next);
    if (!snapshot.devices.some((item) => item.id === device && (!next || locationById.get(item.locationId)?.areaId === next))) setDevice("");
  }
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-6 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header className="pb-2"><h1 className="text-[26px] font-bold tracking-tight">Giám sát môi trường</h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">Nhiệt độ, độ ẩm không khí, độ ẩm đất, ánh sáng và mực nước theo thiết bị và khay.</p>
        </header>
        {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải dữ liệu môi trường...</p>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <Button variant="outline" size="sm" onClick={() => void reload()}>Thử lại</Button></div>}
        {!loading && !error && <>
          <EnvironmentFilters area={area} device={selected} devices={devices} areas={snapshot.areas} counts={counts}
            onAreaChange={changeArea} onDeviceChange={setDevice} layout={layout} onLayoutChange={setLayout} />
          <aside className="flex items-start gap-3 rounded-xl bg-[#E8F3EB] px-5 py-4 text-sm leading-6 text-[#3F7655]">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
            <p>Chỉ số mới nhất được ghi nhận từ thiết bị gắn với khay. Thiết bị chưa gửi telemetry sẽ chưa có thẻ chỉ số.</p>
          </aside>
          <section aria-label="Chỉ số môi trường" className={layout === "grid" ? "grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
            {measurements.map((measurement) => {
              const source = visibleDevices.find((item) => item.id === measurement.deviceId);
              const location = source && locationById.get(source.locationId);
              return source && location ? <MeasurementCard key={measurement.id} measurement={measurement} device={source} location={location} layout={layout} /> : null;
            })}
          </section>
          {!measurements.length && <p role="status" className="rounded-2xl border py-12 text-center text-sm text-muted-foreground">Chưa có chỉ số môi trường phù hợp.</p>}
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <RelatedAlertsPanel alerts={alerts} />
            <AreaConnectivityPanel areas={visibleAreas} deviceSelected={!!selected} />
          </div>
        </>}
      </div>
    </main>
  );
}
