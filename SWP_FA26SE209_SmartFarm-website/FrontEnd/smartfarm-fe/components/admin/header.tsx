"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Grid2X2,
  ShoppingBag,
  Radio,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { dateTime } from "@/lib/formatters";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { AccountMenu } from "./account-menu";
import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import { notificationService, type CustomerNotification } from "@/lib/api/notification-service";
import type { SoilTray } from "@/lib/api/staff/staff-farm-service";
import type { IoTDevice } from "@/lib/api/staff/staff-iot-service";
import type { StaffOrder } from "@/lib/api/staff/staff-orders-service";
import { navigation } from "@/lib/navigation";
export function Header() {
  const [search, setSearch] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  useEffect(() => {
    let active = true;
    Promise.allSettled([notificationService.getNotifications({ page: 1, pageSize: 10 }), notificationService.getUnreadCount(), adminFarmService.trays(), staffOrdersService.list({ page: 1, pageSize: 20 }), staffIoTService.devices({ page: 1, pageSize: 20 })])
      .then(([page, count, trayRows, orderPage, devicePage]) => { if (active) {
        if (page.status === "fulfilled") setNotifications(page.value.items);
        if (count.status === "fulfilled") setUnreadCount(count.value);
        if (trayRows.status === "fulfilled") setTrays(trayRows.value);
        if (orderPage.status === "fulfilled") setOrders(orderPage.value.items);
        if (devicePage.status === "fulfilled") setDevices(devicePage.value.items);
      } });
    return () => { active = false; };
  }, []);
  async function markRead(notification: CustomerNotification) {
    if (notification.isRead) return;
    try { await notificationService.markAsRead(notification.notificationId); setNotifications((items) => items.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item)); setUnreadCount((count) => Math.max(0, count - 1)); }
    catch { /* Keep the unread state if the request fails. */ }
  }
  const navigationTitle =
    navigation
      .flatMap((g) => g.items)
      .find(
        (i) =>
          path === `/admin/${i.path}` || path.startsWith(`/admin/${i.path}/`),
      )?.label ?? "Thông tin tài khoản";
  const title =
    path === "/admin/reports" ? "Báo cáo & nhật ký" : navigationTitle;
  const groupLabel = navigation.find((group) =>
    group.items.some((item) => path === `/admin/${item.path}` || path.startsWith(`/admin/${item.path}/`)),
  )?.label;
  const section = ({
    "TỔNG QUAN": "Tổng quan",
    "VẬN HÀNH": "Vận hành",
    "KINH DOANH": "Kinh doanh",
    "HỖ TRỢ": "Hỗ trợ",
    "QUẢN TRỊ": "Quản trị",
    "HỆ THỐNG": "Hệ thống",
  } as Record<string, string>)[groupLabel ?? ""] ?? "Vận hành";
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((o) => !o);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  function go(path: string) {
    setSearch(false);
    router.push(path);
  }
  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-2 border-b border-border bg-white px-4 sm:px-6 md:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 md:shrink-0">
          <SidebarTrigger
            className="size-9 shrink-0 rounded-lg"
            aria-label="Đóng hoặc mở thanh điều hướng"
            title="Đóng hoặc mở thanh điều hướng"
          />
          <nav
            aria-label="Đường dẫn"
            className="flex min-w-0 items-center gap-2 whitespace-nowrap text-xs md:text-base"
          >
            <span className="hidden text-muted-foreground lg:inline">
              {section}
            </span>
            <span
              aria-hidden="true"
              className="hidden text-slate-300 lg:inline"
            >
              /
            </span>
            <span className="truncate font-semibold" title={title}>
              {title}
            </span>
          </nav>
        </div>
        <Button
          variant="outline"
          onClick={() => setSearch(true)}
          aria-label="Tìm kiếm vụ trồng, thiết bị"
          className="hidden h-[42px] w-[360px] min-w-0 shrink justify-start gap-3 rounded-[13px] border-border bg-white px-3.5 text-sm font-normal text-[#8BAA97] shadow-none hover:bg-muted/40 md:flex"
        >
          <Search className="size-[18px] shrink-0" />
          <span className="truncate">Tìm kiếm vụ trồng, thiết bị...</span>
        </Button>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm kiếm vụ trồng, thiết bị"
            className="size-8 text-[#8BAA97] md:hidden"
            onClick={() => setSearch(true)}
          >
            <Search className="size-[18px]" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Thông báo, ${unreadCount} chưa đọc`}
                className="relative size-8 text-muted-foreground"
              >
                <Bell className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(360px,calc(100vw-24px))]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Thông báo</h2>
                <Link href="/admin/alerts" className="text-xs text-primary hover:underline">Xem cảnh báo</Link>
              </div>
              {notifications.map((a) => (
                <button
                  key={a.notificationId}
                  type="button"
                  onClick={() => { void markRead(a); }}
                  className="block w-full rounded-lg p-3 text-left hover:bg-muted"
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    {a.title || "Thông báo"}
                    {!a.isRead && <span className="text-primary">Mới</span>}
                  </div>
                  <p className="subtle mt-1">
                    {a.message} · {dateTime(a.createdAt)}
                  </p>
                </button>
              ))}
              <p className="subtle mt-2 border-t pt-3">
                Thông báo được lấy từ tài khoản hiện tại.
              </p>
            </PopoverContent>
          </Popover>
          <AccountMenu compact />
        </div>
      </header>
      <CommandDialog
        open={search}
        onOpenChange={setSearch}
        title="Tìm kiếm SmartFarm"
        description="Tìm khay trồng, đơn hàng, thiết bị hoặc mô-đun."
      >
        <CommandInput
          placeholder="Nhập mã khay, khách hàng, đơn hàng..."
          aria-label="Từ khóa tìm kiếm"
        />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>
          <CommandGroup heading="Khay trồng">
            {trays.slice(0, 20).map((t) => (
              <CommandItem
                key={t.soilTrayId}
                value={`${t.trayCode} ${t.soilTrayId}`}
                onSelect={() => go("/admin/trays")}
              >
                <Grid2X2 />
                {t.trayCode}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Đơn hàng">
            {orders.map((o) => (
              <CommandItem
                key={o.orderId}
                value={`${o.orderCode} ${o.customerName}`}
                onSelect={() => go(`/admin/orders/${o.orderId}`)}
              >
                <ShoppingBag />
                {o.orderCode} · {o.orderType === "TRAY_RENTAL" ? "Thuê khay" : "Mua hạt giống"}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Thiết bị">
            {devices.map((d) => (
              <CommandItem
                key={d.deviceId}
                value={`${d.deviceCode} ${d.deviceId}`}
                onSelect={() =>
                  go(`/admin/devices?device=${encodeURIComponent(String(d.deviceId))}`)
                }
              >
                <Radio />
                {d.deviceCode}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Điều hướng">
            {navigation
              .flatMap((g) => g.items)
              .map((i) => (
                <CommandItem
                  key={i.path}
                  onSelect={() => go(`/admin/${i.path}`)}
                >
                  <i.icon />
                  {i.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
