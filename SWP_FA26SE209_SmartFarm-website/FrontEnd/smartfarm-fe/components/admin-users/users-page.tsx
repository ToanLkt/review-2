"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCard } from "@/components/admin/summary-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Choice } from "@/components/operations/shared/ui";
import {
  normalizedUserText,
  userRoles,
  userStatuses,
  type SmartFarmUser,
} from "@/lib/users";
import { useUsers } from "./users-provider";
import { UserTable } from "./user-table";
import { UserDetailSheet } from "./user-detail-sheet";
import { adminUsersService } from "@/lib/api/admin/admin-users-instance";
import type { UserResponse } from "@/lib/api/types";
import { RolePermissions } from "./role-permissions";
import { AccountStatusDialog } from "./account-status-dialog";
const UserFormSheet = dynamic(
  () => import("./user-form-sheet").then((m) => m.UserFormSheet),
  {
    loading: () => (
      <div
        role="status"
        aria-label="Đang tải biểu mẫu người dùng"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    ),
  },
);
type UserTab = "customers" | "staff" | "roles";
export function UsersPage() {
  const { users, loading, loadError, reload, getDetail, toggleStatus } = useUsers(),
    params = useSearchParams(),
    router = useRouter();
  const requested = params.get("tab"),
    tab: UserTab =
      requested === "staff" || requested === "roles" ? requested : "customers";
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [role, setRole] = useState(""),
    [page, setPage] = useState(1),
    [panel, setPanel] = useState<{ user?: SmartFarmUser } | null>(null),
    [detail, setDetail] = useState<UserResponse | null>(null),
    [confirm, setConfirm] = useState<SmartFarmUser | null>(null);
  const trigger = useRef<HTMLElement | null>(null),
    addButton = useRef<HTMLButtonElement | null>(null);
  const summary = {
    customers: users.filter((u) => u.role === "Khách hàng").length,
    staff: users.filter((u) => u.role !== "Khách hàng").length,
    needs: users.filter((u) => u.status !== "Hoạt động").length,
    locked: users.filter((u) => u.status === "Đã khóa").length,
    pending: users.filter((u) => u.status === "Chờ kích hoạt").length,
  };
  function setTab(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "customers") next.delete("tab");
    else next.set("tab", value);
    router.push("/admin/users" + (next.size ? "?" + next.toString() : ""), {
      scroll: false,
    });
    setQuery("");
    setStatus("");
    setRole("");
    setPage(1);
  }
  async function open(id?: string) {
    trigger.current = document.activeElement as HTMLElement;
    if (!id) { setPanel({}); return; }
    try { setPanel({ user: await getDetail(id) }); }
    catch (error) { toast.error("Không thể tải chi tiết người dùng.", { description: error instanceof Error ? error.message : undefined }); }
  }
  async function view(id: string) {
    trigger.current = document.activeElement as HTMLElement;
    try { setDetail(await adminUsersService.get(Number(id))); }
    catch (error) { toast.error("Không thể tải chi tiết người dùng.", { description: error instanceof Error ? error.message : undefined }); }
  }
  function reset() {
    setQuery("");
    setStatus("");
    setRole("");
    setPage(1);
  }
  const records = users.filter(
    (u) =>
      (tab === "customers"
        ? u.role === "Khách hàng"
        : u.role !== "Khách hàng") &&
      (!status || u.status === status) &&
      (!role || u.role === role) &&
      normalizedUserText(
        u.name + " " + u.email + " " + u.phone + " " + u.detail,
      ).includes(normalizedUserText(query)),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(records.length / 10))),
    visible = records.slice((current - 1) * 10, current * 10),
    selected = panel?.user;
  const adminCount = users.filter((u) => u.role === "Quản trị viên").length,
    staffCount = users.filter((u) => u.role === "Nhân viên").length;
  const cards = [
    {
      value: summary.customers,
      label: "Khách hàng",
      support: "Thuê khay + mua hạt giống",
      color: "text-[#809E8A]",
    },
    {
      value: summary.staff,
      label: "Nhân viên & quản trị",
      support: adminCount + " quản trị · " + staffCount + " nhân viên",
      color: "text-[#809E8A]",
    },
    {
      value: summary.needs,
      label: "Tài khoản cần xử lý",
      support: summary.locked + " khóa · " + summary.pending + " chờ kích hoạt",
      color: "text-amber-600",
      valueClassName: "text-amber-500",
    },
  ];
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1F2937]">
            Người dùng & phân quyền
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Quản lý tài khoản khách hàng, nhân viên và ma trận phân quyền.
          </p>
        </header>
        <section
          aria-label="Tổng hợp người dùng"
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {cards.map((c) => (
            <SummaryCard key={c.label} {...c} />
          ))}
        </section>
        <section
          aria-label="Quản lý người dùng"
          className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3020]"
        >
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <div className="overflow-x-auto border-b px-5 pt-3">
              <TabsList variant="line" className="h-12! gap-0 rounded-none p-0">
                {[
                  ["customers", "Khách hàng"],
                  ["staff", "Nhân viên"],
                  ["roles", "Vai trò & quyền"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-12 rounded-none px-4 font-semibold after:bottom-0! after:bg-primary data-[state=active]:text-primary"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          {tab === "roles" ? (
            <RolePermissions />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="absolute top-2.5 left-3 size-4 text-[#8BAF9A]" />
                  <Input
                    aria-label="Tìm người dùng"
                    placeholder="Tên, email, số điện thoại..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-xl pl-9 shadow-none"
                  />
                </div>
                <div className="w-full sm:w-44">
                  <Choice
                    label="Trạng thái"
                    value={status}
                    onChange={(v) => {
                      setStatus(v);
                      setPage(1);
                    }}
                    options={[
                      { value: "", label: "Tất cả trạng thái" },
                      ...userStatuses.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                </div>
                <div className="w-full sm:w-44">
                  <Choice
                    label="Vai trò"
                    value={role}
                    onChange={(v) => {
                      setRole(v);
                      setPage(1);
                    }}
                    options={[
                      { value: "", label: "Tất cả vai trò" },
                      ...userRoles.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                </div>
                {tab === "staff" && <Button ref={addButton} className="h-9 rounded-xl sm:ml-auto" onClick={() => void open()}>
                  <UserPlus className="size-4" />Thêm nhân viên
                </Button>}
              </div>
              {loading ? <div className="space-y-3 p-5" role="status" aria-label="Đang tải người dùng">
                <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
              </div> : loadError ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-5 text-center">
                <p className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={() => void reload()}>Thử lại</Button>
              </div> : <UserTable
                users={visible}
                total={records.length}
                page={current}
                onPage={setPage}
                onEdit={(u) => void open(u.id)}
                onView={(u) => void view(u.id)}
                onToggle={(u) => {
                  trigger.current = document.activeElement as HTMLElement;
                  setConfirm(u);
                }}
                reset={reset}
              />}
            </>
          )}
        </section>
      </div>
      {panel && (
        <UserFormSheet
          key={panel.user?.id ?? "create-staff"}
          user={selected}
          defaultRole="Nhân viên"
          onClose={() => setPanel(null)}
          returnFocus={() => {
            if (trigger.current?.isConnected) trigger.current.focus();
            else addButton.current?.focus();
          }}
        />
      )}
      {detail && <UserDetailSheet user={detail} onClose={() => { setDetail(null); trigger.current?.focus(); }}
        onEdit={() => { const id = detail.userId; setDetail(null); void open(String(id)); }} />}
      {confirm && (
        <AccountStatusDialog
          user={confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            toggleStatus(confirm.id);
            setConfirm(null);
          }}
        />
      )}
    </main>
  );
}
