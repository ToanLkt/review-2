"use client";

import { useEffect, useState } from "react";
import { CalendarClock, LoaderCircle, MapPinned, Ruler } from "lucide-react";

import { publicFarmService, type PublicFarmInfo } from "@/lib/api";

export function FarmInfoSection() {
  const [info, setInfo] = useState<PublicFarmInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void publicFarmService.getInfo().then((result) => { if (active) setInfo(result); }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <section className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-10 text-sm text-[#6b7280]"><LoaderCircle size={18} className="animate-spin" />Đang tải thông tin trang trại...</section>;
  if (!info) return null;
  const facts = [
    { icon: CalendarClock, label: "Đặt lịch gieo trước", value: `Tối đa ${info.maxPreOrderDays} ngày` },
    { icon: Ruler, label: "Kích thước khay chuẩn", value: info.standardTraySize },
    { icon: MapPinned, label: "Phạm vi giao hàng", value: `${info.maxDeliveryRadiusKm.toLocaleString("vi-VN")} km` },
  ];
  return <section className="bg-[#f3f8f4] py-16"><div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.2fr_2fr]"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">Thông tin trang trại</p><h2 className="mt-3 text-3xl font-bold tracking-tight">{info.farmName}</h2><p className="mt-4 max-w-md text-sm leading-7 text-[#6b7280]">Thông tin liên hệ và chính sách đặt lịch của trang trại.</p></div><dl className="grid gap-4 sm:grid-cols-3">{facts.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl bg-white p-5"><Icon size={20} className="text-[#4F8F68]" /><dt className="mt-4 text-xs text-[#6b7280]">{label}</dt><dd className="mt-2 font-semibold">{value || "Chưa có thông tin"}</dd></div>)}</dl></div></section>;
}
