"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  deviceTypes,
  controllers,
  deviceReading,
  deviceTimestamp,
  type Device,
} from "@/lib/devices";
import { useDevices } from "./devices-provider";
import { Connection, DeviceIcon, DevicePanel } from "./device-ui";
import { CommandControls } from "./command-confirmation";
import { CommandResultBadge } from "./command-log";
export function DeviceDetailSheet({
  id,
  onClose,
  returnFocus,
  onCommand,
  onLog,
}: {
  id: string;
  onClose: () => void;
  returnFocus: () => void;
  onCommand: (d: Device, action: "on" | "off") => void;
  onLog: (id: string) => void;
}) {
  const { devices, commands } = useDevices(),
    d = devices.find((d) => d.id === id)!,
    parent = controllers.find((c) => c.id === d.controllerId)!;
  return (
    <DevicePanel
      title={d.name}
      description="Thông tin và trạng thái thiết bị báo về."
      onClose={onClose}
      returnFocus={returnFocus}
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-2xl bg-muted p-5">
          <DeviceIcon type={d.type} offline={d.connection === "offline"} />
          <div className="space-y-2">
            <p className="font-semibold">
              {d.id} · {deviceTypes[d.type]}
            </p>
            <Connection value={d.connection} />
          </div>
        </div>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-5">
            <dt className="text-muted-foreground">Vị trí</dt>
            <dd>
              Khu {d.area} · {d.location}
            </dd>
          </div>
          <div className="flex justify-between gap-5">
            <dt className="text-muted-foreground">Bộ điều khiển</dt>
            <dd className="space-y-2 text-right">
              <p>Khu {parent.area}</p>
              <Connection value={parent.connection} />
            </dd>
          </div>
          <div className="flex justify-between gap-5">
            <dt className="text-muted-foreground">Trạng thái báo về</dt>
            <dd className="font-semibold">{deviceReading(d)}</dd>
          </div>
          <div className="flex justify-between gap-5">
            <dt className="text-muted-foreground">Liên lạc cuối</dt>
            <dd>{deviceTimestamp(d.lastContact)}</dd>
          </div>
          {d.group === "sensor" && (
            <div className="flex justify-between gap-5">
              <dt className="text-muted-foreground">Độ mới số đo</dt>
              <dd>
                {!d.reading || d.connection !== "online"
                  ? "Không có dữ liệu"
                  : d.reading.freshness === "stale"
                    ? "Dữ liệu cũ"
                    : "Hiện tại"}
              </dd>
            </div>
          )}
        </dl>
        {d.notes && <p className="text-sm text-muted-foreground">{d.notes}</p>}
        {d.group === "sensor" ? (
          <Button variant="outline" asChild>
            <Link
              href={`/admin/iot?device=${encodeURIComponent(d.id)}`}
              onClick={onClose}
            >
              Giám sát môi trường
            </Link>
          </Button>
        ) : (
          <>
            <section className="space-y-3 border-t pt-5">
              <h3 className="font-semibold">Điều khiển thiết bị</h3>
              <div className="flex gap-2">
                <CommandControls device={d} onCommand={onCommand} />
              </div>
              {d.reported === "unknown" && (
                <p className="text-xs text-muted-foreground">
                  Chưa nhận được trạng thái bật/tắt xác nhận.
                </p>
              )}
              {d.automatic && (
                <p className="text-sm text-muted-foreground">
                  Thiết bị do quy tắc tự động quản lý. Chưa có quy tắc ghi đè
                  thủ công; không gửi lệnh và không thay đổi tự động hóa tại
                  đây.
                </p>
              )}
            </section>
            <section className="space-y-3 border-t pt-5">
              <h3 className="font-semibold">Lệnh gần đây</h3>
              {commands
                .filter((c) => c.deviceId === id)
                .slice(0, 5)
                .map((c) => (
                  <button
                    key={c.id}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onLog(c.id)}
                  >
                    <span>
                      {c.requested === "on" ? "Bật" : "Tắt"} ·{" "}
                      {deviceTimestamp(c.at)}
                    </span>
                    <CommandResultBadge result={c.result} />
                  </button>
                ))}
              {!commands.some((c) => c.deviceId === id) && (
                <p className="text-sm text-muted-foreground">
                  Chưa có lệnh điều khiển.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </DevicePanel>
  );
}
