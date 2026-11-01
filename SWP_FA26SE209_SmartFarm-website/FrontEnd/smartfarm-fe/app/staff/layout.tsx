import { StaffShell } from "@/components/staff/staff-shell";
import { AuthProvider } from "@/components/auth/customer-auth-provider";
import { RoleOnly } from "@/components/auth/role-only";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleOnly role="staff">
        <StaffShell>{children}</StaffShell>
      </RoleOnly>
    </AuthProvider>
  );
}
