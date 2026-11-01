"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, ChevronDown, Grid2X2, LayoutDashboard, Leaf, ListChecks, LogOut,
  CreditCard, Microchip, PackageCheck, Radio, Search, ShieldAlert,
  Sprout, Tractor, Truck, Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/customer-auth-provider";
import type { UserResponse } from "@/lib/api";
import { notificationService, notificationsChangedEvent } from "@/lib/api";

export const staffNavigation: { label: string; items: { label: string; path: string; icon: LucideIcon }[] }[] = [
  { label: "TỔNG QUAN", items: [{ label: "Dashboard", path: "dashboard", icon: LayoutDashboard }] },
  { label: "VẬN HÀNH", items: [
    { label: "Khu vực & khay trồng", path: "trays", icon: Grid2X2 },
    { label: "Canh tác", path: "cultivation", icon: Leaf },
    { label: "Giám sát môi trường", path: "environment", icon: Radio },
    { label: "Thiết bị IoT", path: "devices", icon: Microchip },
    { label: "Kho", path: "inventory", icon: Warehouse },
    { label: "Công việc", path: "tasks", icon: ListChecks },
  ] },
  { label: "KINH DOANH", items: [{ label: "Đơn hàng", path: "orders", icon: PackageCheck }, { label: "Thanh toán", path: "payments", icon: CreditCard }, { label: "Giao hàng", path: "deliveries", icon: Truck }] },
  { label: "HỖ TRỢ", items: [{ label: "Thông báo", path: "notifications", icon: Bell }, { label: "Cảnh báo", path: "alerts", icon: ShieldAlert }] },
];

type StaffAccountProps = {
  user: UserResponse | null;
  loggingOut: boolean;
  onLogout: () => void;
};

function accountName(user: UserResponse | null) {
  return user?.fullName || user?.email || "Nhân viên SmartFarm";
}

function accountInitials(user: UserResponse | null) {
  return accountName(user).split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "NV";
}

function StaffSidebar({ user, loggingOut, onLogout }: StaffAccountProps) {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  return <Sidebar collapsible="icon" className="mint-sidebar">
    <SidebarHeader className="px-5 pt-7 pb-6 group-data-[collapsible=icon]:px-2">
      <Link href="/staff/dashboard" className="flex items-center gap-2.5" aria-label="SmartFarm vận hành nông trại">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Sprout className="size-5" /></span>
        <span className="group-data-[collapsible=icon]:hidden"><span className="block text-xl font-bold tracking-tight text-[#315d42]">SmartFarm<span className="text-primary">.</span></span><span className="text-[10px] text-muted-foreground">Vận hành nông trại</span></span>
      </Link>
    </SidebarHeader>
    <SidebarContent className="gap-2 px-3 group-data-[collapsible=icon]:px-1">
      {staffNavigation.map((group) => <SidebarGroup key={group.label} className="p-0">
        <SidebarGroupLabel className="mb-1 h-6 text-[9px] font-semibold tracking-[.14em] text-[#718477]">{group.label}</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">{group.items.map((item) => {
          const active = path === `/staff/${item.path}` || path.startsWith(`/staff/${item.path}/`);
          return <SidebarMenuItem key={item.path}><SidebarMenuButton asChild isActive={active} tooltip={item.label} className="relative h-9 rounded-lg px-3 text-[12px] data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary"><Link href={`/staff/${item.path}`} onClick={() => setOpenMobile(false)}><item.icon className="size-4" strokeWidth={1.65} /><span>{item.label}</span></Link></SidebarMenuButton></SidebarMenuItem>;
        })}</SidebarMenu>
      </SidebarGroup>)}
    </SidebarContent>
    <SidebarFooter className="mt-4 flex-row items-center gap-1 border-t border-white/70 px-3 py-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-1">
      <Link href="/staff/profile" onClick={() => setOpenMobile(false)} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-2 hover:bg-white/70 group-data-[collapsible=icon]:flex-none"><Avatar className="size-8 shrink-0"><AvatarFallback className="bg-primary text-[10px] text-white">{accountInitials(user)}</AvatarFallback></Avatar><span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block truncate text-xs font-semibold">{accountName(user)}</span><span className="block truncate text-[10px] text-muted-foreground">Nhân viên vận hành</span></span></Link>
      <button type="button" onClick={onLogout} disabled={loggingOut} aria-label={loggingOut ? "Đang đăng xuất" : "Đăng xuất"} title="Đăng xuất" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/70 hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"><LogOut className="size-4" /></button>
    </SidebarFooter>
  </Sidebar>;
}

