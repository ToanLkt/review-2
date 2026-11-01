import { CustomerOnly } from "@/components/auth/customer-only";
import { RentTrayConfigPage } from "@/components/rent-tray/rent-tray-config-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerOnly><RentTrayConfigPage seedId={id} /></CustomerOnly>;
}
