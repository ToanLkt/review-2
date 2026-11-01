import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iotFeatures } from "@/lib/home";
import { CoverImage, SectionHeading } from "./home-ui";

export function IotShowcaseSection() {
  return <section className="bg-[#1a2e1f] py-20"><div className="mx-auto max-w-7xl px-6"><div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="CÔNG NGHỆ IOT" title="Giám sát thông minh cho khay rau mầm" light /><Link href="/my-trays" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#a3b8aa] hover:text-white">Xem chi tiết <ArrowRight size={16} /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{iotFeatures.map((item) => <article key={item.number} className="group relative h-72 overflow-hidden rounded-2xl bg-[#2a3f2f] lg:h-80"><CoverImage src={item.image} alt={item.title} className="opacity-75 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100" /><div className="absolute inset-0 bg-gradient-to-t from-[#0f1a11]/95 via-[#0f1a11]/35 to-transparent" /><span className="absolute left-5 top-5 font-mono text-sm font-bold text-[#78bc8d]">{item.number}</span><div className="absolute bottom-0 p-5"><ArrowRight size={18} className="mb-3 text-white opacity-0 transition-opacity group-hover:opacity-100" /><h3 className="text-base font-bold text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#a3b8aa]">{item.description}</p></div></article>)}</div></div></section>;
}
