"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

import {
  getAuthErrorMessage,
  notificationService,
  notificationsChangedEvent,
  type CustomerNotification,
} from "@/lib/api";
import { PageHeader } from "@/components/user/user-ui";
import { displayValue, notificationTypeLabel } from "@/lib/user-format";

const pageSize = 10;
type ReadFilter = "all" | "unread" | "read";

function dateTime(value: string | null) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có thông tin" : date.toLocaleString("vi-VN");
}

function filterValue(filter: ReadFilter) {
  if (filter === "unread") return false;
  if (filter === "read") return true;
  return undefined;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [selected, setSelected] = useState<CustomerNotification | null>(null);
  const [filter, setFilter] = useState<ReadFilter>("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void notificationService.getNotifications({
      isRead: filterValue(filter),
      page,
      pageSize,
    }).then((result) => {
      if (!active) return;
      setNotifications(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(1, result.totalPages));
    }).catch((requestError) => {
      if (!active) return;
      setNotifications([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(getAuthErrorMessage(requestError, "Không thể tải danh sách thông báo."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filter, page, refreshVersion]);

  function changeFilter(nextFilter: ReadFilter) {
    setLoading(true);
    setError("");
    setFilter(nextFilter);
    setPage(1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  async function openNotification(notification: CustomerNotification) {
    setSelected(notification);
    if (notification.isRead) return;
    setMarkingId(notification.notificationId);
    setError("");
    try {
      const marked = await notificationService.markAsRead(notification.notificationId);
      setSelected(marked);
      setNotifications((current) => current.map((item) => item.notificationId === marked.notificationId ? marked : item));
      window.dispatchEvent(new Event(notificationsChangedEvent));
      setLoading(true);
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể đánh dấu thông báo đã đọc."));
    } finally {
      setMarkingId(null);
    }
  }

  return <div className="mx-auto max-w-3xl px-6 py-10">
    <PageHeader title="Thông báo" subtitle={`${totalItems} thông báo theo bộ lọc hiện tại`} />

    <div className="mb-6 flex flex-wrap gap-2" aria-label="Lọc thông báo">
      {(["all", "unread", "read"] as const).map((value) => <button key={value} type="button" onClick={() => changeFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === value ? "bg-[#4F8F68] text-white" : "border border-[#e8f3eb] bg-white text-[#6b7280]"}`}>{value === "all" ? "Tất cả" : value === "unread" ? "Chưa đọc" : "Đã đọc"}</button>)}
    </div>

    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-[#EF5350]">{error}</p>}
    {loading ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải thông báo...</div> : error && notifications.length === 0 ? null : notifications.length === 0 ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center"><Bell className="mx-auto text-[#4F8F68]" /><h2 className="mt-4 font-bold">Không có thông báo</h2><p className="mt-2 text-sm text-[#6b7280]">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p></div> : <div className="space-y-3">{notifications.map((item) => <button key={item.notificationId} type="button" disabled={markingId === item.notificationId} onClick={() => { void openNotification(item); }} className={`flex w-full gap-4 rounded-2xl border p-5 text-left disabled:opacity-60 ${item.isRead ? "border-[#e8f3eb] bg-white" : "border-[#4F8F68]/30 bg-[#f3fdf7]"}`}><Bell className="shrink-0 text-[#4F8F68]" size={20} /><span className="flex-1"><strong className="block text-sm">{item.title ?? "Thông báo"}</strong><span className="mt-1 block text-sm text-[#6b7280]">{displayValue(item.message)}</span><span className="mt-2 block text-xs font-medium text-[#4F8F68]">{notificationTypeLabel(item.type)}</span></span><span className="text-xs text-[#9ca3af]">{dateTime(item.sentAt ?? item.createdAt)}</span></button>)}</div>}

    {!loading && !error && totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></div>}

    {selected && <div role="dialog" aria-modal="true" aria-labelledby="notification-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Đóng" onClick={() => setSelected(null)} className="float-right p-1"><X size={20} /></button><p className="text-xs text-[#6b7280]">{dateTime(selected.sentAt ?? selected.createdAt)}</p><h2 id="notification-title" className="mt-3 text-xl font-bold">{selected.title ?? "Thông báo"}</h2><p className="mt-4 text-sm leading-6">{displayValue(selected.message)}</p></div></div>}
  </div>;
}
