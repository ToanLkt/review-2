"use client";
import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Choice } from "@/components/operations/shared/ui";
import {
  deviceTimestamp,
  resultLabels,
  normalizeDeviceText,
  type DeviceCommand,
} from "@/lib/devices";
import { useDevices } from "./devices-provider";
import { DevicePanel, DevicePagination, tableHead } from "./device-ui";
export function CommandResultBadge({
  result,
}: {
  result: DeviceCommand["result"];
}) {
  return (
    <Badge
      variant="outline"
      className={`border-transparent ${result === "success" ? "bg-secondary text-primary" : ["failed", "timeout"].includes(result) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
    >
      {resultLabels[result]}
    </Badge>
  );
}
export function CommandLog({ onView }: { onView: (c: DeviceCommand) => void }) {
  const { commands, devices } = useDevices();
  const [query, setQuery] = useState(""),
    [result, setResult] = useState(""),
    [page, setPage] = useState(1);
  const rows = commands.filter(
    (c) =>
      (!result || c.result === result) &&
      normalizeDeviceText(
        `${c.id} ${devices.find((d) => d.id === c.deviceId)?.name} ${c.deviceId} ${c.source}`,
      ).includes(normalizeDeviceText(query)),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  return (
    <>
      <div className="flex flex-wrap gap-3 p-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-2.5 left-3 size-4 text-[#8BAA97]" />
          <Input
            className="pl-9"
            aria-label="Tìm nhật ký lệnh"
            placeholder="Tìm lệnh, thiết bị, người thực hiện..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-52">
          <Choice
            label="Lọc kết quả lệnh"
            value={result}
            onChange={(v) => {
              setResult(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả kết quả" },
              ...Object.entries(resultLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
      </div>
      <Table className="min-w-[900px] text-xs">
        <TableHeader className={tableHead}>
          <TableRow>
            {[
              "THỜI GIAN",
              "THIẾT BỊ",
              "VỊ TRÍ",
              "LỆNH",
              "NGUỒN THỰC HIỆN",
              "KẾT QUẢ",
              "THAO TÁC",
            ].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice((currentPage - 1) * 10, currentPage * 10).map((c) => {
            const d = devices.find((d) => d.id === c.deviceId)!;
            return (
              <TableRow
                key={c.id}
                className="hover:bg-[#F3F8F4] [&_td]:px-5 [&_td]:py-5"
              >
                <TableCell>{deviceTimestamp(c.at)}</TableCell>
                <TableCell className="font-semibold">{d.name}</TableCell>
                <TableCell>
                  Khu {d.area} · {d.location}
                </TableCell>
                <TableCell>
                  {c.requested === "on" ? "Bật" : "Tắt"}
                  {c.duration ? ` · ${c.duration} giây` : ""}
                </TableCell>
                <TableCell>{c.source}</TableCell>
                <TableCell>
                  <CommandResultBadge result={c.result} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    aria-label={`Xem lệnh ${c.id}`}
                    onClick={() => onView(c)}
                  >
                    <Eye />
                    Xem
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={7} className="py-14 text-center">
                Không tìm thấy nhật ký phù hợp.
                <Button
                  variant="link"
                  onClick={() => {
                    setQuery("");
                    setResult("");
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
export function CommandDetailSheet({
  id,
  onClose,
  returnFocus,
}: {
  id: string;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { commands, devices } = useDevices(),
    c = commands.find((c) => c.id === id)!,
    d = devices.find((d) => d.id === c.deviceId)!;
  return (
    <DevicePanel
      title="Chi tiết lệnh"
      description={c.id}
      onClose={onClose}
      returnFocus={returnFocus}
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-6">
        <CommandResultBadge result={c.result} />
        <dl className="space-y-4">
          {[
            ["Thiết bị", `${d.name} · ${d.id}`],
            ["Vị trí", `Khu ${d.area} · ${d.location}`],
            ["Lệnh yêu cầu", c.requested === "on" ? "Bật" : "Tắt"],
            ["Thời gian chạy", c.duration ? `${c.duration} giây` : "—"],
            ["Nguồn thực hiện", c.source],
            ["Thời gian", deviceTimestamp(c.at)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[140px_1fr] gap-3 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p
          role="status"
          className="rounded-xl border bg-muted p-4 text-sm leading-6"
        >
          {c.message}
        </p>
        <p className="text-xs text-muted-foreground">
          Lịch sử minh họa các thao tác điều khiển.
        </p>
      </div>
    </DevicePanel>
  );
}
