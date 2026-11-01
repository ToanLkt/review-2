"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard, SettingsField, settingsInputClass } from "@/components/settings/settings-ui";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import type { CropThreshold, CropThresholdRequest, CultivationSupply, GrowthStage } from "@/lib/api/staff/staff-cultivation-service";

type NumberKey = Exclude<keyof CropThresholdRequest, "supplyId" | "stage">;
const fields: { key: NumberKey; label: string; min?: number; max?: number; integer?: boolean }[] = [
  { key: "minTemperature", label: "Nhiệt độ tối thiểu (°C)" },
  { key: "maxTemperature", label: "Nhiệt độ tối đa (°C)" },
  { key: "minAirHumidity", label: "Độ ẩm không khí tối thiểu (%)", min: 0, max: 100 },
  { key: "maxAirHumidity", label: "Độ ẩm không khí tối đa (%)", min: 0, max: 100 },
  { key: "minSoilMoisture", label: "Độ ẩm giá thể tối thiểu (%)", min: 0, max: 100 },
  { key: "maxSoilMoisture", label: "Độ ẩm giá thể tối đa (%)", min: 0, max: 100 },
  { key: "minLightIntensity", label: "Ánh sáng tối thiểu (lux)", min: 0 },
  { key: "maxLightIntensity", label: "Ánh sáng tối đa (lux)", min: 0 },
  { key: "lightHoursPerDay", label: "Số giờ chiếu sáng mỗi ngày", min: 0, max: 24, integer: true },
];
const stageLabels: Record<GrowthStage, string> = { GERMINATION: "Nảy mầm", GROWING: "Sinh trưởng", HARVEST: "Thu hoạch" };

function formFrom(threshold?: CropThreshold) {
  return Object.fromEntries(fields.map(({ key }) => [key, threshold?.[key] == null ? "" : String(threshold[key])])) as Record<NumberKey, string>;
}

export function EnvironmentThresholds() {
  const [supplies, setSupplies] = useState<CultivationSupply[]>([]);
  const [thresholds, setThresholds] = useState<CropThreshold[]>([]);
  const [supplyId, setSupplyId] = useState(0);
  const [stage, setStage] = useState<GrowthStage>("GERMINATION");
  const [values, setValues] = useState<Record<NumberKey, string>>(formFrom());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([staffCultivationService.supplies({ type: "SEED", active: true }), staffCultivationService.thresholds()])
      .then(([seeds, current]) => {
        if (!active) return;
        setSupplies(seeds); setThresholds(current);
        const first = seeds[0]?.supplyId ?? 0;
        setSupplyId(first);
        setValues(formFrom(current.find((item) => item.supplyId === first && item.stage === "GERMINATION")));
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải ngưỡng môi trường."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function choose(nextSupplyId: number, nextStage: GrowthStage) {
    setSupplyId(nextSupplyId); setStage(nextStage);
    setValues(formFrom(thresholds.find((item) => item.supplyId === nextSupplyId && item.stage === nextStage)));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplyId || saving) return;
    const numeric = {} as Record<NumberKey, number>;
    for (const field of fields) {
      const raw = values[field.key].trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || (field.min != null && value < field.min) || (field.max != null && value > field.max) || (field.integer && !Number.isInteger(value))) {
        toast.error(`Giá trị ${field.label.toLowerCase()} không hợp lệ.`); return;
      }
      numeric[field.key] = value;
    }
    for (const [min, max] of [["minTemperature", "maxTemperature"], ["minAirHumidity", "maxAirHumidity"], ["minSoilMoisture", "maxSoilMoisture"], ["minLightIntensity", "maxLightIntensity"]] as [NumberKey, NumberKey][]) {
      if (numeric[min] > numeric[max]) { toast.error("Ngưỡng tối thiểu không được lớn hơn ngưỡng tối đa."); return; }
    }
    const request: CropThresholdRequest = { supplyId, stage, ...numeric };
    const existing = thresholds.find((item) => item.supplyId === supplyId && item.stage === stage);
    setSaving(true);
    try {
      const saved = existing ? await staffCultivationService.updateThreshold(existing.thresholdId, request) : await staffCultivationService.createThreshold(request);
      setThresholds((items) => [...items.filter((item) => item.thresholdId !== saved.thresholdId), saved]);
      setValues(formFrom(saved));
      toast.success("Đã lưu ngưỡng môi trường.");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể lưu ngưỡng môi trường."); }
    finally { setSaving(false); }
  }

  return <SettingsCard title="Ngưỡng môi trường" description="Cấu hình cảnh báo theo giống rau và giai đoạn sinh trưởng, được lưu trên hệ thống.">
    {loading ? <p className="p-6 text-sm text-muted-foreground">Đang tải ngưỡng...</p> : error ? <p role="alert" className="p-6 text-sm text-red-600">{error}</p> : supplies.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Chưa có giống rau đang hoạt động.</p> :
      <form onSubmit={save} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField label="Giống rau" htmlFor="threshold-supply"><select id="threshold-supply" value={supplyId} onChange={(event) => choose(Number(event.target.value), stage)} className={settingsInputClass}>{supplies.map((supply) => <option key={supply.supplyId} value={supply.supplyId}>{supply.supplyName}</option>)}</select></SettingsField>
          <SettingsField label="Giai đoạn" htmlFor="threshold-stage"><select id="threshold-stage" value={stage} onChange={(event) => choose(supplyId, event.target.value as GrowthStage)} className={settingsInputClass}>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></SettingsField>
          {fields.map((field) => <SettingsField key={field.key} label={field.label} htmlFor={field.key}><Input id={field.key} type="number" required step={field.integer ? "1" : "any"} min={field.min} max={field.max} value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className={settingsInputClass} /></SettingsField>)}
        </div>
        <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu ngưỡng"}</Button></div>
      </form>}
  </SettingsCard>;
}
