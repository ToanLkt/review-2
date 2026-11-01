import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportKpi({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <article className="rounded-2xl border bg-white px-5 py-5 shadow-[0_1px_3px_#244a3004] sm:px-6">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-3 text-[28px] font-bold leading-tight tracking-tight tabular-nums text-[#1F2937]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </article>
  );
}

export function ReportNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-primary/15 bg-[#F3F8F4] px-4 py-3.5 text-xs leading-5 text-[#587363]">
      <CircleAlert
        className="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p>{children}</p>
    </aside>
  );
}

export const reportTableHeader =
  "bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:tracking-[.04em] [&_th]:text-[#809E8A] [&_th]:whitespace-normal";

export function EmptyReport({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
