"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/components/settings/settings-ui";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { ActuatorLog, Paged } from "@/lib/api/staff/staff-iot-service";
import { dateTime } from "@/lib/formatters";

export function OperationLog() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<ActuatorLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setResult(await staffIoTService.logs({ page, pageSize: 20 })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải nhật ký điều khiển."); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { const id = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(id); }, [load]);

  return <SettingsCard title="Nhật ký điều khiển thiết bị" description="Xem các lệnh điều khiển thiết bị và kết quả thực hiện.">
    {error ? <p role="alert" className="p-6 text-sm text-red-600">{error}</p> : loading ? <p className="p-6 text-sm text-muted-foreground">Đang tải nhật ký...</p> : !result?.items.length ? <p className="p-6 text-sm text-muted-foreground">Chưa có lệnh điều khiển nào.</p> : <div className="divide-y">{result.items.map((log) => <div key={log.logId} className="flex flex-wrap justify-between gap-3 px-5 py-4 text-sm"><div><p className="font-medium">Thiết bị #{log.deviceId} · {log.actuatorType} {log.action}</p><p className="mt-1 text-xs text-muted-foreground">{dateTime(log.requestedAt)} · {log.triggeredBy}</p></div><span className="font-medium">{log.result}</span></div>)}</div>}
    {result && result.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t p-5"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span className="text-sm">{page}/{result.totalPages}</span><Button variant="outline" disabled={loading || page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></div>}
  </SettingsCard>;
}
