"use client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { SmartFarmUser } from "@/lib/users";
export function AccountStatusDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: SmartFarmUser;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const unlocking = user.status === "Đã khóa";
  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {unlocking ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {unlocking
              ? "Người dùng sẽ có thể đăng nhập và sử dụng hệ thống trở lại."
              : "Người dùng này sẽ không thể đăng nhập vào hệ thống cho đến khi tài khoản được mở khóa."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <Button
            variant={unlocking ? "default" : "destructive"}
            onClick={onConfirm}
          >
            {unlocking ? "Mở khóa" : "Khóa tài khoản"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
