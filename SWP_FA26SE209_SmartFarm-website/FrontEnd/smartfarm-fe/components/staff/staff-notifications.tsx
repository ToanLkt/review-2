"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, CalendarClock, FilePenLine, Megaphone, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmAction } from "@/components/ui/use-confirm-action";
import { TableSkeleton } from "@/components/ui/loading-state";
import { StaffReferenceSelect } from "./staff-reference-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { stamp } from "@/lib/formatters";
import { staffNotificationsService } from "@/lib/api/staff/staff-notifications-instance";
import {
  BROADCAST_ROLES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type BroadcastRole,
  type BroadcastTarget,
  type NotificationStatus,
  type NotificationTemplate,
  type NotificationType,
  type PagedStaffNotifications,
  type StaffNotification,
} from "@/lib/api/staff/staff-notifications-service";
import { notificationStatusClass, notificationStatusLabel, notificationTypeLabel } from "./staff-notification-display";
import { StaffPersonalNotifications } from "./staff-personal-notifications";

const emptyPage: PagedStaffNotifications = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
const emptyNotificationForm = { userId: "", title: "", message: "", type: "GENERAL" as NotificationType, referenceId: "", scheduledAt: "" };
const emptyBroadcastForm = { target: "ALL" as BroadcastTarget, role: "CUSTOMER" as BroadcastRole, title: "", message: "", type: "GENERAL" as NotificationType, scheduledAt: "" };
const emptyTemplateForm = { templateKey: "", titleTemplate: "", messageTemplate: "", type: "GENERAL" as NotificationType, isActive: true };
const toIso = (value: string) => value ? new Date(value).toISOString() : null;

