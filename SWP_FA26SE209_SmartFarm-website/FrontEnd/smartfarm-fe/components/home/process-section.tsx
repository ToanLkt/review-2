import Link from "next/link";
import { ArrowRight } from "lucide-react";

import styles from "./home-page.module.css";

const steps = [
  {
    number: "01",
    title: "Chọn giống rau",
    description: "Khám phá giống rau mầm phù hợp với khẩu vị và nhu cầu của bạn.",
    href: "/seeds",
  },
  {
    number: "02",
    title: "Thuê khay trồng",
    description: "Chọn số khay, giống rau và lịch trồng cho từng khay.",
    href: "/rent-tray",
  },
  {
    number: "03",
    title: "Theo dõi từ xa",
    description: "Xem trạng thái khay, dữ liệu môi trường và hình ảnh khi thiết bị có dữ liệu.",
    href: "/my-trays",
  },
  {
    number: "04",
    title: "Thu hoạch và nhận rau",
    description: "Khi khay sẵn sàng, bạn xem trạng thái và chủ động sắp xếp lịch nhận.",
    href: "/delivery",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="bg-[#EAE8DC] py-24 md:py-32 lg:py-40">
      <div className={`mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 ${styles.reveal}`}>
        <h2 className={`max-w-4xl text-[#19382B] ${styles.sectionTitle}`}>Từ lựa chọn đến thu hoạch</h2>
        <p className="mt-7 max-w-2xl text-base leading-8 text-[#5F685F] md:text-lg">
          SmartFarm kết nối lựa chọn của bạn với quy trình chăm sóc và theo dõi khay rau tại cùng một nơi.
        </p>

        <ol className="mt-16 grid border-t border-[#19382B]/25 md:mt-24 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.number} className={`group py-8 md:min-h-[21rem] md:px-7 md:py-9 ${index > 0 ? "border-t border-[#19382B]/20 md:border-l md:border-t-0" : ""}`}>
              <Link href={step.href} className="flex h-full flex-col focus-visible:outline-offset-8 md:grid md:grid-rows-[auto_auto_1fr_auto]">
                <span className="text-sm font-medium tabular-nums text-[#6E796B]">{step.number}</span>
                <h3 className="mt-12 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#19382B] md:min-h-[4.5rem] md:text-3xl">{step.title}</h3>
                <p className="mt-4 max-w-[17rem] text-base leading-7 text-[#626A62]">{step.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#19382B] transition-[gap] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:gap-3">
                  Xem chi tiết <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
