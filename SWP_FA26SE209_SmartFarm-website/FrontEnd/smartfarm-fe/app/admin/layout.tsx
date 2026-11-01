import { AdminShell } from "@/components/admin/admin-shell";
import { OperationsProvider } from "@/components/operations/shared/operations-provider";
import { VarietiesProvider } from "@/components/varieties/varieties-provider";
import { UsersProvider } from "@/components/admin-users/users-provider";
import { AuthProvider } from "@/components/auth/customer-auth-provider";
import { RoleOnly } from "@/components/auth/role-only";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RoleOnly role="admin">
          <VarietiesProvider>
            <OperationsProvider>
                <UsersProvider>
                    <AdminShell>{children}</AdminShell>
                </UsersProvider>
            </OperationsProvider>
          </VarietiesProvider>
      </RoleOnly>
    </AuthProvider>
  );
}
