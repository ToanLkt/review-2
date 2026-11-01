"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Choice } from "@/components/operations/shared/ui";
import { DiscardDialog } from "@/components/operations/shared/discard-dialog";
import {
  actuatorTypes,
  sensorTypes,
  deviceTypes,
  deviceLocations,
  controllers,
  validateDevice,
  type DeviceDraft,
} from "@/lib/devices";
import { DevicePanel } from "./device-ui";
import { useDevices } from "./devices-provider";
const empty: DeviceDraft = {
  name: "",
  id: "",
  group: "sensor",
  type: "temperature",
  area: "",
  location: "",
  controllerId: "",
  notes: "",
};
export function AddDeviceSheet({
  onClose,
  returnFocus,
}: {
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { devices, add } = useDevices();
  const [draft, setDraft] = useState(empty),
    [errors, setErrors] = useState<Partial<Record<keyof DeviceDraft, string>>>(
      {},
    ),
    [discard, setDiscard] = useState(false);
  const set = (key: keyof DeviceDraft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  function close() {
    if (JSON.stringify(draft) !== JSON.stringify(empty)) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <DevicePanel
        title="Thêm thiết bị"
        description="Đăng ký thiết bị và vị trí lắp đặt."
        onClose={close}
        returnFocus={returnFocus}
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Hủy
            </Button>
            <Button type="submit" form="add-device">
              Thêm thiết bị
            </Button>
          </>
        }
      >
        <form
          id="add-device"
          className="space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const next = validateDevice(draft, devices);
            setErrors(next);
            if (!Object.keys(next).length && add(draft)) onClose();
          }}
        >
          <Field label="Tên thiết bị" htmlFor="device-name" error={errors.name}>
            <Input
              id="device-name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label="Mã thiết bị" htmlFor="device-code" error={errors.id}>
            <Input
              id="device-code"
              value={draft.id}
              onChange={(e) => set("id", e.target.value)}
              aria-invalid={!!errors.id}
            />
          </Field>
          <Field label="Nhóm">
            <Choice
              label="Nhóm thiết bị"
              value={draft.group}
              onChange={(v) => {
                setDraft((d) => ({
                  ...d,
                  group: v as DeviceDraft["group"],
                  type: v === "sensor" ? "temperature" : "pump",
                }));
              }}
              options={[
                { value: "sensor", label: "Cảm biến" },
                { value: "actuator", label: "Thiết bị điều khiển" },
              ]}
            />
          </Field>
          <Field label="Loại thiết bị" error={errors.type}>
            <Choice
              label="Loại thiết bị"
              value={draft.type}
              onChange={(v) => set("type", v)}
              options={(draft.group === "sensor"
                ? sensorTypes
                : actuatorTypes
              ).map((v) => ({ value: v, label: deviceTypes[v] }))}
            />
          </Field>
          <Field label="Khu vực" error={errors.area}>
            <Choice
              label="Khu vực lắp đặt"
              value={draft.area}
              onChange={(v) => {
                setDraft((d) => ({
                  ...d,
                  area: v,
                  location: "",
                  controllerId: "",
                }));
              }}
              options={[
                { value: "", label: "Chọn khu vực" },
                ...Object.keys(deviceLocations).map((v) => ({
                  value: v,
                  label: `Khu ${v}`,
                })),
              ]}
            />
          </Field>
          <Field label="Vị trí lắp đặt" error={errors.location}>
            <Choice
              label="Vị trí lắp đặt"
              value={draft.location}
              onChange={(v) => set("location", v)}
              disabled={!draft.area}
              options={[
                { value: "", label: "Chọn vị trí" },
                ...(deviceLocations[draft.area] ?? []).map((v) => ({
                  value: v,
                  label: v,
                })),
              ]}
            />
          </Field>
          <Field label="Bộ điều khiển" error={errors.controllerId}>
            <Choice
              label="Bộ điều khiển"
              value={draft.controllerId}
              onChange={(v) => set("controllerId", v)}
              disabled={!draft.area}
              options={[
                { value: "", label: "Chọn bộ điều khiển" },
                ...controllers
                  .filter((c) => c.area === draft.area)
                  .map((c) => ({
                    value: c.id,
                    label: `Bộ điều khiển khu ${c.area}${c.connection === "offline" ? " · Mất kết nối" : ""}`,
                  })),
              ]}
            />
          </Field>
          <Field label="Ghi chú" htmlFor="device-notes">
            <Textarea
              id="device-notes"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </form>
      </DevicePanel>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
      />
    </>
  );
}
