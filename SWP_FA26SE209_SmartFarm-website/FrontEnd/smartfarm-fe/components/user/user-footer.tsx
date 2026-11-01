import Link from "next/link";
import { Clock3, Leaf, Mail, MapPin, Phone } from "lucide-react";
import { navLinks } from "@/lib/home";

const supportLinks = [
  { label: "Câu hỏi thường gặp", href: "/#faq" },
  { label: "Chính sách bảo mật", href: "/privacy" },
  { label: "Điều khoản", href: "/terms" },
  { label: "Hướng dẫn", href: "/#process" },
  { label: "Liên hệ", href: "mailto:hello@smartfarm.vn" },
];
const socialLinks = [
  { label: "Facebook", short: "FB", href: "https://www.facebook.com/" },
  { label: "Instagram", short: "IG", href: "https://www.instagram.com/" },
  { label: "YouTube", short: "YT", href: "https://www.youtube.com/" },
  { label: "TikTok", short: "TT", href: "https://www.tiktok.com/" },
];

export function UserFooter() {
  return <footer className="bg-[#1a2e1f] py-16 text-white"><div className="mx-auto max-w-7xl px-6">
    <div className="grid gap-10 md:grid-cols-4">
      <div><Link href="/" className="mb-5 flex items-center gap-2.5 font-bold"><span className="flex size-8 items-center justify-center rounded-lg bg-[#4F8F68]"><Leaf size={19} /></span>SmartFarm</Link><p className="max-w-52 text-sm leading-6 text-[#a3b8aa]">Nông nghiệp thông minh cho đô thị</p><div className="mt-5 flex gap-2">{socialLinks.map((social) => <a key={social.short} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="flex size-8 items-center justify-center rounded-lg bg-[#2a3f2f] text-[10px] font-bold text-[#a3b8aa] hover:text-white">{social.short}</a>)}</div></div>
      <div><h2 className="mb-5 text-sm font-semibold">Liên kết nhanh</h2><ul className="space-y-3">{navLinks.map((item) => <li key={item.href}><Link href={item.href} className="text-sm text-[#a3b8aa] hover:text-white">{item.label}</Link></li>)}</ul></div>
      <div><h2 className="mb-5 text-sm font-semibold">Liên hệ</h2><ul className="space-y-3 text-sm text-[#a3b8aa]"><li className="flex gap-2"><MapPin size={16} className="shrink-0" />TP. Hồ Chí Minh, Việt Nam</li><li className="flex gap-2"><Phone size={16} className="shrink-0" />Liên hệ qua email</li><li className="flex gap-2"><Mail size={16} className="shrink-0" />hello@smartfarm.vn</li><li className="flex gap-2"><Clock3 size={16} className="shrink-0" />Hỗ trợ hằng ngày</li></ul></div>
      <div><h2 className="mb-5 text-sm font-semibold">Hỗ trợ</h2><ul className="space-y-3">{supportLinks.map((item) => <li key={item.label}><Link href={item.href} className="text-sm text-[#a3b8aa] hover:text-white">{item.label}</Link></li>)}</ul></div>
    </div>
    <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#2a3f2f] pt-8 text-xs text-[#a3b8aa] sm:flex-row"><span>© {new Date().getFullYear()} SmartFarm.</span></div>
  </div></footer>;
}
