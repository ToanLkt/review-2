import { StaffDeliveryDetail } from "@/components/staff/staff-delivery-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffDeliveryDetail id={id} basePath="/admin/deliveries" />;
}
