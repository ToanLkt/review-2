import { CustomerOnly } from "@/components/auth/customer-only";
import { RentTrayPage } from "@/components/rent-tray/rent-tray-page";

export default function Page() { return <CustomerOnly><RentTrayPage /></CustomerOnly>; }
