import { CustomerOnly } from "@/components/auth/customer-only";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default function Page() { return <CustomerOnly><NotificationsPage /></CustomerOnly>; }
