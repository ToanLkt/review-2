"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadReferenceOptions, type ReferenceKind, type ReferenceOption } from "@/lib/api/staff/staff-reference-options";

export function StaffReferenceSelect({ kind, value, onChange, label, optional = false, orderId, disabled = false }: {
  kind: ReferenceKind; value: string; onChange: (value: string, option?: ReferenceOption) => void;
  label: string; optional?: boolean; orderId?: string; disabled?: boolean;
}) {
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (kind === "user" || kind === "staff" || kind === "payment") return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); setOptions([]); } });
    loadReferenceOptions(kind, orderId).then(items => { if (!cancelled) setOptions(items); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind, orderId, retry]);
  // Backend exposes actions accepting these IDs but has no Staff lookup endpoints for them.
  if (kind === "user" || kind === "staff" || kind === "payment") {
    return <div className="space-y-1"><Input type="number" min={1} step={1} aria-label={label} placeholder={`Nhập ID ${label.toLocaleLowerCase("vi")}`} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /><p className="text-xs text-muted-foreground">Nhập ID từ hồ sơ hoặc bản ghi tương ứng.</p></div>;
  }
  const knownValue = options.some(option => option.value === value);
  return <div className="min-w-44 space-y-1">
    <Select value={knownValue ? value : ""} disabled={disabled || loading || !!error} onValueChange={next => {
      const id = next === "none" ? "" : next;
      onChange(id, options.find(option => option.value === id));
    }}>
      <SelectTrigger aria-label={label} className="w-full"><SelectValue placeholder={loading ? "Đang tải..." : `Chọn ${label.toLocaleLowerCase("vi")}`} /></SelectTrigger>
      <SelectContent>{optional && <SelectItem value="none">Không chọn / tất cả</SelectItem>}{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
    {error ? <div role="alert" className="text-xs text-destructive">{error} <Button type="button" size="sm" variant="link" onClick={() => setRetry(x => x + 1)}>Thử lại</Button></div>
      : !loading && !options.length ? <p className="text-xs text-muted-foreground">Không có {label.toLocaleLowerCase("vi")} phù hợp.</p>
      : !loading && value && !knownValue ? <p className="text-xs text-destructive">Lựa chọn cũ không còn khả dụng. Vui lòng chọn lại.</p> : null}
  </div>;
}
