import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { microgreenBenefits } from "@/lib/home";
import { SectionHeading } from "./home-ui";

export function MicrogreensIntroSection() {
  return <section className="py-20"><div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2"><div><SectionHeading eyebrow="RAU MẦM LÀ GÌ?" title="Siêu thực phẩm của thế kỷ 21" description="Nhỏ bé nhưng giàu hương vị, rau mầm là những chồi non được thu hoạch khi vừa phát triển. SmartFarm đưa nguồn thực phẩm tươi này đến gần hơn với cuộc sống đô thị." /><Link href="/seeds" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#4F8F68] hover:gap-3">Khám phá các loại hạt giống <ArrowRight size={16} /></Link></div><div className="grid gap-4 sm:grid-cols-2">{microgreenBenefits.map((item) => <article key={item.number} className="rounded-2xl bg-[#f3f8f4] p-6"><span className="font-mono text-xs font-bold text-[#4F8F68]">{item.number}</span><h3 className="mt-5 text-base font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7280]">{item.description}</p></article>)}</div></div></section>;
}
