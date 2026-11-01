/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";

import {
  ApiError,
  cameraService,
  getAuthErrorMessage,
  resolveCameraImageUrl,
  type CameraSnapshot,
} from "@/lib/api";

const historyPageSize = 6;

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có thông tin" : date.toLocaleString("vi-VN");
}

function SnapshotImage({ snapshot, className }: { snapshot: CameraSnapshot; className: string }) {
  const source = resolveCameraImageUrl(snapshot.imageUrl);
  if (!source) return <div className={`${className} flex items-center justify-center bg-[#f3f8f4] text-sm text-[#6b7280]`}>Chưa có hình ảnh</div>;
  return <img src={source} alt={`Ảnh camera lúc ${dateTime(snapshot.takenAt)}`} loading="lazy" className={`${className} object-cover`} />;
}

export function CameraSnapshotsPanel({ rentalId }: { rentalId: number }) {
  const [latest, setLatest] = useState<CameraSnapshot | null>(null);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState("");
  const [latestVersion, setLatestVersion] = useState(0);
  const [history, setHistory] = useState<CameraSnapshot[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let active = true;
    void cameraService.getLatest(rentalId).then((snapshot) => {
      if (active) setLatest(snapshot);
    }).catch((requestError) => {
      if (!active) return;
      if (requestError instanceof ApiError && requestError.status === 404) setLatest(null);
      else setLatestError(getAuthErrorMessage(requestError, "Không thể tải ảnh camera mới nhất."));
    }).finally(() => {
      if (active) setLatestLoading(false);
    });
    return () => { active = false; };
  }, [latestVersion, rentalId]);

  useEffect(() => {
    let active = true;
    void cameraService.getHistory(rentalId, { page: historyPage, pageSize: historyPageSize }).then((result) => {
      if (!active) return;
      setHistory(result.items);
      setHistoryTotalPages(Math.max(1, result.totalPages));
    }).catch((requestError) => {
      if (!active) return;
      if (requestError instanceof ApiError && (requestError.status === 403 || requestError.status === 404)) {
        setHistoryError("Không tìm thấy khay thuê này hoặc bạn không có quyền xem hình ảnh.");
      } else {
        setHistoryError(getAuthErrorMessage(requestError, "Không thể tải lịch sử hình ảnh."));
      }
    }).finally(() => {
      if (active) setHistoryLoading(false);
    });
    return () => { active = false; };
  }, [historyPage, rentalId]);

  function refreshLatest() {
    setLatestLoading(true);
    setLatestError("");
    setLatestVersion((value) => value + 1);
  }

  function changeHistoryPage(nextPage: number) {
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryPage(nextPage);
  }

  return <section className="mt-10 border-t border-[#e8f3eb] pt-8" aria-labelledby="camera-snapshots-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">Hình ảnh theo dõi</p><h2 id="camera-snapshots-title" className="mt-1 text-2xl font-bold">Hình ảnh khay</h2></div><button type="button" onClick={refreshLatest} disabled={latestLoading} className="inline-flex items-center gap-2 rounded-xl border border-[#4F8F68] px-4 py-2 text-sm font-semibold text-[#4F8F68] disabled:opacity-50"><RefreshCw size={16} className={latestLoading ? "animate-spin" : ""} />Làm mới ảnh</button></div>

    <div className="mt-6">
      <h3 className="font-bold">Ảnh mới nhất</h3>
      {latestLoading ? <div className="mt-3 rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải ảnh mới nhất...</div> : latestError ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-[#EF5350]">{latestError}</p> : !latest ? <div className="mt-3 rounded-2xl border border-dashed border-[#cfe2d4] p-12 text-center"><Camera className="mx-auto text-[#4F8F68]" /><p className="mt-3 text-sm text-[#6b7280]">Chưa có hình ảnh camera.</p></div> : <article className="mt-3 overflow-hidden rounded-2xl border border-[#e8f3eb] bg-white"><SnapshotImage snapshot={latest} className="aspect-video w-full" /><p className="p-4 text-sm text-[#6b7280]">Chụp lúc {dateTime(latest.takenAt)}</p></article>}
    </div>

    <div className="mt-8">
      <h3 className="font-bold">Lịch sử hình ảnh</h3>
      {historyLoading ? <div className="mt-3 rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải lịch sử hình ảnh...</div> : historyError ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-[#EF5350]">{historyError}</p> : history.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-[#cfe2d4] p-10 text-center text-sm text-[#6b7280]">Chưa có lịch sử hình ảnh.</div> : <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{history.map((snapshot) => <article key={snapshot.snapshotId} className="overflow-hidden rounded-2xl border border-[#e8f3eb] bg-white"><SnapshotImage snapshot={snapshot} className="aspect-video w-full" /><p className="p-3 text-xs text-[#6b7280]">{dateTime(snapshot.takenAt)}</p></article>)}</div>}
      {!historyLoading && !historyError && historyTotalPages > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button type="button" disabled={historyPage <= 1} onClick={() => changeHistoryPage(historyPage - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {historyPage}/{historyTotalPages}</span><button type="button" disabled={historyPage >= historyTotalPages} onClick={() => changeHistoryPage(historyPage + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></div>}
    </div>
  </section>;
}
