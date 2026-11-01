"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, Camera, Cpu, History, Link2, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmAction } from "@/components/ui/use-confirm-action";
import { loadReferenceOptions, type ReferenceKind } from "@/lib/api/staff/staff-reference-options";
import { StaffReferenceSelect } from "./staff-reference-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, TableSkeleton } from "@/components/ui/loading-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import { controlsForDevice } from "@/lib/devices/control-preview";
import { COMPONENT_TYPES, DEVICE_STATUSES, type ActuatorLog, type ComponentType, type DeviceRequest, type DeviceStatus, type IoTDevice, type Paged } from "@/lib/api/staff/staff-iot-service";

type View = "devices" | "assignments" | "camera" | "logs" | "alerts";
const deviceTabs: { value: View; label: string; icon: typeof Cpu }[] = [
  { value: "devices", label: "Thiết bị & điều khiển", icon: Cpu },
  { value: "assignments", label: "Gán vào khay", icon: Link2 },
  { value: "camera", label: "Camera", icon: Camera },
  { value: "logs", label: "Nhật ký điều khiển", icon: History },
  { value: "alerts", label: "Cảnh báo", icon: BellRing },
];
const tabStyle =
  "h-11 rounded-none border-0 px-1 text-xs shadow-none after:bottom-0! after:bg-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-sm";
