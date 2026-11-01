"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationFields } from "./location-fields";
import { FormError } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { locationOf } from "@/lib/operations/selectors";
import type { PhysicalTray } from "@/lib/operations/types";
export function MoveTrayDialog({
  tray,
  onClose,
  destination,
}: {
  tray: PhysicalTray;
  onClose: () => void;
  destination?: string;
}) {
  const { state, execute } = useOperations();
  const [positionId, setPosition] = useState<string | null>(
    destination ?? null,
  );
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Di chuyển khay {tray.code}</DialogTitle>
          <DialogDescription>
            Vị trí hiện tại: {locationOf(state, tray).label}
          </DialogDescription>
        </DialogHeader>
        <LocationFields
          value={positionId}
          onChange={setPosition}
          error={error}
        />
        <p className="subtle">
          Xác nhận sẽ giải phóng vị trí cũ và bố trí khay vào vị trí mới.
        </p>
        <FormError />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!positionId}
            onClick={async () => {
              const r = await execute(
                { type: "tray-move", id: tray.id, positionId: positionId! },
                "Đã cập nhật vị trí khay.",
              );
              if (r.ok) onClose();
              else setError(r.message);
            }}
          >
            Xác nhận di chuyển
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
