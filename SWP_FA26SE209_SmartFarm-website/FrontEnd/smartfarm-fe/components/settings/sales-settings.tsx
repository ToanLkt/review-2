"use client";

import Link from "next/link";
import { SettingsCard } from "@/components/settings/settings-ui";

export function SalesSettings() {
  return <SettingsCard title="Cấu hình bán hàng" description="Quản lý giá bán, giá thuê và thông tin giao hàng tại các mục sau.">
    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <Link href="/admin/products" className="rounded-xl border p-5 transition-colors hover:border-primary"><h3 className="font-semibold text-primary">Giá sản phẩm và thuê khay</h3><p className="mt-2 text-sm text-muted-foreground">Cập nhật giá bán và giá thuê theo chu kỳ trực tiếp trên từng vật tư, giống rau.</p></Link>
      <div className="rounded-xl border p-5"><h3 className="font-semibold text-primary">Thông tin nông trại</h3><p className="mt-2 text-sm text-muted-foreground">Chọn mục “Thông tin nông trại” bên trái để sửa bán kính giao hàng, ngưỡng ưu đãi và tài khoản chuyển khoản.</p></div>
    </div>
  </SettingsCard>;
}
