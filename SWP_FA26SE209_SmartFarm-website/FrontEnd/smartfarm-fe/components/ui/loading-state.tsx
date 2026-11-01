import { LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Đang tải dữ liệu...", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground", className)}>
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div role="status" aria-label="Đang tải dữ liệu bảng" className={cn("space-y-3 p-5", className)}>
      <div className="flex gap-4 border-b pb-4">
        {Array.from({ length: columns }, (_, index) => <Skeleton key={`head-${index}`} className="h-3 flex-1" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4 border-b py-3 last:border-0">
          {Array.from({ length: columns }, (_, column) => <Skeleton key={column} className={cn("h-4 flex-1", column === 0 && "max-w-40")} />)}
        </div>
      ))}
      <span className="sr-only">Đang tải dữ liệu...</span>
    </div>
  );
}

export function CardGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Đang tải dữ liệu thẻ" className={cn("grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-3"><Skeleton className="size-11 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          <div className="mt-5 flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-16" /></div>
        </div>
      ))}
      <span className="sr-only">Đang tải dữ liệu...</span>
    </div>
  );
}

export function DashboardSkeleton({ variant }: { variant: "admin" | "staff" }) {
  return (
    <main role="status" aria-label="Đang tải dashboard" className={variant === "admin"
      ? "mx-auto min-h-[calc(100dvh-80px)] w-full max-w-[1700px] space-y-5 bg-white p-4 sm:p-6 lg:p-8"
      : "mx-auto min-h-[calc(100dvh-80px)] max-w-[1700px] space-y-5 bg-[#F7FAF8] p-4 sm:p-6 lg:p-8"}>
      <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-2xl border bg-white p-5"><Skeleton className="size-9 rounded-xl" /><Skeleton className="mt-4 h-8 w-24" /><Skeleton className="mt-3 h-4 w-32" /><Skeleton className="mt-2 h-3 w-40 max-w-full" /></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-5 h-52 w-full" /></div><div className="rounded-2xl border bg-white p-5"><Skeleton className="h-5 w-36" /><div className="mt-5 space-y-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div></div></div>
      <div className="rounded-2xl border bg-white"><TableSkeleton rows={4} columns={variant === "admin" ? 6 : 4} /></div>
      <span className="sr-only">Đang tải dữ liệu dashboard...</span>
    </main>
  );
}

export function CalendarSkeleton() {
  return (
    <main role="status" aria-label="Đang tải lịch công việc" className="min-h-[calc(100dvh-80px)] space-y-5 bg-white p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-72" /></div><Skeleton className="h-9 w-32" /></div>
      <div className="rounded-2xl border bg-white p-5"><div className="mb-5 flex justify-between"><Skeleton className="h-8 w-40" /><Skeleton className="h-8 w-24" /></div><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="h-20 rounded-lg sm:h-28" />)}</div></div>
      <span className="sr-only">Đang tải dữ liệu lịch...</span>
    </main>
  );
}

export function DetailSkeleton() {
  return (
    <main role="status" aria-label="Đang tải chi tiết" className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-72 max-w-full" /><Skeleton className="h-4 w-52" /></div>
      <div className="grid gap-5 lg:grid-cols-2"><div className="space-y-5 rounded-2xl border bg-white p-6"><Skeleton className="h-5 w-36" />{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div><div className="space-y-5 rounded-2xl border bg-white p-6"><Skeleton className="h-5 w-40" />{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div></div>
      <span className="sr-only">Đang tải dữ liệu chi tiết...</span>
    </main>
  );
}
