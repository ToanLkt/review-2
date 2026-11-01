import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SummaryCard({
  value,
  label,
  support,
  color = "text-[#88A893]",
  valueClassName,
  href,
}: {
  value: ReactNode;
  label: string;
  support: string;
  color?: string;
  valueClassName?: string;
  href?: string;
}) {
  const content = (
    <>
      <div
        className={cn(
          "text-[30px] font-bold leading-tight tracking-tight tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </div>
      <h2 className="mt-2 text-sm font-medium text-muted-foreground">
        {label}
      </h2>
      <p className={cn("mt-2 text-xs font-medium", color)}>{support}</p>
    </>
  );
  const className =
    "min-w-0 rounded-2xl border bg-white px-6 py-6 shadow-[0_1px_3px_#244a3004]";
  return href ? (
    <Link
      href={href}
      aria-label={`${label}: ${typeof value === "string" ? value : "xem chi tiết"}`}
      className={cn(
        className,
        "block transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
