"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/customer-auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const name = user?.fullName || user?.email || "Quản trị viên";
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QT";

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Auth service still clears local tokens if Backend logout fails.
    } finally {
      router.replace("/sign-in");
    }
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`Mở trình đơn tài khoản ${name}`}
            className={compact ? "shrink-0 rounded-full p-0.5 focus-visible:outline-primary" : "flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-secondary"}
          >
            <Avatar className={compact ? "size-[38px] ring-[3px] ring-secondary" : "size-9 border-2 border-white"}>
              <AvatarFallback className={compact ? "bg-primary text-base font-semibold text-white" : "bg-[#dce9dc] text-xs font-semibold text-primary"}>
                {compact ? initials.slice(0, 1) : initials}
              </AvatarFallback>
            </Avatar>
            {!compact && (
              <>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block text-xs font-semibold">
                    {name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Quản trị viên
                  </span>
                </span>
                <ChevronsUpDown className="size-3.5 group-data-[collapsible=icon]:hidden" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href="/admin/profile">
              <UserRound />
              Thông tin tài khoản
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/profile#change-password">
              <KeyRound />
              Đổi mật khẩu
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleLogout()}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
