"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  getAuthLandingPath,
  normalizeAuthRole,
  signInPath,
  type AuthRole,
} from "@/lib/auth";
import { useAuth } from "./customer-auth-provider";

export function RoleOnly({
  role,
  children,
}: {
  role: AuthRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuth();
  const currentRole = normalizeAuthRole(user?.role);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") {
      router.replace(signInPath(`${window.location.pathname}${window.location.search}`));
      return;
    }
    if (currentRole !== role) {
      router.replace(getAuthLandingPath(user?.role) ?? "/sign-in");
    }
  }, [currentRole, pathname, role, router, status, user?.role]);

  if (status !== "authenticated" || currentRole !== role) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-sm text-[#6b7280]">Đang kiểm tra quyền truy cập...</div>;
  }

  return <>{children}</>;
}
