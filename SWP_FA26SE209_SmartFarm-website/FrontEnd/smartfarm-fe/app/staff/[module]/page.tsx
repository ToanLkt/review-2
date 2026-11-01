import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StaffForbidden } from "@/components/staff/staff-shell";
import { StaffPage } from "@/components/staff/staff-page";

const pages = ["trays", "cultivation", "environment", "devices", "tasks", "inventory", "orders", "payments", "deliveries", "notifications", "alerts"] as const;
export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (module === "cycles") redirect("/staff/trays?tab=cycles");
  return pages.includes(module as (typeof pages)[number]) ? <Suspense fallback={null}><StaffPage page={module as (typeof pages)[number]} /></Suspense> : <StaffForbidden />;
}
