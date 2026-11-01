"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Leaf, LogIn, LogOut, Menu, Search, ShoppingCart, UserPlus, X } from "lucide-react";
import { signInPath } from "@/lib/auth";
import { navLinks, publicNavLinks } from "@/lib/home";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { notificationService, notificationsChangedEvent } from "@/lib/api";

export function UserHeader() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user: sessionUser, status, logout } = useCustomerAuth();
  const hasCustomerSession = status === "authenticated";
  const visibleNavLinks = hasCustomerSession ? navLinks : publicNavLinks;
  const rentHref = hasCustomerSession ? "/rent-tray" : signInPath("/rent-tray");
  const avatarInitial = sessionUser?.fullName?.trim().charAt(0).toUpperCase() || "N";
  const isNavActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  useEffect(() => {
    if (!hasCustomerSession) return;
    let active = true;
    async function refreshUnreadCount() {
      try {
        const count = await notificationService.getUnreadCount();
        if (active) setUnreadNotifications(count);
      } catch {
        if (active) setUnreadNotifications(null);
      }
    }
    const handleNotificationsChanged = () => { void refreshUnreadCount(); };
    void refreshUnreadCount();
    window.addEventListener(notificationsChangedEvent, handleNotificationsChanged);
    return () => {
      active = false;
      window.removeEventListener(notificationsChangedEvent, handleNotificationsChanged);
    };
  }, [hasCustomerSession, pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Local session is cleared by the service even if Backend logout fails.
    } finally {
      setOpen(false);
      setLoggingOut(false);
      router.replace("/sign-in");
    }
  }

  return <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-white focus:p-3">Đi đến nội dung chính</a>
    <header className="sticky top-0 z-50 h-16 border-b border-[#e8f3eb] bg-white/[.92] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-6 xl:px-8">
        <Link href="/" aria-label="SmartFarm, trang chủ" className="flex shrink-0 items-center gap-2.5 font-bold text-[#1a2e1f]"><span className="flex size-8 items-center justify-center rounded-lg bg-[#4F8F68] text-white"><Leaf size={19} /></span><span className="text-base">SmartFarm</span></Link>
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex">{visibleNavLinks.map((item) => <Link key={item.href} href={item.href} aria-current={isNavActive(item.href) ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isNavActive(item.href) ? "bg-[#E8F3EB] text-[#4F8F68]" : "text-[#6b7280] hover:bg-[#f3f8f4] hover:text-[#4F8F68]"}`}>{item.label}</Link>)}</nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/seeds" aria-label="Tìm kiếm hạt giống" className="rounded-lg p-2 text-[#6b7280] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><Search size={19} /></Link>
          {hasCustomerSession && <Link href="/notifications" aria-label={unreadNotifications ? `Thông báo, ${unreadNotifications} chưa đọc` : "Thông báo"} className="relative rounded-lg p-2 text-[#6b7280] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><Bell size={19} />{unreadNotifications !== null && unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#EF5350] px-1 text-center text-[10px] font-bold leading-4 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>}
          {hasCustomerSession && <Link href="/orders" aria-label="Giỏ hàng" title="Giỏ hàng" className="rounded-lg p-2 text-[#6b7280] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><ShoppingCart size={19} /></Link>}
          {hasCustomerSession && <Link href="/profile" aria-label="Tài khoản" className="hidden size-8 items-center justify-center rounded-full bg-[#E8F3EB] text-xs font-bold text-[#4F8F68] sm:flex">{avatarInitial}</Link>}
          {hasCustomerSession ? <button type="button" onClick={handleLogout} disabled={loggingOut} aria-label="Đăng xuất" title="Đăng xuất" className="hidden items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-[#6b7280] transition-colors hover:bg-[#E8F3EB] hover:text-[#4F8F68] disabled:opacity-60 lg:inline-flex"><LogOut size={18} /><span className="hidden xl:inline">{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span></button> : <><Link href="/sign-in" aria-label="Đăng nhập" title="Đăng nhập" className="hidden items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-[#6b7280] transition-colors hover:bg-[#E8F3EB] hover:text-[#4F8F68] lg:inline-flex"><LogIn size={18} /><span className="hidden xl:inline">Đăng nhập</span></Link><Link href="/sign-up" aria-label="Đăng ký" title="Đăng ký" className="hidden items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-[#6b7280] transition-colors hover:bg-[#E8F3EB] hover:text-[#4F8F68] lg:inline-flex"><UserPlus size={18} /><span className="hidden xl:inline">Đăng ký</span></Link></>}
          <Link href={rentHref} className="ml-1 hidden whitespace-nowrap rounded-xl bg-[#4F8F68] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3F7655] sm:inline-flex lg:hidden xl:inline-flex">Thuê khay ngay</Link>
          <button type="button" aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} aria-controls="user-mobile-nav" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-[#1a2e1f] lg:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {open && <nav id="user-mobile-nav" aria-label="Điều hướng di động" className="border-b border-[#e8f3eb] bg-white px-6 pb-4 pt-2 shadow-sm lg:hidden">{visibleNavLinks.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`block rounded-lg px-3 py-3 text-sm font-medium ${isNavActive(item.href) ? "bg-[#E8F3EB] text-[#4F8F68]" : "text-[#374151]"}`}>{item.label}</Link>)}<Link href={rentHref} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-[#4F8F68]">Thuê khay ngay</Link>{hasCustomerSession ? <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-[#374151] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><LogOut size={18} />Đăng xuất</button> : <><Link href="/sign-in" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><LogIn size={18} />Đăng nhập</Link><Link href="/sign-up" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#E8F3EB] hover:text-[#4F8F68]"><UserPlus size={18} />Đăng ký</Link></>}</nav>}
    </header>
  </>;
}
