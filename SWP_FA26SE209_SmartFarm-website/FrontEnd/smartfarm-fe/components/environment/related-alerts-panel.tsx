import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { LiveEnvironmentAlert } from "@/lib/api/staff/environment-service";
import { dateTime } from "@/lib/formatters";
export function RelatedAlertsPanel({ alerts }: { alerts: LiveEnvironmentAlert[] }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_4px_#244a3004] sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Cảnh báo liên quan</h2>
        <span
          aria-label={alerts.length + " cảnh báo"}
          className="flex size-6 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-red-600"
        >
          {alerts.length}
        </span>
      </header>
      <div className="flex-1 space-y-3">
        {alerts.map((alert) => {
          return (
            <article
              key={alert.id}
              className={
                "flex items-start gap-3 rounded-xl border p-4 " +
                (alert.severity === "warning"
                  ? "border-amber-200/70 bg-amber-50/70"
                  : "border-red-200/70 bg-red-50/70")
              }
            >
              <TriangleAlert
                aria-hidden="true"
                className={
                  "mt-0.5 size-4 shrink-0 " +
                  (alert.severity === "warning"
                    ? "text-amber-600"
                    : "text-red-500")
                }
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{alert.title}</h3>
                <p className="mt-1.5 break-words text-xs leading-5 text-muted-foreground">
                  {alert.location} · {alert.deviceCode}
                </p>
              </div>
              <time
                dateTime={alert.at}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {dateTime(alert.at)}
              </time>
            </article>
          );
        })}
        {!alerts.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có cảnh báo liên quan.
          </p>
        )}
      </div>
      <footer className="mt-5 flex justify-end border-t pt-4">
        <Link
          href="/admin/alerts"
          className="inline-flex items-center gap-2 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Xem tất cả cảnh báo
          <ArrowRight className="size-4" />
        </Link>
      </footer>
    </section>
  );
}
