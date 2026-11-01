import { CustomerOnly } from "@/components/auth/customer-only";
import { DeliveryPage } from "@/components/delivery/delivery-page";

export default function Page() { return <CustomerOnly><DeliveryPage /></CustomerOnly>; }
