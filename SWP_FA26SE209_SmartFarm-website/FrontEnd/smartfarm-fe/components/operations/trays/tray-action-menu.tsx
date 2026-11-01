"use client";
import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  MoveRight,
  ClipboardPlus,
  Wrench,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTrayActions } from "./operations-dialogs";
import { useOperations } from "../shared/operations-provider";
import { currentAssignment, currentCycle } from "@/lib/operations/selectors";
import type { PhysicalTray } from "@/lib/operations/types";
import {
  useOperationsRoutes,
  withOperationsQuery,
} from "../shared/operations-routes";
export function TrayActionMenu({
  tray,
  insideDetail = false,
}: {
  tray: PhysicalTray;
  insideDetail?: boolean;
}) {
  const { openAction } = useTrayActions();
  const { state } = useOperations();
  const routes = useOperationsRoutes();
  const assignment = currentAssignment(state, tray.id);
  const cycle = currentCycle(state, tray.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={"Thao tác khay " + tray.code}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{tray.code}</DropdownMenuLabel>
        {!insideDetail && (
          <DropdownMenuItem onSelect={() => openAction("detail", tray.id)}>
            <Eye />
            Xem chi tiết
          </DropdownMenuItem>
        )}
        {!routes.readOnly && !insideDetail && <DropdownMenuSeparator />}
        {!routes.readOnly && tray.status === "Sẵn sàng" && (
          <>
            <DropdownMenuItem onSelect={() => openAction("edit", tray.id)}>
              <Pencil />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openAction("move", tray.id)}>
              <MoveRight />
              Di chuyển khay
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openAction("allocate", tray.id)}>
              <ClipboardPlus />
              Phân bổ đơn thuê
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => openAction("maintenance", tray.id)}
            >
              <Wrench />
              Chuyển bảo trì
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => openAction("delete", tray.id)}>
              <Trash2 />
              Xóa khay
            </DropdownMenuItem>
          </>
        )}
        {tray.status === "Đã giữ chỗ" && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={withOperationsQuery(routes.orders, {
                  order: assignment?.orderId,
                })}
              >
                <ExternalLink />
                Xem đơn thuê
              </Link>
            </DropdownMenuItem>
            {!routes.readOnly && (
              <DropdownMenuItem asChild>
                <Link
                  href={withOperationsQuery(routes.cycles, {
                    tray: tray.id,
                    action: "create",
                  })}
                >
                  <ClipboardPlus />
                  Tạo chu kỳ trồng
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        {tray.status === "Đang trồng" && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={withOperationsQuery(routes.cycles, {
                  cycle: cycle?.id,
                })}
              >
                <ExternalLink />
                Xem chu kỳ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={withOperationsQuery(routes.monitoring, {
                  tray: tray.id,
                })}
              >
                <ExternalLink />
                Xem dữ liệu IoT
              </Link>
            </DropdownMenuItem>
            {!routes.readOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <MoveRight />
                  Di chuyển khay
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Wrench />
                  Chuyển bảo trì
                </DropdownMenuItem>
                <p className="px-2 py-2 text-[10px] leading-relaxed text-muted-foreground">
                  Cần hoàn tất chu kỳ trước khi di chuyển hoặc bảo trì.
                </p>
              </>
            )}
          </>
        )}
        {!routes.readOnly && tray.status === "Chờ vệ sinh" && (
          <DropdownMenuItem onSelect={() => openAction("clean", tray.id)}>
            <Check />
            Xác nhận đã vệ sinh
          </DropdownMenuItem>
        )}
        {!routes.readOnly && tray.status === "Bảo trì" && (
          <DropdownMenuItem onSelect={() => openAction("restore", tray.id)}>
            <Check />
            Hoàn tất bảo trì
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
