import { CustomerOnly } from "@/components/auth/customer-only";
import { CartPage } from "@/components/cart/cart-page";

export default function Page() { return <CustomerOnly><CartPage /></CustomerOnly>; }
