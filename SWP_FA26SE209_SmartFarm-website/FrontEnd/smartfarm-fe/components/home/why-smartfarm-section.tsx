import Image from "next/image";

import styles from "./home-page.module.css";

const benefits = [
  {
    title: "Chủ động chọn giống",
    description: "Bạn bắt đầu với giống rau phù hợp thay vì nhận một lựa chọn được định sẵn.",
  },
  {
    title: "Theo dõi quá trình trồng",
    description: "Thông tin từng khay được tập trung để bạn dễ dàng theo dõi từ xa.",
  },
  {
    title: "Trải nghiệm nông nghiệp đô thị",
    description: "Gần hơn với hành trình của thực phẩm tươi ngay trong nhịp sống thành phố.",
  },
];

export function WhySmartfarmSection() {
  return (
    <section className="bg-[#F5F3EB] py-24 md:py-32 lg:py-40">
      <div className={`mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 ${styles.reveal}`}>
        <h2 className={`max-w-5xl text-[#19382B] ${styles.sectionTitle}`}>Khoảng xanh giữa lòng đô thị</h2>

        <div className="relative mt-14 aspect-[16/9] min-h-[26rem] overflow-hidden rounded-[1.5rem] bg-[#DDE2D7] md:mt-20 md:aspect-[16/7]">
          <Image
            src="/images/home/microgreen-care.png"
            alt="Người chăm sóc đang kiểm tra một khay rau mầm xanh"
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            className={`object-cover ${styles.imageLift}`}
          />
        </div>

        <div className="mt-12 grid gap-10 pt-2 md:grid-cols-[1.3fr_1fr_1fr] md:gap-14">
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#19382B]">{benefit.title}</h3>
              <p className="mt-3 max-w-sm text-base leading-7 text-[#626A62]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
