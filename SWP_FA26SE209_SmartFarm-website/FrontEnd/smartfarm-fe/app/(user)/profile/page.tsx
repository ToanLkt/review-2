import { CustomerOnly } from "@/components/auth/customer-only";
import { ProfilePage } from "@/components/profile/profile-page";

export default function Page() { return <CustomerOnly><ProfilePage /></CustomerOnly>; }
