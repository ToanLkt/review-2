"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleAlert, Sprout } from "lucide-react";

import { getAuthErrorMessage, seedService, type SeedVariety } from "@/lib/api";
import { formatVnd } from "@/lib/user-format";
import styles from "./home-page.module.css";

export function SeedPreviewSection() {
  const [seeds, setSeeds] = useState<SeedVariety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void seedService.getSeedVarieties({ page: 1, pageSize: 3 })
      .then((result) => {
        if (active) setSeeds(result.items);
      })
      .catch((requestError) => {
        if (active) setError(getAuthErrorMessage(requestError, "Không thể tải danh sách giống cây."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [requestVersion]);

  function retry() {
    setLoading(true);
    setError("");
    setRequestVersion((value) => value + 1);
  }

  return (
    <section className="bg-[#EAE8DC] py-24 md:py-32 lg:py-40" aria-busy={loading}>
      <div className={`mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 ${styles.reveal}`}>
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(20rem,7fr)] md:items-end md:gap-14">
          <div className="max-w-4xl">
            <h2 className={`text-[#19382B] ${styles.sectionTitle} ${styles.seedTitle}`}>Chọn giống rau bạn thích</h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#5F685F] md:text-lg">
              Khám phá các giống rau mầm đang có tại SmartFarm.
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-[#D7DDD1]">
            <Image
              src="/images/home/microgreen-radish-sunflower.png"
              alt="Khay rau mầm củ cải đỏ và hướng dương non trong nông trại trong nhà"
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
              className={`object-cover ${styles.imageLift}`}
            />
          </div>
        </div>

        <div className="mt-16 md:mt-24">
          {loading ? (
            <div className="space-y-0" aria-label="Đang tải giống rau">
              {[0, 1, 2].map((item) => (
                <div key={item} className="grid animate-pulse gap-5 py-8 md:grid-cols-[4rem_1fr_12rem] md:items-center">
                  <div className="h-4 w-8 rounded-full bg-[#19382B]/10" />
                  <div><div className="h-8 max-w-md rounded-lg bg-[#19382B]/10" /><div className="mt-4 h-4 max-w-xl rounded-lg bg-[#19382B]/10" /></div>
                  <div className="h-11 rounded-full bg-[#19382B]/10" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="flex flex-col items-start gap-5 py-14 text-[#7A2E2A] sm:flex-row sm:items-center">
              <CircleAlert size={24} strokeWidth={1.7} aria-hidden="true" />
              <div className="flex-1"><h3 className="font-semibold">Chưa thể tải giống rau</h3><p className="mt-1 text-base leading-7">{error}</p></div>
              <button type="button" onClick={retry} className="rounded-full border border-[#7A2E2A]/35 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#7A2E2A] hover:text-white">Thử lại</button>
            </div>
          ) : seeds.length === 0 ? (
            <div className="flex flex-col items-start gap-4 py-14 text-[#5F685F] sm:flex-row sm:items-center">
              <Sprout size={28} strokeWidth={1.6} className="text-[#19382B]" aria-hidden="true" />
              <div><h3 className="font-semibold text-[#19382B]">Chưa có giống rau để giới thiệu</h3><p className="mt-1 text-base">Danh mục sẽ xuất hiện tại đây khi có dữ liệu phù hợp.</p></div>
            </div>
          ) : (
            <div>
              {seeds.map((seed) => {
                const name = seed.name || `Giống cây #${seed.seedVarietyId}`;
                return (
                  <article key={seed.seedVarietyId} className="group grid gap-5 rounded-[1.25rem] px-5 py-8 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F5F3EB] md:grid-cols-[1fr_auto] md:items-center md:px-7 md:py-10">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#19382B] md:text-4xl">{name}</h3>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-[#626A62]">{seed.description || "Thông tin mô tả đang được SmartFarm cập nhật."}</p>
                      <p className="mt-4 text-sm font-medium text-[#596458]">{seed.growthDays} ngày phát triển <span aria-hidden="true">/</span> {formatVnd(seed.rentalPricePerTray)} mỗi khay</p>
                    </div>
                    <Link href={`/seeds/${seed.seedVarietyId}`} aria-label={`Xem chi tiết ${name}`} className="flex size-11 items-center justify-center rounded-full border border-[#19382B]/30 text-[#19382B] transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:bg-[#19382B] group-hover:text-[#F5F3EB]">
                      <ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <Link href="/seeds" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#19382B] transition-[gap] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gap-3">
          Xem toàn bộ hạt giống <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
