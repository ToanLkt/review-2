import { UserFooter } from "@/components/user/user-footer";
import { UserHeader } from "@/components/user/user-header";
import { CartProvider } from "@/components/user/cart-provider";
import { CustomerAuthProvider } from "@/components/auth/customer-auth-provider";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAuthProvider><CartProvider><div className="flex min-h-screen flex-col bg-white text-[#1a2e1f]"><UserHeader /><main id="main-content" className="flex-1">{children}</main><UserFooter /></div></CartProvider></CustomerAuthProvider>;
}
