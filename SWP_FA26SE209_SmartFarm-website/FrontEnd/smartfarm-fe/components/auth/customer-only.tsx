import { RoleOnly } from "./role-only";

export function CustomerOnly({ children }: { children: React.ReactNode }) {
  return <RoleOnly role="user">{children}</RoleOnly>;
}
