"use client";

import { BellRing, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsCard, ToggleRow } from "@/components/settings/settings-ui";
import { useSettings } from "@/components/settings/settings-provider";
import type { NotificationSettings as NotificationSettingsModel } from "@/lib/settings";

export function NotificationSettings() {
  const { notifications, setNotifications } = useSettings();
  const toggle = (key: keyof NotificationSettingsModel, checked: boolean) =>
    setNotifications((current) => ({ ...current, [key]: checked }));

  return (
    <SettingsCard title="Cài đặt thông báo">
      <div className="p-5 sm:p-6">
        <section aria-labelledby="in-app-notifications">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]">
              <BellRing className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="in-app-notifications" className="font-semibold text-[#1F2937]">
                Thông báo trong ứng dụng
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                Cảnh báo vận hành quan trọng sẽ luôn được hiển thị, không thể tắt.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ToggleRow
              id="notification-environment"
              title="Cảnh báo môi trường"
              description="Nhiệt độ, độ ẩm vượt ngưỡng cấu hình"
              badge="Quan trọng"
              checked={notifications.environmentAlert}
              onCheckedChange={(checked) => toggle("environmentAlert", checked)}
            />
            <ToggleRow
              id="notification-device"
              title="Thiết bị mất kết nối"
              description="Cảm biến hoặc thiết bị điều khiển mất tín hiệu"
              badge="Quan trọng"
              checked={notifications.deviceDisconnected}
              onCheckedChange={(checked) => toggle("deviceDisconnected", checked)}
            />
            <ToggleRow
              id="notification-harvest"
              title="Nhắc nhở thu hoạch"
              description="Lô trồng sắp đến ngày thu hoạch"
              checked={notifications.harvestReminder}
              onCheckedChange={(checked) => toggle("harvestReminder", checked)}
            />
            <ToggleRow
              id="notification-order"
              title="Đơn hàng mới"
              description="Có đơn hàng mới cần xác nhận"
              checked={notifications.newOrder}
              onCheckedChange={(checked) => toggle("newOrder", checked)}
            />
          </div>
        </section>

        <section aria-labelledby="email-notifications" className="mt-7 border-t border-[#E2E8E4] pt-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <h3 id="email-notifications" className="font-semibold text-[#1F2937]">
              Thông báo qua Email
            </h3>
          </div>
          <div className="mt-4">
            <ToggleRow
              id="email-daily-environment"
              title="Báo cáo môi trường hàng ngày"
              description="Nhận tóm tắt môi trường vào 18:00 mỗi ngày"
              checked={notifications.dailyEnvironmentEmail}
              onCheckedChange={(checked) => toggle("dailyEnvironmentEmail", checked)}
            />
            <ToggleRow
              id="email-device"
              title="Thiết bị mất kết nối"
              description="Email ngay khi thiết bị mất kết nối"
              checked={notifications.disconnectedEmail}
              onCheckedChange={(checked) => toggle("disconnectedEmail", checked)}
            />
            <ToggleRow
              id="email-order"
              title="Đơn hàng mới"
              description="Email khi có đơn hàng mới"
              checked={notifications.newOrderEmail}
              onCheckedChange={(checked) => toggle("newOrderEmail", checked)}
            />
          </div>
        </section>

        <div className="mt-6 flex justify-end border-t border-[#E2E8E4] pt-5">
          <Button
            type="button"
            className="h-10 rounded-xl px-5"
            onClick={() => toast.success("Đã lưu cài đặt thông báo.")}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}
