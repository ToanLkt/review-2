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
export function ConfigurationConfirmation({
  name,
  enabled,
  onClose,
  onConfirm,
}: {
  name: string;
  enabled: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Xác nhận {enabled ? "bật" : "tắt"} chế độ tự động?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Quy tắc “{name}” sẽ được chuyển sang trạng thái{" "}
            {enabled ? "bật" : "tắt"} trên trang này. Thiết bị trong nông trại
            không thay đổi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
