import { CustomerOnly } from "@/components/auth/customer-only";
import { OrdersPage } from "@/components/user-orders/orders-page";

export default function Page() { return <CustomerOnly><OrdersPage /></CustomerOnly>; }
