"use client";
import { useRef, useState } from "react";
import { Plus, Microchip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevices } from "@/components/devices/devices-provider";
import { RuleCard } from "./rule-card";
import { RuleFormSheet } from "./rule-form-sheet";
import { AutomationHistory } from "./automation-history";
import { ConfigurationConfirmation } from "./configuration-confirmation";
export function AutomationPage() {
  const { devices, rules, saveAutomation, retryAutomation } = useDevices();
  const [panel, setPanel] = useState<string | null>(null),
    [toggle, setToggle] = useState<{ id: string; enabled: boolean } | null>(
      null,
    );
  const trigger = useRef<HTMLElement | null>(null),
    heading = useRef<HTMLHeadingElement | null>(null);
  function open(id: string) {
    trigger.current = document.activeElement as HTMLElement;
    setPanel(id);
  }
  function returnFocus() {
    if (trigger.current?.isConnected) trigger.current.focus();
    else heading.current?.focus();
  }
  const changing = rules.find((r) => r.id === toggle?.id);
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-6 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-1">
          <div>
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-[26px] font-bold tracking-tight"
            >
              Điều khiển tự động
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Thiết lập cách tưới, chiếu sáng và thông gió theo điều kiện môi trường.
            </p>
          </div>
          <Button onClick={() => open("create")}>
            <Plus />
            Tạo quy tắc
          </Button>
        </header>
        <aside className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-secondary/60 p-5 sm:p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
            <Microchip className="size-6" strokeWidth={1.6} />
          </span>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-secondary-foreground">
              Thông tin về trang này
            </h2>
            <p className="text-sm leading-6 text-secondary-foreground">
              Các quy tắc trên trang này chỉ dùng để xem trước. Thay đổi tại đây
              không làm thay đổi thiết bị trong nông trại.
            </p>
          </div>
        </aside>
        <section aria-label="Quy tắc tự động" className="space-y-5">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              devices={devices}
              onEdit={() => open(rule.id)}
              onToggle={(enabled) => setToggle({ id: rule.id, enabled })}
              onRetry={() => retryAutomation(rule.id)}
            />
          ))}
        </section>
        <AutomationHistory />
      </div>
      {panel && (
        <RuleFormSheet
          key={panel}
          rule={rules.find((r) => r.id === panel)}
          onClose={() => setPanel(null)}
          returnFocus={returnFocus}
        />
      )}
      {toggle && changing && (
        <ConfigurationConfirmation
          name={changing.requested.name}
          enabled={toggle.enabled}
          onClose={() => setToggle(null)}
          onConfirm={() => {
            saveAutomation(
              changing.id,
              { ...changing.requested, enabled: toggle.enabled },
              "send",
            );
            setToggle(null);
          }}
        />
      )}
    </main>
  );
}
