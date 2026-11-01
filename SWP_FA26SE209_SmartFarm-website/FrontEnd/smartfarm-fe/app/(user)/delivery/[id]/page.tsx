import { notFound } from "next/navigation";

import { CustomerOnly } from "@/components/auth/customer-only";
import { DeliveryDetailPage } from "@/components/delivery/delivery-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deliveryId = Number(id);
  if (!Number.isInteger(deliveryId) || deliveryId <= 0) notFound();
  return <CustomerOnly><DeliveryDetailPage id={deliveryId} /></CustomerOnly>;
}
