import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import styles from "./home-page.module.css";

export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden bg-[#10291F] text-[#F5F3EB]">
      <Image
        src="/images/home/smartfarm-hero.png"
        alt="Không gian trồng rau mầm đô thị với nhiều khay rau xanh"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[60%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,20,0.92)_0%,rgba(8,28,20,0.72)_42%,rgba(8,28,20,0.08)_78%)] max-md:bg-[linear-gradient(180deg,rgba(8,28,20,0.34)_0%,rgba(8,28,20,0.9)_72%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,28,20,0.08)_0%,rgba(8,28,20,0.34)_100%)]" />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-14 pt-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
        <div className="max-w-[66rem]">
          <h1 className={`${styles.display} ${styles.heroEnter}`}>
            Rau sạch mỗi ngày, an tâm mỗi bữa.
          </h1>

          <div className={`mt-8 grid max-w-[52rem] gap-7 md:grid-cols-[minmax(0,27rem)_auto] md:items-end ${styles.heroEnterDelayed}`}>
            <p className="text-base leading-7 text-[#E4E8DF] sm:text-lg sm:leading-8">
              Chọn giống, thuê khay và theo dõi rau mầm của bạn lớn lên mỗi ngày tại SmartFarm.
            </p>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                href="/rent-tray"
                className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#F3E89A] py-2 pl-5 pr-2 text-sm font-semibold text-[#19382B] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0"
              >
                Thuê khay ngay
                <span className="flex size-8 items-center justify-center rounded-full bg-[#19382B] text-[#F5F3EB] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/seeds"
                className="inline-flex min-h-12 items-center rounded-full border border-[#F5F3EB]/55 bg-[#10291F]/35 px-5 text-sm font-semibold text-[#F5F3EB] transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F5F3EB] hover:text-[#19382B] active:bg-[#EAE8DC]"
              >
                Khám phá hạt giống
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