export function StaffNotifications() {
  const { confirm, confirmationDialog } = useConfirmAction();
  const pathname = usePathname(); const router = useRouter(); const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = requestedTab === "mine" || requestedTab === "templates" ? requestedTab : "notifications";
  const setTab = (value: string) => { const next = new URLSearchParams(searchParams.toString()); if (value === "notifications") next.delete("tab"); else next.set("tab", value); const query = next.toString(); router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }); };
  const [result, setResult] = useState(emptyPage);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NotificationStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<StaffNotification | null>(null);
  const [notificationForm, setNotificationForm] = useState(emptyNotificationForm);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState(emptyBroadcastForm);
  const [scheduleItem, setScheduleItem] = useState<StaffNotification | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab === "mine") return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); } });
    Promise.all([
      staffNotificationsService.list({ search: search || undefined, status: status === "ALL" ? undefined : status, page, pageSize: 20 }),
      staffNotificationsService.templates(),
    ]).then(([notifications, nextTemplates]) => {
      if (!cancelled) { setResult(notifications); setTemplates(nextTemplates); }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu thông báo.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, reloadKey, search, status, tab]);

  const replaceNotification = (updated: StaffNotification) => setResult((current) => ({ ...current, items: current.items.map((item) => item.notificationId === updated.notificationId ? updated : item) }));
  const validFuture = (value: string) => !value || new Date(value).getTime() > Date.now();

  const openCreate = () => { setEditing(null); setNotificationForm(emptyNotificationForm); setEditorOpen(true); };
  const openEdit = (item: StaffNotification) => {
    setEditing(item);
    setNotificationForm({ userId: String(item.userId), title: item.title, message: item.message, type: item.type as NotificationType, referenceId: item.referenceId ? String(item.referenceId) : "", scheduledAt: "" });
    setEditorOpen(true);
  };

  const saveNotification = async (event: FormEvent) => {
    event.preventDefault();
    const recipientId = Number(notificationForm.userId);
    const referenceId = notificationForm.referenceId ? Number(notificationForm.referenceId) : null;
    if (!Number.isInteger(recipientId) || recipientId <= 0 || (referenceId !== null && (!Number.isInteger(referenceId) || referenceId <= 0))) return toast.error("Vui lòng chọn người nhận và tham chiếu hợp lệ.");
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) return toast.error("Tiêu đề và nội dung không được để trống.");
    if (!validFuture(notificationForm.scheduledAt)) return toast.error("Thời gian lên lịch phải ở tương lai.");
    setSaving(true);
    try {
      if (editing) {
        replaceNotification(await staffNotificationsService.update(editing.notificationId, { userId: recipientId, title: notificationForm.title.trim(), message: notificationForm.message.trim(), type: notificationForm.type, referenceId }));
        toast.success("Đã cập nhật thông báo.");
      } else {
        await staffNotificationsService.create({ userId: recipientId, title: notificationForm.title.trim(), message: notificationForm.message.trim(), type: notificationForm.type, referenceId, scheduledAt: toIso(notificationForm.scheduledAt) });
        setReloadKey((value) => value + 1);
        toast.success(notificationForm.scheduledAt ? "Đã tạo lịch thông báo." : "Đã tạo bản nháp.");
      }
      setEditorOpen(false);
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể lưu thông báo."); }
    finally { setSaving(false); }
  };

  const broadcast = async (event: FormEvent) => {
    event.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return toast.error("Tiêu đề và nội dung không được để trống.");
    if (!validFuture(broadcastForm.scheduledAt)) return toast.error("Thời gian lên lịch phải ở tương lai.");
    setSaving(true);
    try {
      const response = await staffNotificationsService.broadcast({ target: broadcastForm.target, role: broadcastForm.target === "ROLE" ? broadcastForm.role : null, title: broadcastForm.title.trim(), message: broadcastForm.message.trim(), type: broadcastForm.type, scheduledAt: toIso(broadcastForm.scheduledAt) });
      toast.success(`Đã tạo ${response.recipients} thông báo (${notificationStatusLabel(response.status)}).`);
      setBroadcastOpen(false); setBroadcastForm(emptyBroadcastForm); setReloadKey((value) => value + 1);
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể gửi hàng loạt."); }
    finally { setSaving(false); }
  };

  const sendNow = async (item: StaffNotification) => {
    try { replaceNotification(await staffNotificationsService.send(item.notificationId)); toast.success("Đã gửi thông báo."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể gửi thông báo."); }
  };
  const schedule = async (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleItem || !scheduleAt || !validFuture(scheduleAt)) return toast.error("Chọn thời gian trong tương lai.");
    setSaving(true);
    try { replaceNotification(await staffNotificationsService.schedule(scheduleItem.notificationId, toIso(scheduleAt)!)); setScheduleItem(null); setScheduleAt(""); toast.success("Đã lên lịch thông báo."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể lên lịch."); }
    finally { setSaving(false); }
  };
  const removeNotification = async (item: StaffNotification) => {
    await staffNotificationsService.delete(item.notificationId);
    setResult((current) => ({ ...current, items: current.items.filter((entry) => entry.notificationId !== item.notificationId), totalItems: Math.max(0, current.totalItems - 1) }));
    toast.success("Đã xóa thông báo.");
  };

  const openTemplate = (item?: NotificationTemplate) => {
    setEditingTemplate(item ?? null);
    setTemplateForm(item ? { templateKey: item.templateKey, titleTemplate: item.titleTemplate, messageTemplate: item.messageTemplate, type: item.type as NotificationType, isActive: item.isActive } : emptyTemplateForm);
    setTemplateOpen(true);
  };
  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!templateForm.templateKey.trim() || !templateForm.titleTemplate.trim() || !templateForm.messageTemplate.trim()) return toast.error("Vui lòng nhập mã, tiêu đề và nội dung mẫu.");
    setSaving(true);
    try {
      const body = { ...templateForm, templateKey: templateForm.templateKey.trim(), titleTemplate: templateForm.titleTemplate.trim(), messageTemplate: templateForm.messageTemplate.trim() };
      const saved = editingTemplate ? await staffNotificationsService.updateTemplate(editingTemplate.templateId, body) : await staffNotificationsService.createTemplate(body);
      setTemplates((current) => editingTemplate ? current.map((item) => item.templateId === saved.templateId ? saved : item) : [...current, saved].sort((a, b) => a.templateKey.localeCompare(b.templateKey)));
      setTemplateOpen(false); toast.success(editingTemplate ? "Đã cập nhật mẫu thông báo." : "Đã tạo mẫu thông báo.");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể lưu mẫu thông báo."); }
    finally { setSaving(false); }
  };
  const removeTemplate = async (item: NotificationTemplate) => {
    await staffNotificationsService.deleteTemplate(item.templateId);
    setTemplates((current) => current.filter((entry) => entry.templateId !== item.templateId));
    toast.success("Đã xóa mẫu thông báo.");
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hỗ trợ / Thông báo</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Quản lý thông báo</h1><p className="mt-2 text-sm text-muted-foreground">Tạo và quản lý thông báo hệ thống, đồng thời theo dõi thông báo của bạn.</p></div>{tab !== "mine" && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button><Button variant="outline" onClick={() => setBroadcastOpen(true)}><Megaphone />Gửi hàng loạt</Button><Button onClick={tab === "templates" ? () => openTemplate() : openCreate}><Plus />{tab === "templates" ? "Tạo mẫu" : "Tạo thông báo"}</Button></div>}</header>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="notifications">Quản lý thông báo</TabsTrigger><TabsTrigger value="templates">Mẫu thông báo</TabsTrigger><TabsTrigger value="mine">Thông báo của tôi</TabsTrigger></TabsList></Tabs>

    {tab === "mine" ? <StaffPersonalNotifications /> : tab === "notifications" ? <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="flex flex-wrap gap-3 p-5 sm:p-6"><Input className="min-w-[240px] flex-1" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm tiêu đề hoặc nội dung..." /><Select value={status} onValueChange={(value) => { setStatus(value as NotificationStatus | "ALL"); setPage(1); }}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>{NOTIFICATION_STATUSES.map((value) => <SelectItem key={value} value={value}>{notificationStatusLabel(value)}</SelectItem>)}</SelectContent></Select><Button type="submit" variant="outline">Tìm</Button></form>
      {error ? <ErrorState text={error} retry={() => setReloadKey((value) => value + 1)} /> : loading ? <Loading /> : result.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Thông báo</th><th className="px-5 py-4">Loại</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.notificationId} className="border-t border-[#EDF2EE] align-top hover:bg-[#F8FBF9]"><td className="max-w-[420px] px-5 py-4"><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p></td><td className="px-5 py-4">{notificationTypeLabel(item.type)}</td><td className="px-5 py-4"><Badge variant="outline" className={notificationStatusClass(item.status)}>{notificationStatusLabel(item.status)}</Badge></td><td className="px-5 py-4 whitespace-nowrap"><p>{stamp(item.createdAt)}</p>{item.scheduledAt && <p className="mt-1 text-xs text-sky-700">Lịch: {stamp(item.scheduledAt)}</p>}{item.sentAt && <p className="mt-1 text-xs text-emerald-700">Gửi: {stamp(item.sentAt)}</p>}</td><td className="px-5 py-4"><div className="flex justify-end gap-1">{item.status !== "SENT" && <><Button title="Sửa" size="icon-sm" variant="ghost" onClick={() => openEdit(item)}><FilePenLine /></Button><Button title="Lên lịch" size="icon-sm" variant="ghost" onClick={() => { setScheduleItem(item); setScheduleAt(""); }}><CalendarClock /></Button><Button title="Gửi ngay" size="icon-sm" variant="ghost" onClick={() => void sendNow(item)}><Send /></Button><Button title="Xóa" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => confirm({ title: "Xóa thông báo?", description: `Xóa thông báo “${item.title}”?`, actionLabel: "Xóa", onConfirm: () => removeNotification(item) })}><Trash2 /></Button></>}</div></td></tr>)}</tbody></table></div> : <Empty text="Không có thông báo phù hợp." />}
      {!error && result.totalPages > 1 && <Pager page={page} totalPages={result.totalPages} loading={loading} setPage={setPage} />}
    </section> : <TemplatesTable templates={templates} loading={loading} error={error} onEdit={openTemplate} onDelete={(item) => confirm({ title: "Xóa mẫu thông báo?", description: `Xóa mẫu thông báo “${item.templateKey}”?`, actionLabel: "Xóa", onConfirm: () => removeTemplate(item) })} />}

    <NotificationEditor open={editorOpen} setOpen={setEditorOpen} editing={editing} form={notificationForm} setForm={setNotificationForm} saving={saving} submit={saveNotification} />
    <BroadcastEditor open={broadcastOpen} setOpen={setBroadcastOpen} form={broadcastForm} setForm={setBroadcastForm} saving={saving} submit={broadcast} />
    <ScheduleEditor item={scheduleItem} close={() => setScheduleItem(null)} value={scheduleAt} setValue={setScheduleAt} saving={saving} submit={schedule} />
    <TemplateEditor open={templateOpen} setOpen={setTemplateOpen} editing={editingTemplate} form={templateForm} setForm={setTemplateForm} saving={saving} submit={saveTemplate} />
    {confirmationDialog}
  </div>;
}

