"use client";
import { Eye, Lock, SquarePen, Unlock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DevicePagination } from "@/components/devices/device-ui";
import { date } from "@/lib/formatters";
import type { SmartFarmUser } from "@/lib/users";
import { RoleBadge, UserAvatar, UserCard, UserStatusBadge } from "./user-ui";
export function UserTable({
  users,
  total,
  page,
  onPage,
  onEdit,
  onView,
  onToggle,
  reset,
}: {
  users: SmartFarmUser[];
  total: number;
  page: number;
  onPage: (p: number) => void;
  onEdit: (u: SmartFarmUser) => void;
  onView: (u: SmartFarmUser) => void;
  onToggle: (u: SmartFarmUser) => void;
  reset: () => void;
}) {
  if (!users.length)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="rounded-2xl bg-secondary p-4">
          <Users className="size-7 text-primary" />
        </span>
        <h3 className="font-semibold">Không tìm thấy người dùng</h3>
        <p className="text-sm text-muted-foreground">
          Thử thay đổi từ khóa hoặc bộ lọc.
        </p>
        <Button variant="outline" onClick={reset}>
          Xóa bộ lọc
        </Button>
      </div>
    );
  const action = (u: SmartFarmUser) => (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <Button variant="ghost" size="sm" className="h-8 px-1.5 text-xs text-primary" onClick={() => onView(u)}>
        <Eye className="size-3.5" /> Xem
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-1.5 text-xs text-primary"
        onClick={() => onEdit(u)}
      >
        <SquarePen className="size-3.5" />
        Sửa
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={
          u.status === "Đã khóa"
            ? "h-8 px-1.5 text-xs text-primary"
            : "h-8 px-1.5 text-xs text-muted-foreground"
        }
        onClick={() => onToggle(u)}
      >
        {u.status === "Đã khóa" ? (
          <Unlock className="size-3.5" />
        ) : (
          <Lock className="size-3.5" />
        )}
        {u.status === "Đã khóa" ? "Mở khóa" : "Khóa"}
      </Button>
    </div>
  );
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1050px] table-fixed">
          <colgroup>
            {[21, 18, 13, 11, 12, 10, 15].map((w, i) => (
              <col key={i} style={{ width: w + "%" }} />
            ))}
          </colgroup>
          <TableHeader className="bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-[#809E8A]">
            <TableRow>
              {[
                "NGƯỜI DÙNG",
                "EMAIL",
                "SỐ ĐIỆN THOẠI",
                "VAI TRÒ",
                "TRẠNG THÁI",
                "NGÀY TẠO",
                "THAO TÁC",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u.id}
                className="h-20 transition-colors hover:bg-[#F3F8F4]/70 [&_td]:px-5 [&_td]:py-5 [&_td]:whitespace-normal"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} color={u.color} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p
                        className="mt-1 truncate text-[11px] text-muted-foreground"
                        title={u.detail}
                      >
                        {u.detail}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="break-all text-xs text-muted-foreground">
                  {u.email}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.phone || "—"}
                </TableCell>
                <TableCell>
                  <RoleBadge role={u.role} />
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={u.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {date(u.createdAt)}
                </TableCell>
                <TableCell>{action(u)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 bg-[#F7FAF8] p-4 md:hidden">
        {users.map((u) => (
          <UserCard key={u.id}>
            <div className="flex items-start gap-3">
              <UserAvatar name={u.name} color={u.color} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{u.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{u.detail}</p>
              </div>
              <UserStatusBadge status={u.status} />
            </div>
            <dl className="grid gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all">{u.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <span>{u.phone || "—"}</span>
                <RoleBadge role={u.role} />
              </div>
            </dl>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {date(u.createdAt)}
              </span>
              {action(u)}
            </div>
          </UserCard>
        ))}
      </div>
      <DevicePagination total={total} page={page} onPage={onPage} />
    </>
  );
}
