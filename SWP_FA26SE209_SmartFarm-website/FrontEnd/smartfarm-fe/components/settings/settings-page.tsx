"use client";

import { useState } from "react";
import {
  Building2,
  ClipboardList,
  ShoppingBag,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { FarmInformation } from "@/components/settings/farm-information";
import { EnvironmentThresholds } from "@/components/settings/environment-thresholds";
import { SalesSettings } from "@/components/settings/sales-settings";
import { OperationLog } from "@/components/settings/operation-log";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "@/lib/settings";

const sections: {
  value: SettingsSection;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "farm", label: "Thông tin nông trại", icon: Building2 },
  { value: "thresholds", label: "Ngưỡng môi trường", icon: Thermometer },
  { value: "sales", label: "Bán hàng", icon: ShoppingBag },
  { value: "logs", label: "Nhật ký thao tác", icon: ClipboardList },
];

function SettingsContent() {
  const [section, setSection] = useState<SettingsSection>("farm");

  return (
    <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1F2937]">
            Cài đặt
          </h1>
          <p className="mt-1.5 text-base text-[#6B7280]">
            Quản lý thông tin nông trại và tùy chọn hệ thống.
          </p>
        </header>

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-7">
          <aside
            aria-label="Danh mục cài đặt"
            className="rounded-2xl border border-[#E2E8E4] bg-white p-2 shadow-[0_1px_4px_rgba(36,74,48,0.05)] lg:sticky lg:top-28"
          >
            <div
              role="tablist"
              aria-orientation="vertical"
              className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1"
            >
              {sections.map((item) => {
                const Icon = item.icon;
                const active = section === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`settings-panel-${item.value}`}
                    onClick={() => setSection(item.value)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-[#3F4B44] transition-colors hover:bg-[#F3F8F4] hover:text-[#3F7655] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4F8F68]",
                      active && "bg-[#E8F3EB] font-semibold text-[#4F8F68]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 text-[#8AA994]",
                        active && "text-[#4F8F68]",
                      )}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            id={`settings-panel-${section}`}
            role="tabpanel"
            aria-label={sections.find((item) => item.value === section)?.label}
            className="min-w-0"
          >
            {section === "farm" && <FarmInformation />}
            {section === "thresholds" && <EnvironmentThresholds />}
            {section === "sales" && <SalesSettings />}
            {section === "logs" && <OperationLog />}
          </div>
        </div>
      </div>
    </main>
  );
}

export function SettingsPage() {
  return <SettingsContent />;
}
