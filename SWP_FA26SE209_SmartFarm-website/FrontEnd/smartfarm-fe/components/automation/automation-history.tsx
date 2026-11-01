import { Zap } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { automationHistory } from "@/lib/automation";
import { deviceTimestamp } from "@/lib/devices";
import { tableHead } from "@/components/devices/device-ui";
export function AutomationHistory() {
  return (
    <section
      aria-label="Nhật ký hành động tự động"
      className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3004]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <h2 className="text-base font-semibold">Nhật ký hành động tự động</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded text-xs text-[#759580]">
              <Zap className="size-4" />
              Lịch sử hoạt động
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-80">
            Các hoạt động minh họa cách quy tắc được thực hiện.
          </TooltipContent>
        </Tooltip>
      </header>
      <Table className="min-w-[1050px]">
        <TableHeader className={tableHead}>
          <TableRow>
            {[
              "THỜI GIAN",
              "QUY TẮC",
              "BỘ ĐIỀU KHIỂN",
              "THIẾT BỊ",
              "ĐIỀU KIỆN KÍCH HOẠT",
              "HÀNH ĐỘNG",
              "KẾT QUẢ",
            ].map((title) => (
              <TableHead key={title}>{title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {automationHistory.map((event) => (
            <TableRow
              key={event.id}
              className="hover:bg-[#F3F8F4] [&_td]:px-5 [&_td]:py-5"
            >
              <TableCell className="text-muted-foreground">
                {deviceTimestamp(event.at)}
              </TableCell>
              <TableCell className="font-medium">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="rounded">
                      {event.ruleName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Thực thi theo phiên bản {event.version} đã được xác nhận.
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-muted-foreground">
                Bộ điều khiển khu {event.controllerId.replace("ESP32-", "")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {event.deviceName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {event.condition}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {event.action}
              </TableCell>
              <TableCell>
                <Badge
                  className={`border-0 ${event.result === "success" ? "bg-secondary text-primary" : "bg-red-50 text-red-700"}`}
                >
                  {event.result === "success" ? "Thành công" : "Thất bại"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
