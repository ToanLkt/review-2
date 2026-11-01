import type { ReactNode } from "react";
import { VarietiesProvider } from "@/components/varieties/varieties-provider";
import { OperationsProvider } from "@/components/operations/shared/operations-provider";
import { OperationsRoutesProvider, staffOperationsRoutes } from "@/components/operations/shared/operations-routes";
import { OperationsDialogs } from "@/components/operations/trays/operations-dialogs";

export default function Layout({ children }: { children: ReactNode }) {
  return <VarietiesProvider>
    <OperationsProvider farmScope="staff">
      <OperationsRoutesProvider routes={staffOperationsRoutes}>
        <OperationsDialogs>{children}</OperationsDialogs>
      </OperationsRoutesProvider>
    </OperationsProvider>
  </VarietiesProvider>;
}
