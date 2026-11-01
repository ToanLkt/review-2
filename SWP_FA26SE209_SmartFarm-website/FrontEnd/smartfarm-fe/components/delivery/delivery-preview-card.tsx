import { AlertTriangle, CheckCircle2, HelpCircle, LoaderCircle, RefreshCw } from "lucide-react";
import type { DeliveryPreview } from "@/lib/api";

export function DeliveryPreviewCard({ preview, loading, error, accepted, onAcceptedChange, onRetry }: {
  preview: DeliveryPreview | null;
  loading: boolean;
  error: string;
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
  onRetry: () => void;
}) {
  if (loading) return <div role="status" className="flex items-center gap-2 rounded-xl bg-[#f3f8f4] p-4 text-sm text-[#5f6d63]"><LoaderCircle size={17} className="animate-spin" />Đang kiểm tra phạm vi giao hàng...</div>;
  if (error) return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4"><p role="alert" className="text-sm leading-6 text-[#b91c1c]">{error}</p><button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#8f312b] ring-1 ring-red-200 transition hover:bg-red-50 active:scale-[0.98]"><RefreshCw size={14} />Thử lại</button></div>;
  if (!preview) return <div className="flex gap-3 rounded-xl border border-dashed border-[#d9dfd7] p-4 text-sm leading-6 text-[#6b7280]"><HelpCircle size={18} className="mt-0.5 shrink-0" /><span>Đặt ghim và xác nhận vị trí để xem khoảng cách giao hàng.</span></div>;

  const distanceKm = preview.distanceKm;
  const distanceUnknown = distanceKm === null;
  const distance = distanceKm === null ? "Chưa xác định được khoảng cách" : `${distanceKm.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km`;
  return <div className={`rounded-xl border p-4 ${distanceUnknown ? "border-slate-200 bg-slate-50" : preview.isOutOfRange ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
    <div className="flex gap-3">
      {distanceUnknown ? <HelpCircle size={19} className="mt-0.5 shrink-0 text-slate-600" /> : preview.isOutOfRange ? <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-700" />}
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-[#19382b]">{distanceUnknown ? "Chưa xác định được phạm vi giao hàng" : preview.isOutOfRange ? "Ngoài phạm vi giao hàng tiêu chuẩn" : "Trong phạm vi giao hàng"}</p>
        <dl className="mt-2 grid gap-2 text-xs text-[#5f6d63] sm:grid-cols-2"><div><dt>Khoảng cách</dt><dd className="mt-0.5 font-semibold text-[#19382b]">{distance}</dd></div><div><dt>Bán kính tối đa</dt><dd className="mt-0.5 font-semibold text-[#19382b]">{preview.maxRadiusKm.toLocaleString("vi-VN")} km</dd></div></dl>
      </div>
    </div>
    {preview.requiresAcceptance && <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-amber-200 pt-4 text-sm leading-6 text-amber-900"><input type="checkbox" checked={accepted} onChange={(event) => onAcceptedChange(event.target.checked)} className="mt-1 size-4 accent-[#4F8F68]" /><span>Đồng ý với điều khoản giao hàng khi ở xa.</span></label>}
  </div>;
}
