"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function DiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  creating = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  creating?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {creating ? "Hủy tạo mới?" : "Bỏ thay đổi chưa lưu?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Thông tin bạn đã nhập chưa được lưu. Bạn có chắc muốn hủy và bỏ các
            thay đổi này?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tiếp tục nhập</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Xác nhận hủy
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
