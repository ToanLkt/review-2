import { CustomerOnly } from "@/components/auth/customer-only";
import { MyTraysPage } from "@/components/my-trays/my-trays-page";

export default function Page() { return <CustomerOnly><MyTraysPage /></CustomerOnly>; }
