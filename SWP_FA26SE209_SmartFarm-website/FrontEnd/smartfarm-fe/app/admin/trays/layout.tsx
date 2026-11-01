import { OperationsDialogs } from "@/components/operations/trays/operations-dialogs";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <OperationsDialogs>{children}</OperationsDialogs>;
}
