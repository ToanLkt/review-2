"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard, SettingsField, settingsInputClass } from "@/components/settings/settings-ui";
import { adminFarmConfigService } from "@/lib/api/admin/admin-farm-config-instance";
import type { FarmConfig, FarmConfigRequest } from "@/lib/api/admin/admin-farm-config-service";

type NumericKey = Exclude<{
  [K in keyof FarmConfigRequest]: FarmConfigRequest[K] extends number ? K : never;
}[keyof FarmConfigRequest], undefined>;

const numericFields: { key: NumericKey; label: string; min: number; max: number; step?: string }[] = [
  { key: "maxPreOrderDays", label: "Số ngày đặt trước tối đa", min: 1, max: 365 },
  { key: "maxDeliveryRadiusKm", label: "Bán kính giao hàng tối đa (km)", min: 0, max: 10000, step: "any" },
  { key: "discountCycleThreshold", label: "Số chu kỳ để nhận ưu đãi", min: 1, max: 100 },
  { key: "discountTrayThreshold", label: "Số khay để nhận ưu đãi", min: 1, max: 100 },
  { key: "loyalOrderThreshold", label: "Số đơn hoàn thành để thành khách thân thiết", min: 1, max: 100 },
  { key: "standardDiscountPercent", label: "Ưu đãi tiêu chuẩn (%)", min: 0, max: 100, step: "any" },
  { key: "loyalDiscountPercent", label: "Ưu đãi khách thân thiết (%)", min: 0, max: 100, step: "any" },
];

type FormValues = Record<keyof FarmConfigRequest, string>;

function toForm(config: FarmConfig): FormValues {
  return {
    farmName: config.farmName,
    maxPreOrderDays: String(config.maxPreOrderDays),
    standardTraySize: config.standardTraySize,
    maxDeliveryRadiusKm: String(config.maxDeliveryRadiusKm),
    discountCycleThreshold: String(config.discountCycleThreshold),
    discountTrayThreshold: String(config.discountTrayThreshold),
    loyalOrderThreshold: String(config.loyalOrderThreshold),
    standardDiscountPercent: String(config.standardDiscountPercent),
    loyalDiscountPercent: String(config.loyalDiscountPercent),
    bankAccountNumber: config.bankAccountNumber ?? "",
    bankName: config.bankName ?? "",
    bankOwnerName: config.bankOwnerName ?? "",
    farmLatitude: config.farmLatitude == null ? "" : String(config.farmLatitude),
    farmLongitude: config.farmLongitude == null ? "" : String(config.farmLongitude),
  };
}

function toRequest(values: FormValues): FarmConfigRequest {
  if (!values.farmName.trim() || values.farmName.trim().length > 100) throw new Error("Tên nông trại phải có từ 1 đến 100 ký tự.");
  if (!values.standardTraySize.trim() || values.standardTraySize.trim().length > 50) throw new Error("Kích thước khay chuẩn phải có từ 1 đến 50 ký tự.");
  const numberValue = (field: (typeof numericFields)[number]) => {
    const raw = values[field.key].trim();
    const number = Number(raw);
    if (!raw || !Number.isFinite(number) || number < field.min || number > field.max || (!field.step && !Number.isInteger(number)))
      throw new Error(`${field.label} phải từ ${field.min} đến ${field.max}${field.step ? "" : " và là số nguyên"}.`);
    return number;
  };
  const numbers = Object.fromEntries(numericFields.map((field) => [field.key, numberValue(field)])) as Record<NumericKey, number>;
  for (const [key, max, label] of [
    ["bankAccountNumber", 50, "Số tài khoản"], ["bankName", 100, "Tên ngân hàng"], ["bankOwnerName", 100, "Tên chủ tài khoản"],
  ] as const) if (values[key].trim().length > max) throw new Error(`${label} không được quá ${max} ký tự.`);
  const coordinate = (key: "farmLatitude" | "farmLongitude", limit: number) => {
    const raw = values[key].trim();
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || Math.abs(value) > limit) throw new Error(`${key === "farmLatitude" ? "Vĩ độ" : "Kinh độ"} phải trong khoảng -${limit} đến ${limit}.`);
    return value;
  };
  const farmLatitude = coordinate("farmLatitude", 90);
  const farmLongitude = coordinate("farmLongitude", 180);
  if ((farmLatitude === null) !== (farmLongitude === null)) throw new Error("Vui lòng nhập cả vĩ độ và kinh độ trang trại.");
  return {
    farmName: values.farmName.trim(), standardTraySize: values.standardTraySize.trim(), ...numbers,
    bankAccountNumber: values.bankAccountNumber.trim() || null,
    bankName: values.bankName.trim() || null,
    bankOwnerName: values.bankOwnerName.trim() || null,
    farmLatitude,
    farmLongitude,
  };
}

