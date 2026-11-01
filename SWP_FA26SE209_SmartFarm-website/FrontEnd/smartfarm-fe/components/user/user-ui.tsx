import Link from "next/link";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold tracking-tight text-[#1a2e1f] md:text-4xl">{title}</h1>{subtitle && <p className="mt-2 text-sm leading-6 text-[#6b7280]">{subtitle}</p>}</div>{action}</div>;
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Đường dẫn" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[#9ca3af]">{items.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href} className="hover:text-[#4F8F68]">{item.label}</Link> : <span className="font-medium text-[#1a2e1f]">{item.label}</span>}</span>)}</nav>;
}

const badgeClasses: Record<string, string> = {
  green: "bg-[#E8F3EB] text-[#3F7655]",
  blue: "bg-blue-50 text-[#3B82F6]",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-[#EF5350]",
  purple: "bg-purple-50 text-purple-700",
};

export function StatusBadge({ children, tone = "green" }: { children: React.ReactNode; tone?: keyof typeof badgeClasses }) {
  return <span className={`inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${badgeClasses[tone]}`}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, value));
  return <div className="h-2 overflow-hidden rounded-full bg-[#e8f3eb]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#4F8F68]" style={{ width: `${percent}%` }} /></div>;
}

export function QuantityStepper({ value, onChange, size = "normal" }: { value: number; onChange: (next: number) => void; size?: "normal" | "large" }) {
  const buttonSize = size === "large" ? "size-11" : "size-8";
  return <div className="inline-flex items-center gap-3"><button type="button" aria-label="Giảm số lượng" disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))} className={`${buttonSize} flex items-center justify-center rounded-lg border border-[#e8f3eb] bg-white text-[#4F8F68] disabled:opacity-40`}><Minus size={16} /></button><span className={`min-w-8 text-center font-bold tabular-nums ${size === "large" ? "text-4xl" : "text-sm"}`}>{value}</span><button type="button" aria-label="Tăng số lượng" onClick={() => onChange(value + 1)} className={`${buttonSize} flex items-center justify-center rounded-lg border border-[#e8f3eb] bg-white text-[#4F8F68]`}><Plus size={16} /></button></div>;
}

export function UserImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`object-cover ${className}`} />;
}