type NotificationForm = typeof emptyNotificationForm;
function NotificationEditor({ open, setOpen, editing, form, setForm, saving, submit }: { open: boolean; setOpen: (value: boolean) => void; editing: StaffNotification | null; form: NotificationForm; setForm: (value: NotificationForm) => void; saving: boolean; submit: (event: FormEvent) => void }) {
  const referenceKind = form.type === "ORDER" ? "order" : form.type === "DELIVERY" ? "delivery" : form.type === "GROWING_CYCLE" ? "rental" : form.type === "PAYMENT" ? "payment" : null;
  return <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? "Sửa thông báo" : "Tạo thông báo"}</DialogTitle><DialogDescription>{editing ? "Chỉ thông báo chưa gửi mới có thể chỉnh sửa." : "Để trống thời gian nếu muốn lưu nháp; chọn thời gian tương lai để lên lịch gửi."}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Người nhận"><StaffReferenceSelect kind="user" label="Người nhận" value={form.userId} onChange={(value) => setForm({ ...form, userId: value })} /></Field><TypeSelect value={form.type} setValue={(type) => setForm({ ...form, type, referenceId: "" })} /></div><Field label="Tiêu đề"><Input required maxLength={150} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Nội dung"><Textarea required maxLength={2000} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2">{referenceKind ? <Field label="Tham chiếu"><StaffReferenceSelect kind={referenceKind} label="Tham chiếu" value={form.referenceId} optional onChange={(value) => setForm({ ...form, referenceId: value })} /></Field> : <p className="text-sm text-muted-foreground">{editing && form.referenceId ? "Tham chiếu hiện tại sẽ được giữ nguyên." : "Loại này không cần tham chiếu."}</p>}{!editing && <Field label="Lên lịch"><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></Field>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={saving || !form.userId}>{saving ? "Đang lưu..." : "Lưu"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

