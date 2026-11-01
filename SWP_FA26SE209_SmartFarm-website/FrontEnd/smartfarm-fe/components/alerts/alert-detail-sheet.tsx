"use client";

import { useState } from "react";
import {
  BellRing,
  CalendarClock,
  CircleCheck,
  Cpu,
  Gauge,
  MapPin,
} from "lucide-react";
import { DevicePanel } from "@/components/devices/device-ui";
import { AlertStatusBadge, SeverityBadge } from "@/components/alerts/alert-ui";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  categoryLabel,
  formatAlertMoment,
  processingMinutes,
  type SmartAlert,
} from "@/lib/alerts";

const staff = ["Minh Anh", "Hoàng Nam", "Thanh Hà", "Nguyễn Minh"];

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string;
  icon?: typeof MapPin;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E2E8E4] bg-[#F9FBFA] p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-[#789281] uppercase">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-[#1F2937]">
        {value || "—"}
      </p>
    </div>
  );
}

export function AlertDetailSheet({
  alert,
  onClose,
  returnFocus,
  onTakeOver,
  onAssign,
  onSaveNote,
  onRequestResolve,
}: {
  alert: SmartAlert;
  onClose: () => void;
  returnFocus: () => void;
  onTakeOver: () => void;
  onAssign: (staffName: string) => void;
  onSaveNote: (note: string) => void;
  onRequestResolve: (note: string) => void;
}) {
  const [assignee, setAssignee] = useState(alert.assignedTo ?? "Minh Anh");
  const [note, setNote] = useState(alert.resolutionNote ?? "");

  const duration = processingMinutes(alert);
  const canHandle = alert.status !== "RESOLVED";

  return (
    <DevicePanel
      title="Chi tiết cảnh báo"
      description={`${alert.id} · Xem sự cố và lịch sử xử lý.`}
      onClose={onClose}
      returnFocus={returnFocus}
      footer={
        alert.status === "UNRESOLVED" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onRequestResolve(note)}>
              Đánh dấu đã giải quyết
            </Button>
            <Button type="button" onClick={onTakeOver}>
              Tiếp nhận
            </Button>
          </>
        ) : alert.status === "IN_PROGRESS" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onSaveNote(note)}>
              Lưu ghi chú xử lý
            </Button>
            <Button type="button" onClick={() => onRequestResolve(note)}>
              Đánh dấu đã giải quyết
            </Button>
          </>
        ) : (
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#E2E8E4] bg-[#F7FAF8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#4F8F68] shadow-sm">
                <BellRing className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[#1F2937]">
                {alert.title}
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">{alert.location}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <SeverityBadge severity={alert.severity} />
              <AlertStatusBadge status={alert.status} />
            </div>
          </div>
        </section>

        <section aria-labelledby="alert-information">
          <h3
            id="alert-information"
            className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#789281] uppercase"
          >
            Thông tin cảnh báo
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="Tên cảnh báo" value={alert.title} icon={BellRing} />
            <DetailItem label="Thời gian phát hiện" value={formatAlertMoment(alert.detectedAt)} icon={CalendarClock} />
            <DetailItem label="Khu vực" value={alert.area ?? alert.location} icon={MapPin} />
            <DetailItem label="Khay" value={alert.tray} icon={MapPin} />
            <DetailItem label="Thiết bị liên quan" value={alert.device} icon={Cpu} />
            <DetailItem label="Nguồn cảnh báo" value={alert.source} icon={Cpu} />
            <DetailItem label="Giá trị hiện tại" value={alert.value} icon={Gauge} />
            <DetailItem label="Ngưỡng cấu hình" value={alert.threshold} icon={Gauge} />
          </div>
          <div className="mt-3 rounded-xl border border-[#E2E8E4] p-4">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#789281] uppercase">
              Mô tả
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              {alert.description}
            </p>
          </div>
        </section>

        {canHandle && (
          <section aria-labelledby="alert-handling" className="space-y-4">
            <h3
              id="alert-handling"
              className="text-xs font-semibold tracking-[0.1em] text-[#789281] uppercase"
            >
              Xử lý cảnh báo
            </h3>
            <div className="space-y-2">
              <label htmlFor="alert-assignee" className="text-sm font-medium text-[#1F2937]">
                Nhân viên phụ trách
              </label>
              <div className="flex gap-2">
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger
                    id="alert-assignee"
                    aria-label="Nhân viên phụ trách"
                    className="h-11 min-w-0 flex-1 rounded-xl border-[#E2E8E4] bg-white shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  disabled={assignee === alert.assignedTo}
                  onClick={() => onAssign(assignee)}
                >
                  Phân công
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="resolution-note" className="text-sm font-medium text-[#1F2937]">
                Ghi chú xử lý
              </label>
              <Textarea
                id="resolution-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Nhập ghi chú xử lý..."
                rows={4}
                className="resize-none rounded-xl border-[#E2E8E4]"
              />
            </div>
          </section>
        )}

        {alert.status === "RESOLVED" && (
          <section aria-labelledby="resolution-summary">
            <h3
              id="resolution-summary"
              className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#789281] uppercase"
            >
              Kết quả xử lý
            </h3>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <div className="min-w-0 space-y-2 text-sm">
                  <p><span className="text-[#6B7280]">Người phụ trách:</span> <strong>{alert.assignedTo ?? "—"}</strong></p>
                  <p><span className="text-[#6B7280]">Thời gian tiếp nhận:</span> {formatAlertMoment(alert.acceptedAt)}</p>
                  <p><span className="text-[#6B7280]">Thời gian giải quyết:</span> {formatAlertMoment(alert.resolvedAt)}</p>
                  <p><span className="text-[#6B7280]">Tổng thời gian xử lý:</span> {duration === undefined ? "—" : `${duration} phút`}</p>
                  <p className="pt-1 leading-6 text-[#4B5563]">{alert.resolutionNote || "Chưa có ghi chú xử lý."}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="processing-history">
          <h3
            id="processing-history"
            className="mb-4 text-xs font-semibold tracking-[0.1em] text-[#789281] uppercase"
          >
            Lịch sử xử lý
          </h3>
          <ol className="space-y-0">
            {alert.history.map((event, index) => (
              <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < alert.history.length - 1 && (
                  <span className="absolute top-5 bottom-0 left-[7px] w-px bg-[#DCE6DF]" aria-hidden="true" />
                )}
                <span className="mt-1.5 size-[15px] shrink-0 rounded-full border-4 border-[#E8F3EB] bg-[#4F8F68]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1F2937]">{event.label}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {formatAlertMoment(event.at)}{event.actor ? ` · ${event.actor}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="rounded-xl border border-[#DCE9E0] bg-[#F3F8F4] px-4 py-3 text-xs leading-5 text-[#526A59]">
          Loại cảnh báo: {categoryLabel[alert.category]}. Thay đổi chỉ được lưu trong phiên demo này.
        </div>
      </div>
    </DevicePanel>
  );
}
