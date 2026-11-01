import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import styles from "./home-page.module.css";

export function FinalCtaSection() {
  return (
    <section className="bg-[#F3E89A] py-24 md:py-32 lg:py-40">
      <div className={`mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 ${styles.reveal}`}>
        <div>
          <p className="max-w-xl text-base leading-7 text-[#425046]">Một lựa chọn nhỏ để bắt đầu hành trình trồng rau mầm theo cách chủ động hơn.</p>
          <h2 className={`mt-8 max-w-5xl text-[#19382B] ${styles.sectionTitle}`}>Bắt đầu khay rau đầu tiên</h2>
        </div>
        <Link
          href="/rent-tray"
          className="group inline-flex min-h-14 w-fit items-center gap-4 rounded-full bg-[#19382B] py-2 pl-6 pr-2 text-sm font-semibold text-[#F5F3EB] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 active:translate-y-0"
        >
          Thuê khay ngay
          <span className="flex size-10 items-center justify-center rounded-full bg-[#F3E89A] text-[#19382B] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  );
}
