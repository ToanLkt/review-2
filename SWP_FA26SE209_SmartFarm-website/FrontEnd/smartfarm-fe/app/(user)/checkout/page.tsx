import { CustomerOnly } from "@/components/auth/customer-only";
import { CheckoutPage } from "@/components/checkout/checkout-page";

export default function Page() { return <CustomerOnly><CheckoutPage /></CustomerOnly>; }
