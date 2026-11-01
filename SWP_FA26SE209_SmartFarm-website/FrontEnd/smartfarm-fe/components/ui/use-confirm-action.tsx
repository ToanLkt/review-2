"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Confirmation = {
  title: string;
  description: string;
  actionLabel: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
};

export function useConfirmAction() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    if (!request || pending) return;
    setPending(true);
    try {
      await request.onConfirm();
      setRequest(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thực hiện thao tác.");
    } finally {
      setPending(false);
    }
  }

  const dialog = (
    <AlertDialog open={Boolean(request)} onOpenChange={(open) => { if (!open && !pending) setRequest(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => setRequest(null)}>Hủy</Button>
          <Button variant={request?.variant ?? "destructive"} disabled={pending} onClick={() => void run()}>
            {pending ? "Đang xử lý..." : request?.actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm: setRequest, confirmationDialog: dialog };
}
