import type { ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { rentalSteps, seedSteps, type Processing } from "@/lib/orders";
export function OrderBadge({ children }: { children: ReactNode }) {
  const text = String(children),
    style =
      text === "Thuê khay"
        ? "bg-violet-50 text-violet-700"
        : text === "Hạt giống"
          ? "bg-blue-50 text-blue-700"
          : ["Đã xác nhận", "Hoàn tất", "Đã giao"].includes(text)
            ? "bg-green-50 text-green-700"
            : text.includes("thất bại") || text === "Đã hủy"
              ? "bg-red-50 text-red-600"
              : text.includes("Chờ") || text === "Sẵn sàng thu hoạch"
                ? "bg-amber-50 text-amber-700"
                : text === "Đã hoàn tiền"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-blue-50 text-blue-700";
  return (
    <Badge
      variant="outline"
      className={
        style + " border-transparent text-[11px] font-medium whitespace-normal"
      }
    >
      {children}
    </Badge>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-[#809E8A]">
        {title}
      </h3>
      {children}
    </section>
  );
}
export function Note({
  children,
  warm = false,
}: {
  children: ReactNode;
  warm?: boolean;
}) {
  return (
    <div
      className={
        "flex gap-2 rounded-xl border p-3 text-xs leading-5 " +
        (warm
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[#D4E5DA] bg-[#F3F8F4] text-[#4B6053]")
      }
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
export function ProcessingTimeline({
  kind,
  status,
}: {
  kind: string;
  status: Processing;
}) {
  const steps = kind === "rental" ? rentalSteps : seedSteps;
  const current = steps.findIndex((s) => s === status);
  if (status === "Đã hủy") return <OrderBadge>Đã hủy</OrderBadge>;
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={
                "absolute top-7 bottom-0 left-3 w-px " +
                (i < current ? "bg-primary/40" : "bg-border")
              }
            />
          )}
          <span
            className={
              "relative flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] " +
              (i <= current
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground")
            }
          >
            {i < current || status === "Hoàn tất" ? (
              <Check className="size-3.5" />
            ) : (
              i + 1
            )}
          </span>
          <div>
            <p
              className={
                "pt-0.5 text-xs " +
                (i === current
                  ? "font-semibold text-primary"
                  : i < current
                    ? "text-foreground"
                    : "text-muted-foreground")
              }
            >
              {s}
            </p>
            {i === current && (
              <p className="mt-1 text-[10px] text-[#809E8A]">
                Trạng thái xử lý hiện tại
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
