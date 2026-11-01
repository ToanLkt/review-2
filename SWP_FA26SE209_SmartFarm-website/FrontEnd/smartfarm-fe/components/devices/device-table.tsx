"use client";
import { useState } from "react";
import { Search, Eye, Wifi, WifiOff } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Choice } from "@/components/operations/shared/ui";
import {
  deviceTypes,
  sensorTypes,
  actuatorTypes,
  controllers,
  deviceReading,
  deviceTimestamp,
  normalizeDeviceText,
  type Device,
} from "@/lib/devices";
import { useDevices } from "./devices-provider";
import {
  Connection,
  DeviceIcon,
  DevicePagination,
  tableHead,
} from "./device-ui";
import { CommandControls } from "./command-confirmation";
export function DeviceTable({
  group,
  onView,
  onCommand,
}: {
  group: Device["group"];
  onView: (d: Device) => void;
  onCommand: (d: Device, action: "on" | "off") => void;
}) {
  const { devices } = useDevices();
  const [query, setQuery] = useState(""),
    [area, setArea] = useState(""),
    [type, setType] = useState(""),
    [connection, setConnection] = useState(""),
    [page, setPage] = useState(1);
  const rows = devices.filter(
    (d) =>
      d.group === group &&
      (!area || d.area === area) &&
      (!type || d.type === type) &&
      (!connection || d.connection === connection) &&
      normalizeDeviceText(`${d.name} ${d.id}`).includes(
        normalizeDeviceText(query),
      ),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };
  return (
    <>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1.4fr)_1fr_1fr_1fr] xl:p-6">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-[#8BAA97]" />
          <Input
            aria-label="Tìm tên, mã thiết bị"
            placeholder="Tìm tên, mã thiết bị..."
            value={query}
            onChange={(e) => change(setQuery)(e.target.value)}
            className="pl-9"
          />
        </div>
        <Choice
          label="Lọc khu vực"
          value={area}
          onChange={change(setArea)}
          options={[
            { value: "", label: "Tất cả khu vực" },
            ...["A", "B", "C"].map((v) => ({ value: v, label: `Khu ${v}` })),
          ]}
        />
        <Choice
          label="Lọc loại thiết bị"
          value={type}
          onChange={change(setType)}
          options={[
            { value: "", label: "Tất cả loại" },
            ...(group === "sensor" ? sensorTypes : actuatorTypes).map((v) => ({
              value: v,
              label: deviceTypes[v],
            })),
          ]}
        />
        <Choice
          label="Lọc kết nối"
          value={connection}
          onChange={change(setConnection)}
          options={[
            { value: "", label: "Tất cả kết nối" },
            { value: "online", label: "Trực tuyến" },
            { value: "offline", label: "Mất kết nối" },
            ...(devices.some((d) => d.connection === "unregistered")
              ? [{ value: "unregistered", label: "Chưa kết nối" }]
              : []),
          ]}
        />
      </div>
      <Table className="min-w-[1100px] text-xs">
        <TableHeader className={tableHead}>
          <TableRow>
            {[
              "THIẾT BỊ",
              "MÃ THIẾT BỊ",
              "VỊ TRÍ",
              "Bộ điều khiển",
              "KẾT NỐI",
              "TRẠNG THÁI THIẾT BỊ BÁO VỀ",
              "LIÊN LẠC CUỐI",
            ].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
            <TableHead>
              <span className="sr-only">Thao tác</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice((currentPage - 1) * 10, currentPage * 10).map((d) => {
            const parent = controllers.find((c) => c.id === d.controllerId)!,
              Icon = parent.connection === "online" ? Wifi : WifiOff;
            return (
              <TableRow
                key={d.id}
                className="hover:bg-[#F3F8F4] [&_td]:px-5 [&_td]:py-5"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <DeviceIcon
                      type={d.type}
                      offline={d.connection === "offline"}
                    />
                    <span className="max-w-44 whitespace-normal font-semibold leading-5">
                      {d.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.id}</TableCell>
                <TableCell className="text-muted-foreground">
                  Khu {d.area} · {d.location}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 ${parent.connection === "offline" ? "text-red-600" : "text-muted-foreground"}`}
                  >
                    <Icon className="size-4" />
                    Khu {parent.area}
                  </span>
                </TableCell>
                <TableCell>
                  <Connection value={d.connection} />
                </TableCell>
                <TableCell>
                  <span
                    className={
                      d.connection === "offline"
                        ? "text-red-600"
                        : "font-medium"
                    }
                  >
                    {deviceReading(d)}
                  </span>
                  {d.reading?.freshness === "stale" &&
                    d.connection === "online" && (
                      <span className="mt-1 block text-[10px] text-amber-700">
                        Dữ liệu cũ
                      </span>
                    )}
                </TableCell>
                <TableCell
                  className={
                    d.connection === "offline"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }
                >
                  {deviceTimestamp(d.lastContact)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      aria-label={`Xem ${d.name}`}
                      onClick={() => onView(d)}
                    >
                      <Eye />
                      Xem
                    </Button>
                    {group === "actuator" && (
                      <CommandControls device={d} onCommand={onCommand} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-14 text-center text-muted-foreground"
              >
                Không tìm thấy thiết bị phù hợp.
                <Button
                  variant="link"
                  onClick={() => {
                    setQuery("");
                    setArea("");
                    setType("");
                    setConnection("");
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DevicePagination
        total={rows.length}
        page={currentPage}
        onPage={setPage}
      />
    </>
  );
}
