import { notFound } from "next/navigation";
import { CustomerOnly } from "@/components/auth/customer-only";
import { ApiOrderDetailPage } from "@/components/user-orders/api-order-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();
  return <CustomerOnly><ApiOrderDetailPage id={orderId} /></CustomerOnly>;
}