const emptyPage = <T,>(): Paged<T> => ({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
const emptyDevice: DeviceRequest = { deviceCode: "", macAddress: null, deviceType: "", firmwareVersion: null, status: "OFFLINE" };

export function StaffIoT({ initialView = "devices" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / IoT</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Thiết bị IoT</h1><p className="mt-2 text-sm text-muted-foreground">Quản lý thiết bị, liên kết khay, ảnh camera, lệnh điều khiển và cảnh báo hệ thống.</p></header>
    <Tabs value={view} onValueChange={(value) => setView(value as View)}>
      <div className="overflow-x-auto border-b">
        <TabsList variant="line" style={{ height: 44 }} className="gap-3 rounded-none bg-transparent p-0 sm:gap-5">
          {deviceTabs.map((tab) => {
            const Icon = tab.icon;
            return <TabsTrigger key={tab.value} value={tab.value} className={tabStyle}>
              <Icon className="mr-1 hidden size-4 sm:block" />
              {tab.label}
            </TabsTrigger>;
          })}
        </TabsList>
      </div>
    </Tabs>
    {view === "devices" && <DevicesTab />}{view === "assignments" && <AssignmentsTab />}{view === "camera" && <CameraTab />}{view === "logs" && <CommandLogsTab />}{view === "alerts" && <AlertsTab />}
  </div>;
}

function DevicesTab() {
  const { confirm, confirmationDialog } = useConfirmAction();
  const router = useRouter();
  const pathname = usePathname();
  const devicePath = pathname.startsWith("/admin") ? "/admin/devices" : "/staff/devices";
  const [data, setData] = useState(emptyPage<IoTDevice>()); const [status, setStatus] = useState<DeviceStatus | "ALL">("ALL"); const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [editingId, setEditingId] = useState<number | null | undefined>(undefined); const [form, setForm] = useState<DeviceRequest>(emptyDevice); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState("");
  useEffect(() => { let cancel = false; queueMicrotask(() => { if (!cancel) { setLoading(true); setError(""); } }); staffIoTService.devices({ status: status === "ALL" ? undefined : status, search: search.trim() || undefined, page, pageSize: 20 }).then((value) => { if (!cancel) setData(value); }).catch((reason: unknown) => { if (!cancel) setError(message(reason)); }).finally(() => { if (!cancel) setLoading(false); }); return () => { cancel = true; }; }, [page, reload, search, status]);
  const openEdit = async (id: number) => { setSaving(true); try { const item = await staffIoTService.device(id); setForm({ deviceCode: item.deviceCode, macAddress: item.macAddress, deviceType: item.deviceType, firmwareVersion: item.firmwareVersion, status: item.status as DeviceStatus }); setEditingId(id); setFormError(""); } catch (reason) { toast.error(message(reason)); } finally { setSaving(false); } };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!form.deviceCode.trim() || !form.deviceType.trim()) return setFormError("Mã và loại thiết bị là bắt buộc."); setSaving(true); setFormError(""); try { const body = { ...form, deviceCode: form.deviceCode.trim(), deviceType: form.deviceType.trim(), macAddress: form.macAddress?.trim() || null, firmwareVersion: form.firmwareVersion?.trim() || null }; if (editingId) await staffIoTService.updateDevice(editingId, body); else await staffIoTService.createDevice(body); toast.success(editingId ? "Đã cập nhật thiết bị." : "Đã thêm thiết bị."); setEditingId(undefined); setReload((value) => value + 1); } catch (reason) { setFormError(message(reason)); } finally { setSaving(false); } };
  const changeStatus = async (id: number, next: DeviceStatus) => { if (next === "INACTIVE") { deactivate(id); return; } try { await staffIoTService.updateStatus(id, next); toast.success("Đã cập nhật trạng thái thiết bị."); setReload((value) => value + 1); } catch (reason) { toast.error(message(reason)); } };
  const deactivate = (id: number) => confirm({ title: "Vô hiệu hóa thiết bị?", description: "Thiết bị đang được gán vào khay sẽ không thể vô hiệu hóa.", actionLabel: "Vô hiệu hóa", onConfirm: async () => { await staffIoTService.deactivateDevice(id); toast.success("Đã vô hiệu hóa thiết bị."); setReload((value) => value + 1); } });
  return <Panel title="Danh sách thiết bị" icon={Cpu} action={<Button onClick={() => { setForm(emptyDevice); setEditingId(null); setFormError(""); }}><Plus />Thêm thiết bị</Button>} filters={<><Input className="w-64" placeholder="Tìm mã hoặc loại thiết bị" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><Select value={status} onValueChange={(value) => { setStatus(value as typeof status); setPage(1); }}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Mọi trạng thái</SelectItem>{DEVICE_STATUSES.map((value) => <SelectItem key={value} value={value}>{value === "ONLINE" ? "Đang kết nối" : value === "OFFLINE" ? "Mất kết nối" : "Ngừng sử dụng"}</SelectItem>)}</SelectContent></Select></>}>
    <LoadState loading={loading} error={error} empty={!data.items.length} emptyText="Chưa có thiết bị IoT." variant="cards"><div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{data.items.map((item) => { const hasControls = controlsForDevice(item.deviceType).length > 0; return <article className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm transition hover:border-primary/40" key={item.deviceId}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.status === "ONLINE" ? "bg-emerald-50 text-emerald-700" : item.status === "OFFLINE" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}><Cpu className="size-5" /></span><div className="min-w-0"><h3 className="truncate font-semibold text-[#173B29]">{item.deviceCode}</h3><p className="truncate text-xs text-muted-foreground">{item.deviceType === "ESP32" ? "Bộ điều khiển" : item.deviceType} · Mã số {item.deviceId}</p></div></div><Select value={item.status} onValueChange={(value) => changeStatus(item.deviceId, value as DeviceStatus)}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent>{DEVICE_STATUSES.map((value) => <SelectItem key={value} value={value}>{value === "ONLINE" ? "Đang kết nối" : value === "OFFLINE" ? "Mất kết nối" : "Ngừng sử dụng"}</SelectItem>)}</SelectContent></Select></div><dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F8FBF9] p-3 text-xs"><div><dt className="text-muted-foreground">Phiên bản thiết bị</dt><dd className="mt-1 font-medium">{item.firmwareVersion || "Chưa có"}</dd></div><div><dt className="text-muted-foreground">Mã kết nối</dt><dd className="mt-1 truncate font-medium">{item.macAddress || "—"}</dd></div><div className="col-span-2"><dt className="text-muted-foreground">Kết nối gần nhất</dt><dd className="mt-1 font-medium">{stamp(item.lastSeen)}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => router.push(`${devicePath}/${item.deviceId}`)}><Power />{hasControls ? "Điều khiển" : "Xem thiết bị"}</Button><Button size="sm" variant="outline" onClick={() => openEdit(item.deviceId)}><Pencil />Sửa</Button><Button size="sm" variant="ghost" className="text-destructive" aria-label="Vô hiệu hóa" disabled={item.status === "INACTIVE"} onClick={() => deactivate(item.deviceId)}><Trash2 />Vô hiệu hóa</Button></div></article>; })}</div><Pager page={page} total={data.totalPages} setPage={setPage} /></LoadState>
    <Dialog open={editingId !== undefined} onOpenChange={(open) => !open && setEditingId(undefined)}><DialogContent><DialogHeader><DialogTitle>{editingId ? "Sửa thiết bị" : "Thêm thiết bị"}</DialogTitle><DialogDescription>Mã thiết bị và mã kết nối cần khác với thiết bị đã có.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><Field label="Mã thiết bị"><Input value={form.deviceCode} onChange={(event) => setForm({ ...form, deviceCode: event.target.value })} /></Field><Field label="Loại thiết bị"><Input value={form.deviceType} onChange={(event) => setForm({ ...form, deviceType: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Mã kết nối"><Input value={form.macAddress || ""} onChange={(event) => setForm({ ...form, macAddress: event.target.value || null })} /></Field><Field label="Phiên bản thiết bị"><Input value={form.firmwareVersion || ""} onChange={(event) => setForm({ ...form, firmwareVersion: event.target.value || null })} /></Field></div><p className="text-sm text-muted-foreground">Trạng thái được đổi trong danh sách thiết bị. Để vô hiệu hóa, dùng nút Vô hiệu hóa sau khi bỏ gán khay.</p>{formError && <ErrorText text={formError} />}<DialogFooter><Button type="button" variant="outline" onClick={() => setEditingId(undefined)}>Hủy</Button><Button disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button></DialogFooter></form></DialogContent></Dialog>
    {confirmationDialog}
  </Panel>;
}

function AssignmentsTab() {
  const { confirm, confirmationDialog } = useConfirmAction();
  const [items, setItems] = useState<Awaited<ReturnType<typeof staffIoTService.trayDevices>>>([]); const [trayId, setTrayId] = useState(""); const [active, setActive] = useState("true"); const [reload, setReload] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState(""); const [form, setForm] = useState({ soilTrayId: "", deviceId: "", pinNumber: "", componentType: "SOIL_MOISTURE" as ComponentType });
  useEffect(() => { let cancel = false; queueMicrotask(() => { if (!cancel) { setLoading(true); setError(""); } }); staffIoTService.trayDevices({ soilTrayId: trayId ? Number(trayId) : undefined, active: active === "ALL" ? undefined : active === "true" }).then((value) => { if (!cancel) setItems(value); }).catch((reason: unknown) => { if (!cancel) setError(message(reason)); }).finally(() => { if (!cancel) setLoading(false); }); return () => { cancel = true; }; }, [active, reload, trayId]);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!Number(form.soilTrayId) || !Number(form.deviceId)) return setFormError("Vui lòng chọn khay và thiết bị."); setSaving(true); try { await staffIoTService.assign({ soilTrayId: Number(form.soilTrayId), deviceId: Number(form.deviceId), pinNumber: form.pinNumber.trim() || null, componentType: form.componentType }); toast.success("Đã gán thiết bị vào khay."); setOpen(false); setReload((value) => value + 1); } catch (reason) { setFormError(message(reason)); } finally { setSaving(false); } };
  const remove = (id: number) => confirm({ title: "Ngừng liên kết thiết bị?", description: "Thiết bị sẽ không còn được gán với khay này.", actionLabel: "Ngừng liên kết", onConfirm: async () => { await staffIoTService.unassign(id); toast.success("Đã ngừng liên kết."); setReload((value) => value + 1); } });
  return <Panel title="Gán thiết bị vào khay" icon={Link2} action={<Button onClick={() => { setForm({ soilTrayId: "", deviceId: "", pinNumber: "", componentType: "SOIL_MOISTURE" }); setFormError(""); setOpen(true); }}><Plus />Tạo liên kết</Button>} filters={<><StaffReferenceSelect kind="tray" label="Khay" value={trayId} optional onChange={setTrayId} /><Select value={active} onValueChange={setActive}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả liên kết</SelectItem><SelectItem value="true">Đang hoạt động</SelectItem><SelectItem value="false">Đã ngừng</SelectItem></SelectContent></Select></>}><LoadState loading={loading} error={error} empty={!items.length} emptyText="Chưa có liên kết thiết bị - khay."><Table headers={["Khay", "Thiết bị", "Thành phần", "Pin", "Ngày gán", "Trạng thái", ""]}>{items.map((item) => <tr className="border-t" key={item.trayDeviceId}><Cell><b>{item.trayCode}</b></Cell><Cell>{item.deviceCode}</Cell><Cell>{item.componentType}</Cell><Cell>{item.pinNumber || "—"}</Cell><Cell>{stamp(item.assignedAt)}</Cell><Cell><Status ok={item.isActive}>{item.isActive ? "Đang gán" : "Đã ngừng"}</Status></Cell><Cell><Button size="sm" variant="outline" disabled={!item.isActive} onClick={() => remove(item.trayDeviceId)}>Ngừng gán</Button></Cell></tr>)}</Table></LoadState><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Gán thiết bị vào khay</DialogTitle><DialogDescription>Một thiết bị vật lý chỉ có thể có một liên kết đang hoạt động.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><div className="grid grid-cols-2 gap-4"><Field label="Khay"><StaffReferenceSelect kind="tray" label="Khay" value={form.soilTrayId} onChange={(value) => setForm({ ...form, soilTrayId: value })} /></Field><Field label="Mã thiết bị"><StaffReferenceSelect kind="device" label="Thiết bị" value={form.deviceId} onChange={(value) => setForm({ ...form, deviceId: value })} /></Field></div><Field label="Loại thành phần"><Select value={form.componentType} onValueChange={(value) => setForm({ ...form, componentType: value as ComponentType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPONENT_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Số pin"><Input value={form.pinNumber} onChange={(event) => setForm({ ...form, pinNumber: event.target.value })} /></Field>{formError && <ErrorText text={formError} />}<DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button disabled={saving}>Gán thiết bị</Button></DialogFooter></form></DialogContent></Dialog>{confirmationDialog}</Panel>;
}

function CameraTab() {
  const devices = useLabels("device"); const rentals = useLabels("rental");
  const [data, setData] = useState(emptyPage<Awaited<ReturnType<typeof staffIoTService.addSnapshot>>>()); const [deviceId, setDeviceId] = useState(""); const [rentalId, setRentalId] = useState(""); const [page, setPage] = useState(1); const [reload, setReload] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState(""); const [form, setForm] = useState({ deviceId: "", rentalId: "", imageUrl: "", takenAt: "" });
  useEffect(() => { let cancel = false; queueMicrotask(() => { if (!cancel) { setLoading(true); setError(""); } }); staffIoTService.snapshots({ deviceId: deviceId ? Number(deviceId) : undefined, rentalId: rentalId ? Number(rentalId) : undefined, page, pageSize: 20 }).then((value) => { if (!cancel) setData(value); }).catch((reason: unknown) => { if (!cancel) setError(message(reason)); }).finally(() => { if (!cancel) setLoading(false); }); return () => { cancel = true; }; }, [deviceId, page, reload, rentalId]);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!Number(form.deviceId) || !Number(form.rentalId) || !form.imageUrl.trim()) return setFormError("Thiết bị, đơn thuê và đường dẫn ảnh là bắt buộc."); setSaving(true); try { await staffIoTService.addSnapshot({ deviceId: Number(form.deviceId), rentalId: Number(form.rentalId), imageUrl: form.imageUrl.trim(), takenAt: form.takenAt ? new Date(form.takenAt).toISOString() : null }); toast.success("Đã lưu ảnh camera."); setOpen(false); setReload((value) => value + 1); } catch (reason) { setFormError(message(reason)); } finally { setSaving(false); } };
  return <Panel title="Ảnh camera" icon={Camera} action={<Button onClick={() => { setForm({ deviceId: "", rentalId: "", imageUrl: "", takenAt: "" }); setFormError(""); setOpen(true); }}><Plus />Thêm ảnh</Button>} filters={<><StaffReferenceSelect kind="device" label="Thiết bị" value={deviceId} optional onChange={(value) => { setDeviceId(value); setPage(1); }} /><StaffReferenceSelect kind="rental" label="Đơn thuê" value={rentalId} optional onChange={(value) => { setRentalId(value); setPage(1); }} /></>}><LoadState loading={loading} error={error} empty={!data.items.length} emptyText="Chưa có ảnh camera."><Table headers={["Ảnh", "Nguồn", "Thời gian chụp"]}>{data.items.map((item) => <tr className="border-t" key={item.snapshotId}><Cell><a className="font-medium text-primary underline" href={item.imageUrl} target="_blank" rel="noreferrer">Mở ảnh</a></Cell><Cell>{devices(item.deviceId)}<Small>{rentals(item.rentalId)}</Small></Cell><Cell>{stamp(item.takenAt)}</Cell></tr>)}</Table><Pager page={page} total={data.totalPages} setPage={setPage} /></LoadState><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Thêm ảnh camera</DialogTitle><DialogDescription>Chọn ảnh từ thiết bị đang được gắn với khay của đơn thuê.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><div className="grid grid-cols-2 gap-4"><Field label="Mã thiết bị"><StaffReferenceSelect kind="device" label="Thiết bị" value={form.deviceId} onChange={(value) => setForm({ ...form, deviceId: value })} /></Field><Field label="Đơn thuê"><StaffReferenceSelect kind="rental" label="Đơn thuê" value={form.rentalId} onChange={(value) => setForm({ ...form, rentalId: value })} /></Field></div><Field label="URL ảnh"><Input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></Field><Field label="Thời gian chụp"><Input type="datetime-local" value={form.takenAt} onChange={(event) => setForm({ ...form, takenAt: event.target.value })} /></Field>{formError && <ErrorText text={formError} />}<DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button disabled={saving}>Lưu ảnh</Button></DialogFooter></form></DialogContent></Dialog></Panel>;
}

function CommandLogsTab() {
  const devices = useLabels("device");
  const [data, setData] = useState(emptyPage<ActuatorLog>());
  const [deviceId, setDeviceId] = useState("");
  const [result, setResult] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (from && to && from > to) {
      queueMicrotask(() => {
        setError("Ngày bắt đầu phải trước ngày kết thúc.");
        setLoading(false);
      });
      return () => { cancelled = true; };
    }
    queueMicrotask(() => {
      if (!cancelled) { setLoading(true); setError(""); }
    });
    staffIoTService.logs({
      deviceId: deviceId ? Number(deviceId) : undefined,
      result: result || undefined,
      from: from ? new Date(`${from}T00:00:00`) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      page,
      pageSize: 20,
    }).then((value) => {
      if (!cancelled) setData(value);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(message(reason));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [deviceId, from, page, reload, result, to]);

  return <Panel
    title="Nhật ký điều khiển"
    icon={Power}
    action={<Button variant="outline" onClick={() => setReload((value) => value + 1)}><RefreshCw />Làm mới</Button>}
    filters={<>
      <StaffReferenceSelect kind="device" label="Thiết bị" value={deviceId} optional onChange={(value) => { setDeviceId(value); setPage(1); }} />
      <Select value={result || "ALL"} onValueChange={(value) => { setResult(value === "ALL" ? "" : value); setPage(1); }}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Kết quả" /></SelectTrigger>
        <SelectContent><SelectItem value="ALL">Mọi kết quả</SelectItem><SelectItem value="PENDING">Đang chờ</SelectItem><SelectItem value="SUCCESS">Thành công</SelectItem><SelectItem value="FAILED">Thất bại</SelectItem></SelectContent>
      </Select>
      <Input className="w-40" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
      <Input className="w-40" type="date" min={from || undefined} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
    </>}
  >
    <LoadState loading={loading} error={error} empty={!data.items.length} emptyText="Chưa có nhật ký điều khiển.">
      <Table headers={["Lệnh", "Thiết bị", "Actuator", "Nguồn", "Yêu cầu", "Xác nhận", "Kết quả"]}>
        {data.items.map((item) => <tr className="border-t" key={item.logId}>
          <Cell><b>{item.action}</b></Cell>
          <Cell>{devices(item.deviceId)}<Small>ID {item.deviceId} · Pin {item.pinNumber || "—"}</Small></Cell>
          <Cell>{item.actuatorType}</Cell>
          <Cell>{item.triggeredBy}</Cell>
          <Cell>{stamp(item.requestedAt)}</Cell>
          <Cell>{stamp(item.acknowledgedAt)}</Cell>
          <Cell><CommandStatus result={item.result} />{item.failureReason && <Small>{item.failureReason}</Small>}</Cell>
        </tr>)}
      </Table>
      <Pager page={page} total={data.totalPages} setPage={setPage} />
    </LoadState>
  </Panel>;
}


function AlertsTab() {
  const devices = useLabels("device"); const rentals = useLabels("rental");
  const [data, setData] = useState(emptyPage<Awaited<ReturnType<typeof staffIoTService.resolveAlert>>>()); const [resolved, setResolved] = useState("false"); const [severity, setSeverity] = useState(""); const [deviceId, setDeviceId] = useState(""); const [page, setPage] = useState(1); const [reload, setReload] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let cancel = false; queueMicrotask(() => { if (!cancel) { setLoading(true); setError(""); } }); staffIoTService.alerts({ resolved: resolved === "ALL" ? undefined : resolved === "true", severity: severity || undefined, deviceId: deviceId ? Number(deviceId) : undefined, page, pageSize: 20 }).then((value) => { if (!cancel) setData(value); }).catch((reason: unknown) => { if (!cancel) setError(message(reason)); }).finally(() => { if (!cancel) setLoading(false); }); return () => { cancel = true; }; }, [deviceId, page, reload, resolved, severity]);
  const toggle = async (id: number, value: boolean) => { try { await staffIoTService.resolveAlert(id, value); toast.success(value ? "Đã giải quyết cảnh báo." : "Đã mở lại cảnh báo."); setReload((item) => item + 1); } catch (reason) { toast.error(message(reason)); } };
  return <Panel title="Cảnh báo IoT" icon={BellRing} filters={<><Select value={resolved} onValueChange={(value) => { setResolved(value); setPage(1); }}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả</SelectItem><SelectItem value="false">Chưa giải quyết</SelectItem><SelectItem value="true">Đã giải quyết</SelectItem></SelectContent></Select><Input className="w-40" placeholder="Mức độ" value={severity} onChange={(event) => { setSeverity(event.target.value); setPage(1); }} /><StaffReferenceSelect kind="device" label="Thiết bị" value={deviceId} optional onChange={(value) => { setDeviceId(value); setPage(1); }} /></>}><LoadState loading={loading} error={error} empty={!data.items.length} emptyText="Không có cảnh báo phù hợp."><Table headers={["Loại / nội dung", "Mức độ", "Nguồn", "Tạo lúc", "Trạng thái", ""]}>{data.items.map((item) => <tr className="border-t" key={item.alertId}><Cell><b>{item.alertType}</b><Small>{item.message}</Small></Cell><Cell>{item.severity}</Cell><Cell>{item.deviceId ? devices(item.deviceId) : item.rentalId ? rentals(item.rentalId) : "Hệ thống"}</Cell><Cell>{stamp(item.createdAt)}</Cell><Cell><Status ok={item.isResolved}>{item.isResolved ? "Đã giải quyết" : "Chưa xử lý"}</Status></Cell><Cell><Button size="sm" variant={item.isResolved ? "outline" : "default"} onClick={() => toggle(item.alertId, !item.isResolved)}>{item.isResolved ? "Mở lại" : "Giải quyết"}</Button></Cell></tr>)}</Table><Pager page={page} total={data.totalPages} setPage={setPage} /></LoadState></Panel>;
}

function Panel({ title, icon: Icon, action, filters, children }: { title: string; icon: typeof Cpu; action?: ReactNode; filters?: ReactNode; children: ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"><div className="flex items-center gap-2"><Icon className="size-5 text-primary" /><h2 className="font-semibold text-[#173B29]">{title}</h2></div>{action}</div>{filters && <div className="flex flex-wrap gap-3 border-b bg-[#F8FBF9] p-4">{filters}</div>}{children}</section>; }
function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr>{headers.map((header) => <th className="px-5 py-3" key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Cell({ children }: { children: ReactNode }) { return <td className="px-5 py-4 align-top">{children}</td>; }
function Small({ children }: { children: ReactNode }) { return <span className="mt-1 block max-w-xs text-xs font-normal text-muted-foreground">{children}</span>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>; }
function Status({ ok, children }: { ok: boolean; children: ReactNode }) { return <Badge variant="outline" className={ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{children}</Badge>; }
function LoadState({ loading, error, empty, emptyText, children, variant = "table" }: { loading: boolean; error: string; empty: boolean; emptyText: string; children: ReactNode; variant?: "table" | "cards" }) { if (loading) return variant === "cards" ? <CardGridSkeleton count={6} /> : <TableSkeleton rows={5} columns={6} />; if (error) return <div className="p-10 text-center text-sm text-red-600">{error}</div>; if (empty) return <div className="p-14 text-center text-sm text-muted-foreground">{emptyText}</div>; return children; }
function Pager({ page, total, setPage }: { page: number; total: number; setPage: (value: number | ((old: number) => number)) => void }) { if (total <= 1) return null; return <div className="flex items-center justify-end gap-3 border-t p-4"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {total}</span><Button size="sm" variant="outline" disabled={page >= total} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>; }
function ErrorText({ text }: { text: string }) { return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{text}</p>; }
function message(reason: unknown) { return reason instanceof Error ? reason.message : "Không thể xử lý yêu cầu."; }
function stamp(value: string | null) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN"); }
function CommandStatus({ result }: { result: string }) {
  const success=result==="SUCCESS"; const pending=result==="PENDING";
  return <Badge className={success?"bg-emerald-100 text-emerald-800":pending?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"}>
    {success?"Thành công · thiết bị đã xác nhận":pending?"Đã gửi · đang chờ thiết bị":result==="FAILED"?"Thất bại":result==="TIMEOUT"?"Hết thời gian chờ":`Chưa xác định: ${result}`}
  </Badge>;
}
function useLabels(kind: ReferenceKind) {
  const [labels,setLabels]=useState<Record<string,string>>({});
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let cancelled=false;loadReferenceOptions(kind).then(items=>{if(!cancelled)setLabels(Object.fromEntries(items.map(item=>[item.value,item.label])));}).catch(()=>{if(!cancelled)setFailed(true);});return()=>{cancelled=true;};},[kind]);
  return (id:number)=>labels[String(id)] || (failed?"Không tải được thông tin nguồn":"Chưa có thông tin nguồn");
}
