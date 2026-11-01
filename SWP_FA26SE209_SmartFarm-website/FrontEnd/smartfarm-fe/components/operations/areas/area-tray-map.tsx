"use client";
import Link from "next/link";
import { useState } from "react";
import { Layers3, Plus, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useOperations } from "../shared/operations-provider";
import { useTrayActions } from "../trays/operations-dialogs";
import { positionsForArea } from "@/lib/operations/selectors";
import { trayCodeForPosition } from "@/lib/operations/farm-workflow";
import { statusStyles, Choice, EmptyState, FormError } from "../shared/ui";
import {
  trayStatuses,
  type GrowingArea,
  type TrayPosition,
} from "@/lib/operations/types";
import { useOperationsRoutes } from "../shared/operations-routes";
export function AreaTrayMap({ area, rackId }: { area: GrowingArea; rackId?: string }) {
  const { state, execute } = useOperations();
  const routes = useOperationsRoutes();
  const { openAction } = useTrayActions();
  const [empty, setEmpty] = useState<TrayPosition | null>(null);
  const [trayId, setTray] = useState("");
  const [creatingTray, setCreatingTray] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const positions = positionsForArea(area);
  const visibleShelves = rackId ? area.shelves.filter((shelf) => shelf.id === rackId) : area.shelves;
  const focusedShelf = rackId ? visibleShelves[0] : undefined;
  const selectedShelf = area.shelves.find((shelf) => shelf.id === empty?.shelfId);
  const newTrayCode = empty && selectedShelf
    ? trayCodeForPosition(empty.id, area.name, selectedShelf.name) : "";
  const unassigned = state.trays.filter(
    (t) => !t.positionId && t.status === "Sẵn sàng",
  );
  return (
    <section className="section-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">{focusedShelf ? `Sơ đồ kệ ${focusedShelf.name}` : "Sơ đồ kệ và khay"}</h2>
          <p className="subtle mt-1">
            {routes.readOnly
              ? "Chọn khay để xem thông tin chi tiết."
              : "Chọn khay để xem chi tiết, chọn vị trí trống để bố trí khay."}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {focusedShelf && <Link href={`${routes.trays}/areas/${area.id}`} className="font-medium text-primary hover:underline">Xem toàn bộ kệ</Link>}
          <Grid2X2 className="size-4" />
          {rackId ? positions.filter((position) => position.shelfId === rackId).length : positions.length} vị trí
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 border-b pb-4">
        {["Trống", ...trayStatuses].map((s) => (
          <span
            key={s}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <span className={`size-3 rounded-sm border ${statusStyles[s]}`} />
            {s === "Sẵn sàng" ? "Khay sẵn sàng" : s}
          </span>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {visibleShelves.map((s) => (
          <div key={s.id} className="min-w-0 rounded-xl border bg-muted/30 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Layers3 className="size-4 text-primary" />
              {s.name}
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                {s.levels} tầng · {s.positionsPerLevel} vị trí/tầng
              </span>
            </h3>
            <div className="space-y-3">
              {Array.from({ length: s.levels }, (_, i) => i + 1).map(
                (level) => (
                  <div key={level}>
                    <p className="mb-1.5 text-[10px] text-muted-foreground">
                      Tầng {level}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {positions
                        .filter((p) => p.shelfId === s.id && p.level === level)
                        .map((p) => {
                          const tray = state.trays.find(
                            (t) => t.positionId === p.id,
                          );
                          return (
                            <button
                              key={p.id}
                              aria-label={
                                tray
                                  ? `${tray.code}, ${tray.status}, ${s.name}, tầng ${level}, vị trí ${p.slot}`
                                  : routes.readOnly
                                    ? `Vị trí trống tại ${s.name}, tầng ${level}, vị trí ${p.slot}`
                                    : `Bố trí khay tại ${s.name}, tầng ${level}, vị trí ${p.slot}`
                              }
                              onClick={() => {
                                if (tray) openAction("detail", tray.id);
                                else if (!routes.readOnly) {
                                  setEmpty(p);
                                  setTray("");
                                  setCreatingTray(false);
                                  setError("");
                                }
                              }}
                              className={`flex min-h-[72px] min-w-0 flex-col items-start justify-center gap-1 rounded-lg border p-2.5 text-left transition-shadow hover:ring-2 hover:ring-primary/20 ${statusStyles[tray?.status ?? "Trống"]} ${!tray ? "border-dashed" : ""}`}
                            >
                              <span className="text-[9px] opacity-65">
                                Vị trí {p.slot}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold">
                                {tray?.code ??
                                  (routes.readOnly ? (
                                    "Trống"
                                  ) : (
                                    <>
                                      <Plus className="size-3" />
                                      Trống
                                    </>
                                  ))}
                              </span>
                              <span className="text-[9px] opacity-80">
                                {tray?.status ?? "Chưa có khay"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      {!routes.readOnly && (
        <Dialog open={!!empty} onOpenChange={(o) => !o && setEmpty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bố trí khay</DialogTitle>
            <DialogDescription>
              {area.name} ·{" "}
              {selectedShelf?.name} · Tầng{" "}
              {empty?.level} · Vị trí {empty?.slot}
            </DialogDescription>
          </DialogHeader>
          {area.status !== "Hoạt động" ? (
            <EmptyState
              title="Khu vực chưa hoạt động"
              description="Không thể bố trí khay vào khu vực bảo trì hoặc ngừng sử dụng."
            />
          ) : unassigned.length ? (
            <>
              <Choice
                label="Khay chưa bố trí"
                value={trayId}
                onChange={setTray}
                options={[
                  { value: "", label: "Chọn khay chưa bố trí" },
                  ...unassigned.map((t) => ({
                    value: t.id,
                    label: t.code + " · " + t.specification,
                  })),
                ]}
              />
              <FormError message={error} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmpty(null)}>
                  Hủy
                </Button>
                <Button
                  disabled={!trayId || saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const r = await execute(
                        { type: "tray-move", id: trayId, positionId: empty!.id },
                        "Đã bố trí khay vào vị trí.",
                      );
                      if (r.ok) setEmpty(null);
                      else setError(r.message);
                    } finally { setSaving(false); }
                  }}
                >
                  Xác nhận bố trí
                </Button>
              </div>
            </>
          ) : creatingTray ? (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (saving) return;
                setSaving(true);
                try {
                  const result = await execute(
                    {
                      type: "tray-save",
                      draft: {
                        code: newTrayCode,
                        positionId: empty!.id,
                        notes: "",
                      },
                    },
                    "Đã tạo và bố trí khay vào vị trí.",
                  );
                  if (result.ok) setEmpty(null);
                  else setError(result.message);
                } finally { setSaving(false); }
              }}
            >
              <div className="rounded-xl border bg-muted/30 p-4">
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="new-position-tray-code"
                >
                  Mã khay (tự động)
                </label>
                <Input
                  id="new-position-tray-code"
                  value={newTrayCode}
                  readOnly
                  aria-readonly="true"
                  aria-invalid={!!error}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Mã được sinh từ khu vực, mã kệ, tầng và vị trí đang chọn.
                </p>
              </div>
              <FormError message={error} />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreatingTray(false);
                    setError("");
                  }}
                >
                  Quay lại
                </Button>
                <Button type="submit" disabled={!newTrayCode.trim() || saving}>
                  <Plus className="size-4" />
                  Tạo và bố trí khay
                </Button>
              </div>
            </form>
          ) : (
            <EmptyState
              title="Không có khay chưa bố trí"
              description="Bạn có thể tạo khay mới ngay tại vị trí đang chọn."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setCreatingTray(true);
                    setError("");
                  }}
                >
                  <Plus className="size-4" />
                  Thêm khay
                </Button>
              }
            />
          )}
        </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
