"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useOperations } from "../shared/operations-provider";
import { areaStats } from "@/lib/operations/selectors";
import type { GrowingArea } from "@/lib/operations/types";
export function AreaMaintenanceDialog({
  area,
  onClose,
}: {
  area: GrowingArea;
  onClose: () => void;
}) {
  const { state, execute } = useOperations();
  const growing = areaStats(state, area).trays.filter(
    (t) => t.status === "Đang trồng",
  );
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {growing.length
              ? "Chưa thể bảo trì " + area.name
              : "Chuyển " + area.name + " sang bảo trì?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {growing.length
              ? `Còn ${growing.length} khay đang trồng. Hoàn tất các chu kỳ trước khi bảo trì khu vực.`
              : "Khu vực sẽ ngừng nhận khay mới. Các khay và lịch sử hiện có vẫn được giữ nguyên."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {growing.length > 0 && (
          <div className="max-h-48 overflow-auto rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">
            {growing.map((t) => t.code).join(" · ")}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>
            {growing.length ? "Đã hiểu" : "Hủy"}
          </AlertDialogCancel>
          {!growing.length && (
            <Button
              onClick={async () => {
                const r = await execute(
                  { type: "area-maintenance", id: area.id },
                  "Đã chuyển khu vực sang bảo trì.",
                );
                if (r.ok) onClose();
              }}
            >
              Xác nhận bảo trì
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
