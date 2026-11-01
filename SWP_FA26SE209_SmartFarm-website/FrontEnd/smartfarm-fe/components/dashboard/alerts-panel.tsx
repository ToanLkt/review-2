"use client";
import { useState } from "react";
import {
  TriangleAlert,
  WifiOff,
  Droplets,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useLiveDashboard } from "./live-dashboard-provider";
import { DetailField, Status } from "./shared";
import { stamp, time } from "@/lib/formatters";
import type { FarmAlert } from "@/lib/types";
export function AlertsPanel({ alerts }: { alerts: FarmAlert[] }) {
  const { resolveAlert } = useLiveDashboard();
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const active = alerts.filter((a) => a.status !== "Đã giải quyết");
  const alert = alerts.find((a) => a.id === selected);
  return (
    <>
      <Card className="section-card">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="section-title">Cảnh báo cần xử lý</h2>
            <p className="subtle mt-1">Ưu tiên kiểm tra và khắc phục</p>
          </div>
          <Badge className="status-amber rounded-full">{active.length}</Badge>
        </div>
        <div className="space-y-3 px-5 pb-5">
          {active.length === 0 && (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-primary">
              <CheckCircle2 />
              <p className="text-sm">Không có cảnh báo cần xử lý</p>
            </div>
          )}
          {active.map((a) => {
            const Icon = a.title.includes("kết nối")
              ? WifiOff
              : a.title.includes("nước")
                ? Droplets
                : TriangleAlert;
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-3.5 ${a.severity === "error" ? "border-red-100 bg-red-50/40" : "border-amber-100 bg-amber-50/30"}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 rounded-lg p-2 ${a.severity === "error" ? "bg-red-100/60 text-red-500" : "bg-amber-100/60 text-amber-600"}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h3 className="text-xs font-semibold">{a.title}</h3>
                      <span className="text-[9px] text-muted-foreground">
                        {time(a.detected)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {a.area} · {a.reading}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        className={`text-[9px] ${a.severity === "error" ? "status-red" : "status-amber"}`}
                      >
                        {a.status === "Đang xử lý"
                          ? "Đang xử lý"
                          : a.severity === "error"
                            ? "Ưu tiên cao"
                            : "Cần kiểm tra"}
                      </Badge>
                      <button
                        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setSelected(a.id);
                          setNotes(a.notes);
                        }}
                        aria-label={`Chi tiết cảnh báo ${a.title}`}
                      >
                        Chi tiết
                        <ArrowUpRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="subtle mt-auto border-t px-5 py-3">
          Cảnh báo được cập nhật từ hệ thống.
        </p>
      </Card>
      <Sheet open={!!alert} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{alert?.title}</SheetTitle>
            <SheetDescription>
              Chi tiết cảnh báo · {alert?.id}
            </SheetDescription>
          </SheetHeader>
          {alert && (
            <div className="px-6 pb-8">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {alert.description}
              </p>
              <dl>
                <DetailField label="Khu vực và thiết bị">
                  {alert.area} · {alert.device}
                </DetailField>
                <DetailField label="Giá trị ghi nhận">
                  {alert.reading}
                </DetailField>
                {alert.threshold && (
                  <DetailField label="Ngưỡng cấu hình">
                    {alert.threshold}
                  </DetailField>
                )}
                <DetailField label="Thời điểm phát hiện">
                  {stamp(alert.detected)}
                </DetailField>
                <DetailField label="Trạng thái xử lý">
                  <Status>{alert.status}</Status>
                </DetailField>
                <DetailField label="Người phụ trách">
                  {alert.assignee}
                </DetailField>
              </dl>
              <label
                htmlFor="alert-notes"
                className="mt-5 mb-2 block text-xs font-medium"
              >
                Ghi chú xử lý
              </label>
              <textarea
                id="alert-notes"
                value={notes}
                maxLength={1000}
                disabled
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-28 w-full rounded-lg border p-3 text-sm"
                placeholder="Nhập kết quả kiểm tra hoặc hướng xử lý..."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled
                  title="Chưa thể lưu ghi chú"
                >
                  Lưu ghi chú
                </Button>
                <Button
                  variant="outline"
                  disabled
                  title="Chưa thể tiếp nhận cảnh báo"
                >
                  Tiếp nhận
                </Button>
                <Button
                  disabled={alert.status === "Đã giải quyết"}
                  onClick={() => void resolveAlert(alert.id)}
                >
                  Đánh dấu đã giải quyết
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
