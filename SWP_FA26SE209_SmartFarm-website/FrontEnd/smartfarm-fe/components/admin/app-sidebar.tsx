"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Sprout } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useAuth } from "@/components/auth/customer-auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
export function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const name = user?.fullName || user?.email || "Quản trị viên";
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QT";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Local session is cleared by the auth provider when sign-out fails remotely.
    } finally {
      router.replace("/sign-in");
    }
  }

  return (
    <Sidebar collapsible="icon" className="mint-sidebar">
      <SidebarHeader className="px-5 pt-7 pb-6 group-data-[collapsible=icon]:px-2">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5"
          aria-label="SmartFarm · Tổng quan"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Sprout className="size-5" />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            <span className="block text-xl font-bold tracking-tight text-[#315d42]">
              SmartFarm<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Vận hành nông trại
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-2 px-3 group-data-[collapsible=icon]:px-1">
        {navigation.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="mb-1 h-6 text-[9px] font-semibold tracking-[.14em] text-[#718477]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      path === `/admin/${item.path}` ||
                      path.startsWith(`/admin/${item.path}/`)
                    }
                    tooltip={item.label}
                    className="relative h-9 rounded-lg px-3 text-[12px] data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary"
                  >
                    <Link
                      href={`/admin/${item.path}`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon className="size-4" strokeWidth={1.65} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="mt-4 flex-row items-center gap-1 border-t border-white/70 px-3 py-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-1">
        <Link href="/admin/profile" onClick={() => setOpenMobile(false)} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-2 hover:bg-white/70 group-data-[collapsible=icon]:flex-none">
          <Avatar className="size-8 shrink-0"><AvatarFallback className="bg-primary text-[10px] text-white">{initials}</AvatarFallback></Avatar>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block truncate text-xs font-semibold">{name}</span><span className="block truncate text-[10px] text-muted-foreground">Quản trị viên</span></span>
        </Link>
        <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} aria-label={loggingOut ? "Đang đăng xuất" : "Đăng xuất"} title="Đăng xuất" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/70 hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"><LogOut className="size-4" /></button>
      </SidebarFooter>
    </Sidebar>
  );
}
