import Image from "next/image";

import styles from "./home-page.module.css";

export function AboutSection() {
  return (
    <section className="bg-[#F5F3EB] py-24 md:py-32 lg:py-40">
      <div className={`mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 ${styles.reveal}`}>
        <div className="flex flex-col justify-between lg:col-span-5 lg:py-3">
          <div>
            <p className="text-sm font-semibold text-[#61705b]">Về SmartFarm</p>
            <h2 className={`mt-7 max-w-xl text-[#19382B] ${styles.sectionTitle}`}>Nông nghiệp đô thị của bạn</h2>
            <p className="mt-8 max-w-[34rem] text-base leading-8 text-[#566057] md:text-lg">
              Bạn chọn giống rau và số khay. SmartFarm chuẩn bị, chăm sóc và giúp bạn theo dõi hành trình phát triển từ xa.
            </p>
          </div>

          <dl className="mt-14 grid gap-10 pt-2 sm:grid-cols-2 lg:mt-20">
            <div>
              <dt className="text-base font-semibold text-[#19382B]">Không cần sân vườn</dt>
              <dd className="mt-2 text-base leading-7 text-[#697269]">Khay rau được vận hành trong môi trường trồng chuyên biệt.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-[#19382B]">Vẫn luôn chủ động</dt>
              <dd className="mt-2 text-base leading-7 text-[#697269]">Bạn chọn giống và theo dõi tiến độ tại trang Khay của tôi.</dd>
            </div>
          </dl>
        </div>

        <div className="relative min-h-[30rem] overflow-hidden rounded-[1.5rem] bg-[#DDE2D7] sm:min-h-[38rem] lg:col-span-7 lg:min-h-[48rem]">
          <Image
            src="/images/home/indoor-growing-racks.png"
            alt="Các khay rau mầm trên hệ thống kệ trồng trong nhà của SmartFarm"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className={`object-cover ${styles.imageLift}`}
          />
        </div>
      </div>
    </section>
  );
}
