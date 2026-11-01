"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, Choice } from "@/components/operations/shared/ui";
import { DiscardDialog } from "@/components/operations/shared/discard-dialog";
import { DevicePanel } from "@/components/devices/device-ui";
import { useDevices } from "@/components/devices/devices-provider";
import { controllers, deviceLocations, deviceTypes } from "@/lib/devices";
import {
  sensorUnit,
  validateRule,
  type RuleConfig,
  type AutomationRule,
} from "@/lib/automation";
import { ConfigurationConfirmation } from "./configuration-confirmation";

type FormState = Omit<RuleConfig, "threshold" | "duration"> & {
  threshold: string;
  duration: string;
};
const empty: FormState = {
  name: "",
  area: "",
  location: "",
  controllerId: "",
  sensorId: "",
  operator: "lt",
  threshold: "",
  outputId: "",
  action: "on",
  duration: "",
  enabled: false,
};
export function RuleFormSheet({
  rule,
  onClose,
  returnFocus,
}: {
  rule?: AutomationRule;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { devices, saveAutomation } = useDevices();
  const [initial] = useState<FormState>(() =>
    rule
      ? {
          ...rule.requested,
          threshold: String(rule.requested.threshold),
          duration:
            rule.requested.duration === null
              ? ""
              : String(rule.requested.duration),
        }
      : empty,
  );
  const [form, setForm] = useState(initial),
    [errors, setErrors] = useState<Partial<Record<keyof RuleConfig, string>>>(
      {},
    ),
    [discard, setDiscard] = useState(false),
    [confirm, setConfirm] = useState(false);
  const sensor = devices.find((d) => d.id === form.sensorId),
    output = devices.find((d) => d.id === form.outputId),
    unit = sensor ? sensorUnit(sensor) : "";
  const pump = output?.type === "pump" && form.action === "on";
  const config: RuleConfig = {
    ...form,
    threshold: form.threshold.trim() ? Number(form.threshold) : NaN,
    duration: pump && form.duration.trim() ? Number(form.duration) : null,
  };
  const eligible = devices.filter(
    (d) =>
      d.controllerId === form.controllerId &&
      d.area === form.area &&
      d.location === form.location,
  );
  const locked = !!rule?.acknowledged;
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }
  function close() {
    if (JSON.stringify(form) !== JSON.stringify(initial)) setDiscard(true);
    else onClose();
  }
  function save(mode: "draft" | "send") {
    const next = validateRule(config, devices, rule);
    setErrors(next);
    if (Object.keys(next).length) return;
    if (mode === "send") {
      setConfirm(true);
      return;
    }
    if (saveAutomation(rule?.id, config, mode)) onClose();
  }
  const preview =
    sensor && output && Number.isFinite(config.threshold)
      ? `Khi ${deviceTypes[sensor.type].toLocaleLowerCase("vi")} ${form.operator === "lt" ? "dưới" : "trên"} ${config.threshold.toLocaleString("vi-VN")}${unit === "lux" ? " " : ""}${unit}, Bộ điều khiển khu ${form.area} ${form.action === "on" ? "bật" : "tắt"} ${output.name.charAt(0).toLocaleLowerCase("vi") + output.name.slice(1)}${pump ? ` trong ${form.duration || "…"} giây` : ""}.`
      : "Chọn cảm biến, ngưỡng và đầu ra để xem trước quy tắc.";
  return (
    <>
      <DevicePanel
        title={rule ? "Chỉnh sửa quy tắc" : "Tạo quy tắc"}
        description={
          rule
            ? `Phiên bản yêu cầu ${rule.version} · ${rule.id}`
            : "Chọn điều kiện môi trường và hành động phù hợp."
        }
        onClose={close}
        returnFocus={returnFocus}
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Hủy
            </Button>
            <Button variant="outline" onClick={() => save("draft")}>
              Lưu bản nháp
            </Button>
            <Button type="submit" form="automation-form">
              Lưu và gửi cấu hình
            </Button>
          </div>
        }
      >
        <form
          id="automation-form"
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save("send");
          }}
        >
          <Field label="Tên quy tắc" htmlFor="rule-name" error={errors.name}>
            <Input
              id="rule-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Khu vực" error={errors.area}>
              <Choice
                label="Khu vực quy tắc"
                value={form.area}
                disabled={locked}
                onChange={(v) => {
                  setForm((s) => ({
                    ...s,
                    area: v,
                    location: "",
                    controllerId: "",
                    sensorId: "",
                    outputId: "",
                    threshold: "",
                    duration: "",
                  }));
                  setErrors({});
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
            <Field label="Vị trí" error={errors.location}>
              <Choice
                label="Vị trí quy tắc"
                value={form.location}
                disabled={!form.area || locked}
                onChange={(v) => {
                  setForm((s) => ({
                    ...s,
                    location: v,
                    sensorId: "",
                    outputId: "",
                    threshold: "",
                    duration: "",
                  }));
                  setErrors({});
                }}
                options={[
                  { value: "", label: "Chọn vị trí" },
                  ...(deviceLocations[form.area] ?? []).map((v) => ({
                    value: v,
                    label: v,
                  })),
                ]}
              />
            </Field>
          </div>
          <Field label="Bộ điều khiển" error={errors.controllerId}>
            <Choice
              label="Bộ điều khiển"
              value={form.controllerId}
              disabled={!form.area || locked}
              onChange={(v) => {
                setForm((s) => ({
                  ...s,
                  controllerId: v,
                  sensorId: "",
                  outputId: "",
                  threshold: "",
                  duration: "",
                }));
                setErrors({});
              }}
              options={[
                { value: "", label: "Chọn bộ điều khiển" },
                ...controllers
                  .filter((c) => c.area === form.area)
                  .map((c) => ({ value: c.id, label: `Bộ điều khiển khu ${c.area}` })),
              ]}
            />
          </Field>
          {locked && (
            <p className="text-xs leading-5 text-muted-foreground">
              Quy tắc đang dùng cần giữ nguyên vị trí và thiết bị.
              Hãy tạo quy tắc mới nếu muốn chọn thiết bị khác.
            </p>
          )}
          <Field label="Cảm biến đầu vào" error={errors.sensorId}>
            <Choice
              label="Cảm biến đầu vào"
              value={form.sensorId}
              disabled={!form.controllerId || !form.location}
              onChange={(v) => {
                setForm((s) => ({ ...s, sensorId: v, threshold: "" }));
                setErrors({});
              }}
              options={[
                { value: "", label: "Chọn cảm biến" },
                ...eligible
                  .filter((d) => d.group === "sensor" && sensorUnit(d) !== null)
                  .map((d) => ({ value: d.id, label: `${d.name} (${d.id})` })),
              ]}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Điều kiện so sánh" error={errors.operator}>
              <Choice
                label="Điều kiện so sánh"
                value={form.operator}
                onChange={(v) => set("operator", v as FormState["operator"])}
                options={[
                  { value: "lt", label: "Nhỏ hơn (<)" },
                  { value: "gt", label: "Lớn hơn (>)" },
                ]}
              />
            </Field>
            <Field
              label={`Giá trị ngưỡng${unit ? ` (${unit})` : ""}`}
              htmlFor="rule-threshold"
              error={errors.threshold}
            >
              <Input
                id="rule-threshold"
                type="number"
                step="any"
                value={form.threshold}
                disabled={!sensor}
                onChange={(e) => set("threshold", e.target.value)}
                aria-invalid={!!errors.threshold}
              />
            </Field>
          </div>
          <Field label="Thiết bị đầu ra" error={errors.outputId}>
            <Choice
              label="Thiết bị đầu ra"
              value={form.outputId}
              disabled={!form.controllerId || !form.location || locked}
              onChange={(v) => {
                setForm((s) => ({ ...s, outputId: v, duration: "" }));
                setErrors({});
              }}
              options={[
                { value: "", label: "Chọn thiết bị đầu ra" },
                ...eligible
                  .filter((d) => d.group === "actuator")
                  .map((d) => ({ value: d.id, label: `${d.name} (${d.id})` })),
              ]}
            />
          </Field>
          <Field label="Hành động" error={errors.action}>
            <Choice
              label="Hành động"
              value={form.action}
              onChange={(v) => set("action", v as FormState["action"])}
              options={[
                { value: "on", label: "Bật thiết bị" },
                { value: "off", label: "Tắt thiết bị" },
              ]}
            />
          </Field>
          {pump && (
            <Field
              label="Thời lượng chạy (giây)"
              htmlFor="rule-duration"
              error={errors.duration}
            >
              <Input
                id="rule-duration"
                type="number"
                step={1}
                min={1}
                max={300}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                aria-invalid={!!errors.duration}
              />
              <p className="text-xs text-muted-foreground">
                Giới hạn máy bơm: từ 1 đến 300 giây.
              </p>
            </Field>
          )}
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <label htmlFor="rule-enabled" className="text-sm font-medium">
              Chế độ tự động
            </label>
            <Switch
              id="rule-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>
          <aside className="space-y-2 rounded-xl border border-primary/20 bg-muted p-4 text-sm leading-6 text-secondary-foreground">
            <p className="font-semibold">Xem trước quy tắc</p>
            <p>{preview}</p>
          </aside>
          <p className="text-xs leading-5 text-muted-foreground">
            Ngưỡng là cấu hình tham khảo. Lưu bản nháp không gửi cấu hình; yêu
            cầu chỉ có hiệu lực sau xác nhận đúng phiên bản. Không thay đổi trực
            tiếp trạng thái bật/tắt thiết bị.
          </p>
        </form>
      </DevicePanel>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={!rule}
      />
      {confirm && (
        <ConfigurationConfirmation
          name={form.name}
          enabled={form.enabled}
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            if (saveAutomation(rule?.id, config, "send")) onClose();
            else setConfirm(false);
          }}
        />
      )}
    </>
  );
}
