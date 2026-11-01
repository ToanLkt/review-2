import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homeImages, trayModelItems } from "@/lib/home";
import { HomeAccordion } from "./home-accordion";
import { CoverImage, SectionHeading } from "./home-ui";

export function TrayRentalSection() {
  return <section className="py-20"><div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2"><div className="relative min-h-[420px] overflow-hidden rounded-2xl lg:min-h-[540px]"><CoverImage src={homeImages.tray} alt="Khay rau mầm được trồng và chăm sóc trong nhà" /><div className="absolute inset-0 bg-gradient-to-t from-[#0f1a11]/65 to-transparent" /><div className="absolute bottom-6 left-6 right-6 max-w-sm rounded-xl bg-white/95 p-5"><p className="font-bold">SmartFarm quản lý toàn bộ</p><p className="mt-1 text-xs text-[#6b7280]">IoT · Camera · Tưới tự động · Hỗ trợ kỹ thuật</p></div></div><div><SectionHeading eyebrow="MÔ HÌNH THUÊ KHAY" title="Thuê khay linh hoạt, phù hợp nhu cầu của bạn" description="Bạn chọn loại rau mầm muốn trồng. SmartFarm chuẩn bị khay, chăm sóc và cập nhật tiến độ cho bạn từ xa." /><div className="mt-8"><HomeAccordion items={trayModelItems} initialOpen={0} /></div><Link href="/rent-tray" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#4F8F68] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3F7655]">Tìm hiểu cách thuê khay <ArrowRight size={16} /></Link></div></div></section>;
}
