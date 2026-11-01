"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

type Item = { title: string; content: string };

export function HomeAccordion({ items, initialOpen = null }: { items: Item[]; initialOpen?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen);
  return <div className="space-y-3">{items.map((item, index) => <div key={item.title} className="rounded-2xl border border-[#e8f3eb] bg-white"><h3><button type="button" aria-expanded={openIndex === index} aria-controls={`home-panel-${initialOpen === 0 ? "tray" : "faq"}-${index}`} onClick={() => setOpenIndex(openIndex === index ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-[#1a2e1f]"><span>{item.title}</span><ChevronRight size={18} className={`shrink-0 text-[#4F8F68] transition-transform ${openIndex === index ? "rotate-90" : ""}`} /></button></h3>{openIndex === index && <div id={`home-panel-${initialOpen === 0 ? "tray" : "faq"}-${index}`} className="px-5 pb-5 text-sm leading-6 text-[#6b7280]">{item.content}</div>}</div>)}</div>;
}