export function FarmInformation() {
  const [values, setValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminFarmConfigService.get().then((config) => {
      if (active) setValues(toForm(config));
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Không thể tải cấu hình trang trại.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update(key: keyof FormValues, value: string) {
    setValues((current) => current ? { ...current, [key]: value } : current);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || saving) return;
    setSaving(true);
    try {
      const updated = await adminFarmConfigService.update(toRequest(values));
      setValues(toForm(updated));
      toast.success("Đã lưu cấu hình trang trại.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể lưu cấu hình trang trại.");
    } finally { setSaving(false); }
  }

  return (
    <SettingsCard title="Cấu hình trang trại" description="Các giá trị này được lưu trên hệ thống và áp dụng cho đặt lịch, giao hàng, ưu đãi và chuyển khoản.">
      {loading ? <p className="p-6 text-sm text-muted-foreground">Đang tải cấu hình...</p> : error ? <p role="alert" className="p-6 text-sm text-red-600">{error}</p> : values && (
        <form onSubmit={save} className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField label="Tên nông trại" htmlFor="farm-name"><Input id="farm-name" required maxLength={100} value={values.farmName} onChange={(event) => update("farmName", event.target.value)} className={settingsInputClass} /></SettingsField>
            <SettingsField label="Kích thước khay chuẩn" htmlFor="tray-size"><Input id="tray-size" required maxLength={50} value={values.standardTraySize} onChange={(event) => update("standardTraySize", event.target.value)} className={settingsInputClass} /></SettingsField>
            {numericFields.map((field) => <SettingsField key={field.key} label={field.label} htmlFor={field.key}>
              <Input id={field.key} type="number" required min={field.min} max={field.max} step={field.step ?? "1"} value={values[field.key]} onChange={(event) => update(field.key, event.target.value)} className={settingsInputClass} />
            </SettingsField>)}
            <SettingsField label="Vĩ độ trang trại" htmlFor="farmLatitude"><Input id="farmLatitude" type="number" min={-90} max={90} step="any" value={values.farmLatitude} onChange={(event) => update("farmLatitude", event.target.value)} className={settingsInputClass} /></SettingsField>
            <SettingsField label="Kinh độ trang trại" htmlFor="farmLongitude"><Input id="farmLongitude" type="number" min={-180} max={180} step="any" value={values.farmLongitude} onChange={(event) => update("farmLongitude", event.target.value)} className={settingsInputClass} /></SettingsField>
          </div>
          <p className="text-xs text-muted-foreground">Nhập đủ hai tọa độ để tính phạm vi giao hàng. Để trống cả hai để giữ vị trí hiện tại.</p>
          <div className="border-t pt-6">
            <h3 className="mb-4 font-semibold">Tài khoản nhận chuyển khoản</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {([
                ["bankAccountNumber", "Số tài khoản", 50], ["bankName", "Tên ngân hàng", 100], ["bankOwnerName", "Tên chủ tài khoản", 100],
              ] as const).map(([key, label, maxLength]) => <SettingsField key={key} label={label} htmlFor={key}>
                <Input id={key} maxLength={maxLength} value={values[key]} onChange={(event) => update(key, event.target.value)} className={settingsInputClass} />
              </SettingsField>)}
            </div>
          </div>
          <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
        </form>
      )}
    </SettingsCard>
  );
}
