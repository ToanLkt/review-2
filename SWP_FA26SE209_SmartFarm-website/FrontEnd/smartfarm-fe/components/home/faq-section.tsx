import { faqItems } from "@/lib/home";
import { HomeAccordion } from "./home-accordion";
import { SectionHeading } from "./home-ui";

export function FaqSection() {
  return <section id="faq" className="py-20"><div className="mx-auto max-w-3xl px-6"><div className="mb-9 text-center"><div className="inline-block text-left"><SectionHeading eyebrow="HỖ TRỢ" title="Câu hỏi thường gặp" /></div></div><HomeAccordion items={faqItems} /></div></section>;
}
