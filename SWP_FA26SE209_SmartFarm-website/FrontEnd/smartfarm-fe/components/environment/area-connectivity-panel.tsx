import { Wifi, WifiOff } from "lucide-react";
import { time } from "@/lib/formatters";
export function AreaConnectivityPanel({
  areas,
  deviceSelected,
}: {
  areas: {
    id: string;
    name: string;
    total: number;
    online: number;
    offline: number;
    stale: number;
    lastReceived?: string;
  }[];
  deviceSelected: boolean;
}) {
  return (
    <section className="min-w-0 rounded-2xl border bg-white p-5 shadow-[0_1px_4px_#244a3004] sm:p-6">
      <h2 className="text-base font-semibold">
        Trạng thái kết nối theo khu vực
      </h2>
      {deviceSelected && (
        <p className="mt-2 text-xs text-muted-foreground">
          Tổng cảm biến của toàn khu vực
        </p>
      )}
      <div className="mt-4 divide-y">
        {areas.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 py-5"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{a.name}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {a.total > 0 && a.offline === a.total
                  ? `${a.offline} cảm biến mất kết nối${a.lastReceived ? ` từ ${time(a.lastReceived)}` : ""}`
                  : `${a.online}/${a.total} cảm biến trực tuyến${a.stale ? ` · ${a.stale} dữ liệu cũ` : ""}`}
              </p>
            </div>
            <span
              className={
                "inline-flex shrink-0 items-center gap-2 text-xs font-medium " +
                (a.offline ? "text-red-600" : "text-primary")
              }
            >
              {a.offline ? (
                <WifiOff className="size-4" aria-hidden="true" />
              ) : (
                <Wifi className="size-4" aria-hidden="true" />
              )}
              {a.offline ? "Mất kết nối" : "Trực tuyến"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
