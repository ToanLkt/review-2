import { notFound } from "next/navigation";
import { CustomerOnly } from "@/components/auth/customer-only";
import { TrayDetailPage } from "@/components/my-trays/tray-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rentalId = Number(id);
  if (!Number.isInteger(rentalId) || rentalId <= 0) notFound();
  return <CustomerOnly><TrayDetailPage rentalId={rentalId} /></CustomerOnly>;
}
