import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import styles from "./home-page.module.css";

const services = [
  { number: "01", title: "Thuê khay rau mầm", href: "/rent-tray" },
  { number: "02", title: "Khám phá hạt giống", href: "/seeds" },
  { number: "03", title: "Theo dõi khay trồng", href: "/my-trays" },
  { number: "04", title: "Thu hoạch và giao nhận", href: "/delivery" },
];

export function ServicesSection() {
  return (
    <section className="bg-[#10291F] py-24 text-[#F5F3EB] md:py-32 lg:py-40">
      <div className={`mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 ${styles.reveal}`}>
        <h2 className={`max-w-5xl ${styles.sectionTitle}`}>Theo dõi từng khay rau</h2>
        <div className="mt-16 border-t border-[#F5F3EB]/22 md:mt-24">
          {services.map((service) => (
            <Link
              key={service.number}
              href={service.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-[#F5F3EB]/22 py-7 transition-[background-color,color,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#19382B] hover:px-5 focus-visible:bg-[#19382B] sm:grid-cols-[5rem_1fr_auto] sm:gap-6 sm:py-9"
            >
              <span className="text-sm font-medium tabular-nums text-[#AAB3A3]">{service.number}</span>
              <span className="text-[clamp(1.6rem,4vw,4.35rem)] font-medium leading-none tracking-[-0.045em]">{service.title}</span>
              <span className="flex size-10 items-center justify-center rounded-full bg-[#F3E89A] text-[#19382B] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 sm:size-12">
                <ArrowUpRight size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
