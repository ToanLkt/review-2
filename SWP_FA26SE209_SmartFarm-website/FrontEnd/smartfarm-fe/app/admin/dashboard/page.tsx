import Dashboard from "./dashboard";
import { LiveDashboardProvider } from "@/components/dashboard/live-dashboard-provider";

export default function DashboardPage() {
  return <LiveDashboardProvider><Dashboard /></LiveDashboardProvider>;
}
