"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
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
import { TrayDetailSheet } from "./tray-detail-sheet";
import { TrayFormSheet } from "./tray-form-sheet";
import { MoveTrayDialog } from "./move-tray-dialog";
import { TrayAllocationDialog } from "./tray-allocation-dialog";
import { useOperationsRoutes } from "../shared/operations-routes";
type Action =
  "detail" | "edit" | "move" | "allocate" | "maintenance" | "clean" | "restore" | "delete";
const Context = createContext<{
  openAction: (type: Action, id: string, destination?: string) => void;
} | null>(null);
export function OperationsDialogs({ children }: { children: ReactNode }) {
  const { state, execute, deleteTray } = useOperations();
  const routes = useOperationsRoutes();
  const [action, setAction] = useState<{
    type: Action;
    id: string;
    destination?: string;
  } | null>(null);
  const tray = state.trays.find((t) => t.id === action?.id);
  const close = () => setAction(null);
  const titles = {
    maintenance: "Chuyển khay sang bảo trì",
    clean: "Xác nhận đã vệ sinh",
    restore: "Hoàn tất bảo trì",
    delete: "Xóa khay",
  };
  return (
    <Context.Provider
      value={{
        openAction: (type, id, destination) => {
          if (!routes.readOnly || type === "detail")
            setAction({ type, id, destination });
        },
      }}
    >
      {children}
      {tray && action?.type === "detail" && (
        <TrayDetailSheet key={tray.id} tray={tray} onClose={close} />
      )}{" "}
      {tray && action?.type === "edit" && (
        <TrayFormSheet key={tray.id} tray={tray} onClose={close} />
      )}{" "}
      {tray && action?.type === "move" && (
        <MoveTrayDialog
          key={tray.id}
          tray={tray}
          destination={action.destination}
          onClose={close}
        />
      )}{" "}
      {tray && action?.type === "allocate" && (
        <TrayAllocationDialog key={tray.id} tray={tray} onClose={close} />
      )}{" "}
      {tray &&
        action &&
        (action.type === "maintenance" ||
          action.type === "clean" ||
          action.type === "restore" ||
          action.type === "delete") && (
          <AlertDialog open onOpenChange={(o) => !o && close()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{titles[action.type]}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {action.type === "delete"
                    ? `Khay ${tray.code} sẽ bị xóa khỏi danh sách. Khay đã có lịch sử thuê sẽ không thể xóa.`
                    : `Khay ${tray.code} sẽ chuyển sang trạng thái ${action.type === "maintenance" ? "Bảo trì" : "Sẵn sàng"}. Thao tác được ghi vào lịch sử khay.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <Button
                  variant={action.type === "delete" ? "destructive" : "default"}
                  onClick={async () => {
                    if (action.type === "delete") { void deleteTray(tray.id).then((ok) => { if (ok) close(); }); return; }
                    const r = await execute(
                      {
                        type: "tray-status",
                        id: tray.id,
                        status:
                          action.type === "maintenance"
                            ? "Bảo trì"
                            : "Sẵn sàng",
                      },
                      "Đã cập nhật trạng thái khay.",
                    );
                    if (r.ok) close();
                  }}
                >
                  Xác nhận
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
    </Context.Provider>
  );
}
export function useTrayActions() {
  const c = useContext(Context);
  if (!c) throw new Error("Thiếu thao tác khay");
  return c;
}
