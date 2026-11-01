"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  initialRules,
  applyRuleOwnership,
  validateRule,
  saveRule,
  retryRule,
  settleRule,
  type AutomationRule,
  type RuleConfig,
} from "@/lib/automation";
import {
  commandGuard,
  initialCommands,
  initialDevices,
  validateDevice,
  type Device,
  type DeviceCommand,
  type DeviceDraft,
} from "@/lib/devices";

type Store = {
  devices: Device[];
  commands: DeviceCommand[];
  rules: AutomationRule[];
};
type DeviceContextValue = Store & {
  add: (draft: DeviceDraft) => boolean;
  send: (id: string, requested: "on" | "off", duration?: number) => boolean;
  saveAutomation: (
    id: string | undefined,
    config: RuleConfig,
    mode: "draft" | "send",
  ) => boolean;
  retryAutomation: (id: string) => void;
};
const DeviceContext = createContext<DeviceContextValue | null>(null);
export function DevicesProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({
    devices: applyRuleOwnership(initialDevices, initialRules),
    commands: initialCommands,
    rules: initialRules,
  });
  const current = useRef(store);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sequence = useRef(1);
  const ruleSequence = useRef(3);
  function update(fn: (s: Store) => Store) {
    current.current = fn(current.current);
    current.current = {
      ...current.current,
      devices: applyRuleOwnership(
        current.current.devices,
        current.current.rules,
      ),
    };
    setStore(current.current);
  }
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );
  function simulateConfig(rule: AutomationRule) {
    if (!rule.inFlight) return;
    const change = (
      outcome: "waiting" | "acknowledged" | "failed",
      error?: string,
    ) =>
      update((s) => ({
        ...s,
        rules: s.rules.map((r) =>
          r.id === rule.id
            ? settleRule(
                r,
                rule.version,
                outcome,
                new Date().toISOString(),
                error,
              )
            : r,
        ),
      }));
    timers.current.push(setTimeout(() => change("waiting"), 650));
    const response = current.current.devices.find(
      (d) => d.id === rule.requested.outputId,
    )?.simulation;
    timers.current.push(
      setTimeout(
        () => {
          const latest = current.current.rules.find((r) => r.id === rule.id);
          if (!latest?.inFlight || latest.version !== rule.version) return;
          if (rule.attempts === 1 && response !== "success") {
            const message =
              response === "timeout"
                ? "Chưa thể cập nhật quy tắc. Thiết lập trước đó được giữ nguyên."
                : "Chưa thể cập nhật quy tắc. Thiết lập trước đó được giữ nguyên.";
            change("failed", message);
            toast.error(message);
          } else {
            change("acknowledged");
            toast.success("Đã cập nhật quy tắc.");
          }
        },
        response === "timeout" && rule.attempts === 1 ? 3500 : 1800,
      ),
    );
  }
  function saveAutomation(
    id: string | undefined,
    config: RuleConfig,
    mode: "draft" | "send",
  ) {
    const previous = current.current.rules.find((r) => r.id === id);
    const errors = validateRule(config, current.current.devices, previous);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    if (previous?.inFlight) {
      toast.error("Quy tắc đang chờ xác nhận.");
      return false;
    }
    const rule = saveRule(
      previous,
      id ?? `QT-${String(++ruleSequence.current).padStart(3, "0")}`,
      config,
      mode,
      new Date().toISOString(),
    );
    update((s) => ({
      ...s,
      rules: previous
        ? s.rules.map((r) => (r.id === rule.id ? rule : r))
        : [...s.rules, rule],
    }));
    if (mode === "draft")
      toast.success("Đã lưu bản nháp trong phiên này. Chưa gửi cấu hình.");
    else if (rule.status === "offline")
      toast.info(
        "Đã lưu thay đổi. Bộ điều khiển đang mất kết nối.",
      );
    else toast.info("Đang cập nhật quy tắc.");
    simulateConfig(rule);
    return true;
  }
  function retryAutomation(id: string) {
    const currentRule = current.current.rules.find((r) => r.id === id);
    if (!currentRule) return;
    try {
      const rule = retryRule(currentRule, new Date().toISOString());
      update((s) => ({
        ...s,
        rules: s.rules.map((r) => (r.id === id ? rule : r)),
      }));
      if (rule.status === "offline")
        toast.info("Bộ điều khiển vẫn mất kết nối.");
      else toast.info("Đang thử cập nhật lại quy tắc.");
      simulateConfig(rule);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  function add(draft: DeviceDraft) {
    const errors = validateDevice(draft, current.current.devices);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    const device: Device = {
      ...draft,
      id: draft.id.trim().toUpperCase(),
      name: draft.name.trim(),
      connection: "unregistered",
      lastContact: null,
      reported: "unknown",
      automatic: false,
      simulation: "success",
    };
    update((s) => ({ ...s, devices: [...s.devices, device] }));
    toast.success("Đã thêm thiết bị. Đang chờ kết nối đầu tiên.");
    return true;
  }
  function send(id: string, requested: "on" | "off", duration?: number) {
    const device = current.current.devices.find((d) => d.id === id);
    if (!device) return false;
    const error = commandGuard(
      device,
      current.current.commands,
      duration,
      requested,
    );
    if (error) {
      toast.error(error);
      return false;
    }
    const command: DeviceCommand = {
      id: `LENH-${String(++sequence.current).padStart(3, "0")}`,
      deviceId: id,
      requested,
      duration: requested === "on" ? duration : undefined,
      source: "Nguyễn Minh",
      at: new Date().toISOString(),
      result: "sending",
      message: "Đang xử lý lệnh.",
    };
    update((s) => ({ ...s, commands: [command, ...s.commands] }));
    toast.info("Đang xử lý lệnh");
    timers.current.push(
      setTimeout(() => {
        update((s) => ({
          ...s,
          commands: s.commands.map((c) =>
            c.id === command.id
              ? {
                  ...c,
                  result: "waiting",
                  message: "Đang chờ thiết bị phản hồi.",
                }
              : c,
          ),
        }));
      }, 650),
    );
    timers.current.push(
      setTimeout(
        () => {
          const now = new Date().toISOString();
          const result = device.simulation;
          const message =
            result === "success"
              ? "Thiết bị đã xác nhận lệnh."
              : result === "failed"
                ? "Thiết bị từ chối lệnh. Trạng thái được giữ nguyên."
                : "Không nhận được phản hồi. Trạng thái được giữ nguyên.";
          update((s) => ({
            ...s,
            commands: s.commands.map((c) =>
              c.id === command.id ? { ...c, result, message } : c,
            ),
            devices: s.devices.map((d) =>
              d.id === id && result === "success"
                ? { ...d, reported: requested, lastContact: now }
                : d,
            ),
          }));
          if (result === "success") toast.success(message);
          else toast.error(message);
          if (
            result === "success" &&
            requested === "on" &&
            device.type === "pump" &&
            duration
          ) {
            timers.current.push(
              setTimeout(() => {
                // Only an acknowledged newer command supersedes the timed session.
                if (
                  current.current.commands.find(
                    (c) => c.deviceId === id && c.result === "success",
                  )?.id !== command.id
                )
                  return;
                update((s) => ({
                  ...s,
                  devices: s.devices.map((d) =>
                    d.id === id
                      ? {
                          ...d,
                          reported: "off",
                          lastContact: new Date().toISOString(),
                        }
                      : d,
                  ),
                  commands: s.commands.map((c) =>
                    c.id === command.id
                      ? {
                          ...c,
                          message:
                            "Đã bật và sẽ tự dừng sau thời gian đã chọn.",
                        }
                      : c,
                  ),
                }));
                toast.info("Máy bơm đã dừng sau thời gian đã chọn.");
              }, duration * 1000),
            );
          }
        },
        device.simulation === "timeout" ? 3500 : 1800,
      ),
    );
    return true;
  }
  return (
    <DeviceContext.Provider
      value={{ ...store, add, send, saveAutomation, retryAutomation }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
export function useDevices() {
  const value = useContext(DeviceContext);
  if (!value) throw new Error("Thiếu dữ liệu thiết bị");
  return value;
}
