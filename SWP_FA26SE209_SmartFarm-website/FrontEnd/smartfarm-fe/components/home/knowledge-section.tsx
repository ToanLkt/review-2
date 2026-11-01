import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { knowledgeArticles } from "@/lib/home";
import { CoverImage, SectionHeading } from "./home-ui";

export function KnowledgeSection() {
  return <section className="bg-[#1a2e1f] py-20"><div className="mx-auto max-w-7xl px-6"><div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading eyebrow="GÓC KIẾN THỨC" title="Một chút hiểu biết, thêm nhiều sắc xanh" light /><Link href="/seeds" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#a3b8aa] hover:text-white">Xem thêm <ArrowRight size={16} /></Link></div><div className="grid gap-5 md:grid-cols-3">{knowledgeArticles.map((article) => <article key={article.title} className="group overflow-hidden rounded-2xl bg-[#2a3f2f] transition-colors hover:bg-[#334d38]"><div className="relative h-48 overflow-hidden"><CoverImage src={article.image} alt={article.title} className="opacity-85 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100" /></div><div className="p-6"><p className="text-xs font-semibold tracking-widest text-[#78bc8d]">{article.tag}</p><h3 className="mt-3 text-lg font-bold text-white">{article.title}</h3><p className="mt-2 text-sm leading-6 text-[#a3b8aa]">{article.description}</p></div></article>)}</div></div></section>;
}
