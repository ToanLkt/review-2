"use client";

import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, MessageSquareText, Star } from "lucide-react";

import { getAuthErrorMessage, publicFarmService, type FarmRatings } from "@/lib/api";
import { SectionHeading } from "./home-ui";

export function TestimonialsSection() {
  const [ratings, setRatings] = useState<FarmRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void publicFarmService.getRatings(1, 6)
      .then((result) => { if (active) setRatings(result); })
      .catch((requestError) => { if (active) setError(getAuthErrorMessage(requestError, "Không thể tải đánh giá trang trại.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="py-20"><div className="mx-auto max-w-7xl px-6"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="Khách hàng chia sẻ" title="Đánh giá từ trải nghiệm thực tế" />{ratings && ratings.totalReviews > 0 && <p className="text-sm text-[#6b7280]"><strong className="text-xl text-[#1a2e1f]">{ratings.averageRating.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}/5</strong> từ {ratings.totalReviews} đánh giá</p>}</div>{loading ? <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#f3f8f4] p-12 text-sm text-[#6b7280]"><LoaderCircle size={18} className="animate-spin" />Đang tải đánh giá...</div> : error ? <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-[#b91c1c]"><CircleAlert size={18} />{error}</div> : !ratings?.items.length ? <div className="rounded-2xl bg-[#f3f8f4] p-12 text-center"><MessageSquareText size={34} className="mx-auto text-[#4F8F68]" /><h3 className="mt-4 font-bold">Chưa có đánh giá</h3><p className="mt-2 text-sm text-[#6b7280]">Đánh giá từ các đơn đã hoàn thành sẽ xuất hiện tại đây.</p></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{ratings.items.map((item) => <article key={item.reviewId} className="flex flex-col rounded-2xl bg-[#f3f8f4] p-6"><div className="flex gap-1 text-[#F59E0B]" aria-label={`${item.rating} trên 5 sao`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} fill={index < item.rating ? "currentColor" : "none"} />)}</div><blockquote className="my-6 flex-1 text-sm leading-7 text-[#374151]">“{item.comment || "Khách hàng đã đánh giá trải nghiệm tại SmartFarm."}”</blockquote><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#E8F3EB] text-sm font-bold text-[#4F8F68]">{item.customerName.trim().charAt(0).toUpperCase() || "K"}</div><div><p className="text-sm font-semibold">{item.customerName || "Khách hàng SmartFarm"}</p><p className="text-xs text-[#6b7280]">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p></div></div></article>)}</div>}</div></section>;
}