type BroadcastForm = typeof emptyBroadcastForm;
function BroadcastEditor({ open, setOpen, form, setForm, saving, submit }: { open: boolean; setOpen: (value: boolean) => void; form: BroadcastForm; setForm: (value: BroadcastForm) => void; saving: boolean; submit: (event: FormEvent) => void }) {
  return <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Gửi thông báo hàng loạt</DialogTitle><DialogDescription>Để trống thời gian để gửi ngay, hoặc chọn thời gian gửi sau.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Đối tượng"><Select value={form.target} onValueChange={(value) => setForm({ ...form, target: value as BroadcastTarget })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả người dùng đang hoạt động</SelectItem><SelectItem value="ROLE">Theo vai trò</SelectItem></SelectContent></Select></Field>{form.target === "ROLE" && <Field label="Vai trò"><Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as BroadcastRole })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{BROADCAST_ROLES.map((role) => <SelectItem key={role} value={role}>{role === "CUSTOMER" ? "Khách hàng" : role === "STAFF" ? "Nhân viên" : "Quản trị viên"}</SelectItem>)}</SelectContent></Select></Field>}</div><TypeSelect value={form.type} setValue={(type) => setForm({ ...form, type })} /><Field label="Tiêu đề"><Input required maxLength={150} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Nội dung"><Textarea required maxLength={2000} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field><Field label="Lên lịch"><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang xử lý..." : "Gửi thông báo"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function ScheduleEditor({ item, close, value, setValue, saving, submit }: { item: StaffNotification | null; close: () => void; value: string; setValue: (value: string) => void; saving: boolean; submit: (event: FormEvent) => void }) {
  return <Dialog open={Boolean(item)} onOpenChange={(open) => { if (!open && !saving) close(); }}><DialogContent><DialogHeader><DialogTitle>Lên lịch thông báo</DialogTitle><DialogDescription>{item?.title}. Chọn thời gian bạn muốn gửi thông báo.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Input required type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} /><DialogFooter><Button type="button" variant="outline" onClick={close}>Hủy</Button><Button type="submit" disabled={saving}>Đặt lịch</Button></DialogFooter></form></DialogContent></Dialog>;
}

