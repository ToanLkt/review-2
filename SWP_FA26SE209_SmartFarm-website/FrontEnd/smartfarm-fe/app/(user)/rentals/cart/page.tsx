import { CustomerOnly } from "@/components/auth/customer-only";
import { RentalCartPage } from "@/components/rental-cart/rental-cart-page";

export default function Page() {
  return <CustomerOnly><RentalCartPage /></CustomerOnly>;
}