function StaffHeader({ user, loggingOut, onLogout }: StaffAccountProps) {
  const path = usePathname(); const router = useRouter(); const [query, setQuery] = useState(""); const [unread, setUnread] = useState<number | null>(null);
  useEffect(() => { let active = true; const load = () => { void notificationService.getUnreadCount().then((value) => { if (active) setUnread(value); }).catch(() => { if (active) setUnread(null); }); }; load(); window.addEventListener(notificationsChangedEvent, load); return () => { active = false; window.removeEventListener(notificationsChangedEvent, load); }; }, []);
  const currentGroup = staffNavigation.find(group => group.items.some(item => path === `/staff/${item.path}` || path.startsWith(`/staff/${item.path}/`)));
  const current = currentGroup?.items.find(item => path === `/staff/${item.path}` || path.startsWith(`/staff/${item.path}/`))?.label ?? "Thông tin cá nhân";
  const section = currentGroup?.label.replace(/\p{L}+/gu, word => word.charAt(0) + word.slice(1).toLocaleLowerCase("vi")) ?? "Vận hành";
  function search(e: React.FormEvent) { e.preventDefault(); if (query.trim()) router.push(`/staff/trays?q=${encodeURIComponent(query.trim())}`); }
  return <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-border bg-white px-4 sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-2"><SidebarTrigger className="size-9 shrink-0 rounded-lg" aria-label="Đóng hoặc mở thanh điều hướng" title="Đóng hoặc mở thanh điều hướng" /><nav className="truncate text-sm"><span className="hidden text-muted-foreground lg:inline">{section}</span><span className="hidden px-2 text-slate-300 lg:inline">/</span><span className="font-semibold">{current}</span></nav></div>
    <form onSubmit={search} className="hidden w-full max-w-[390px] md:block"><div className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8BAA97]" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm vụ trồng, khay, thiết bị..." className="h-[42px] rounded-[13px] border-border pl-9 shadow-none" /></div></form>
    <div className="ml-auto flex items-center gap-2"><Button asChild variant="ghost" size="icon" className="relative"><Link href="/staff/notifications?tab=mine" aria-label={unread ? `${unread} thông báo chưa đọc` : "Thông báo của tôi"}><Bell className="size-[18px]"/>{unread !== null && unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-bold leading-4 text-white">{unread > 99 ? "99+" : unread}</span>}</Link></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 gap-2 px-1.5"><Avatar className="size-7"><AvatarFallback className="bg-primary text-[10px] text-white">{accountInitials(user)}</AvatarFallback></Avatar><span className="hidden text-left sm:block"><span className="block text-xs font-semibold">{accountName(user)}</span><span className="block text-[10px] text-muted-foreground">Nhân viên</span></span><ChevronDown className="size-3.5 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel>{accountName(user)}</DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuItem onClick={() => router.push("/staff/profile")}>Thông tin cá nhân</DropdownMenuItem><DropdownMenuItem onClick={() => router.push("/staff/profile")}>Đổi mật khẩu</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem disabled={loggingOut} onSelect={onLogout} className="text-destructive">{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
  </header>;
}

export function StaffShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const { logout, user } = useAuth();
  useEffect(() => { const media = window.matchMedia("(min-width: 1280px)"); const update = () => setOpen(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Auth service still clears local tokens if Backend logout fails.
    } finally {
      router.replace("/sign-in");
    }
  }
  return <SidebarProvider open={open} onOpenChange={setOpen} style={{ "--sidebar-width": "248px" } as React.CSSProperties}><StaffSidebar user={user} loggingOut={loggingOut} onLogout={() => void handleLogout()} /><SidebarInset className="min-w-0 bg-background"><StaffHeader user={user} loggingOut={loggingOut} onLogout={() => void handleLogout()} />{children}</SidebarInset></SidebarProvider>;
}

export function StaffForbidden() { const router = useRouter(); return <main className="grid min-h-[calc(100dvh-80px)] place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-destructive"><Tractor /></span><h1 className="mt-5 text-2xl font-bold">Bạn không có quyền truy cập</h1><p className="mt-2 text-sm text-muted-foreground">Khu vực này chỉ dành cho quản trị viên SmartFarm.</p><Button className="mt-5" onClick={() => router.push("/staff/dashboard")}>Quay lại</Button></div></main>; }