type TemplateForm = typeof emptyTemplateForm;
function TemplateEditor({ open, setOpen, editing, form, setForm, saving, submit }: { open: boolean; setOpen: (value: boolean) => void; editing: NotificationTemplate | null; form: TemplateForm; setForm: (value: TemplateForm) => void; saving: boolean; submit: (event: FormEvent) => void }) {
  return <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? "Sửa mẫu thông báo" : "Tạo mẫu"}</DialogTitle><DialogDescription>Mỗi mẫu cần một mã riêng. Thay đổi sẽ áp dụng cho các thông báo được tạo sau đó.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Mã mẫu"><Input required maxLength={80} value={form.templateKey} onChange={(event) => setForm({ ...form, templateKey: event.target.value.toUpperCase() })} /></Field><TypeSelect value={form.type} setValue={(type) => setForm({ ...form, type })} /></div><Field label="Tiêu đề mẫu"><Input required maxLength={150} value={form.titleTemplate} onChange={(event) => setForm({ ...form, titleTemplate: event.target.value })} /></Field><Field label="Nội dung mẫu"><Textarea required maxLength={2000} rows={5} value={form.messageTemplate} onChange={(event) => setForm({ ...form, messageTemplate: event.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-primary" />Đang hoạt động</label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu mẫu"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function TemplatesTable({ templates, loading, error, onEdit, onDelete }: { templates: NotificationTemplate[]; loading: boolean; error: string; onEdit: (item: NotificationTemplate) => void; onDelete: (item: NotificationTemplate) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">{error ? <ErrorState text={error} /> : loading ? <Loading /> : templates.length ? <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Mã mẫu</th><th className="px-5 py-4">Nội dung</th><th className="px-5 py-4">Loại</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Cập nhật</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody>{templates.map((item) => <tr key={item.templateId} className="border-t border-[#EDF2EE] align-top"><td className="px-5 py-4 font-semibold text-primary">{item.templateKey}</td><td className="max-w-[420px] px-5 py-4"><p className="font-medium">{item.titleTemplate}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.messageTemplate}</p></td><td className="px-5 py-4">{notificationTypeLabel(item.type)}</td><td className="px-5 py-4"><Badge variant="outline">{item.isActive ? "Hoạt động" : "Tạm tắt"}</Badge></td><td className="px-5 py-4 whitespace-nowrap">{stamp(item.updatedAt)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" onClick={() => onEdit(item)}><FilePenLine /></Button><Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => onDelete(item)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div> : <Empty text="Chưa có mẫu thông báo." />}</section>;
}

function TypeSelect({ value, setValue }: { value: NotificationType; setValue: (value: NotificationType) => void }) { return <Field label="Loại"><Select value={value} onValueChange={(next) => setValue(next as NotificationType)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{NOTIFICATION_TYPES.map((type) => <SelectItem key={type} value={type}>{notificationTypeLabel(type)}</SelectItem>)}</SelectContent></Select></Field>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>; }
function Loading() { return <TableSkeleton rows={5} columns={5} className="border-t" />; }
function Empty({ text }: { text: string }) { return <div className="px-5 py-16 text-center"><Bell className="mx-auto size-10 text-[#8BAF9A]" /><h3 className="mt-3 font-semibold">{text}</h3></div>; }
function ErrorState({ text, retry }: { text: string; retry?: () => void }) { return <div className="border-t border-red-100 bg-red-50 px-5 py-10 text-center"><p className="font-semibold text-red-700">Không thể tải thông báo</p><p className="mt-1 text-sm text-red-600">{text}</p>{retry && <Button className="mt-4" variant="outline" onClick={retry}>Thử lại</Button>}</div>; }
function Pager({ page, totalPages, loading, setPage }: { page: number; totalPages: number; loading: boolean; setPage: React.Dispatch<React.SetStateAction<number>> }) { return <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4"><Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {totalPages}</span><Button size="sm" variant="outline" disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>; }
