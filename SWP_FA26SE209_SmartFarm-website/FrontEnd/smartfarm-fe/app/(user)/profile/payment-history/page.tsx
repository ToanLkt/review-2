import { CustomerOnly } from "@/components/auth/customer-only";
import { PaymentHistoryPage } from "@/components/profile/payment-history-page";
export default function Page() { return <CustomerOnly><PaymentHistoryPage /></CustomerOnly>; }
