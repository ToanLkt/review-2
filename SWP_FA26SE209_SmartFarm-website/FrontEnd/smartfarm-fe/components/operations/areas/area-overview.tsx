"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Map,
  Layers3,
  Sprout,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useOperations } from "../shared/operations-provider";
import { AreaCard, AreaMenu } from "./area-card";
import { AreaFormSheet } from "./area-form-sheet";
import { AreaMaintenanceDialog } from "./area-maintenance-dialog";
import { Choice, EmptyState, PhysicalStatus, SummaryCards } from "../shared/ui";
import { areaStats, normalize, allPositions } from "@/lib/operations/selectors";
import type { GrowingArea } from "@/lib/operations/types";
import { useOperationsRoutes } from "../shared/operations-routes";
export function AreaOverview({ onCreate }: { onCreate?: () => void }) {
  const { state, areaDetail } = useOperations();
  const routes = useOperationsRoutes();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("grid");
  const [edit, setEdit] = useState<GrowingArea | null>(null);
  const [maintenance, setMaintenance] = useState<GrowingArea | null>(null);
  const areas = state.areas.filter(
    (a) =>
      (!status || a.status === status) &&
      normalize(a.code + " " + a.name).includes(normalize(query)),
  );
  async function openEdit(area: GrowingArea) {
    const detail = await areaDetail(area.id);
    if (detail) setEdit(detail);
  }
  return (
    <div className="space-y-5">
      <SummaryCards
        catalogStyle
        items={[
          {
            label: "Tổng khu vực",
            detail: "Toàn nông trại",
            value: state.areas.length,
            icon: <Map className="size-4" />,
          },
          {
            label: "Khu vực hoạt động",
            detail: "Đang vận hành",
            color: "text-primary",
            value: state.areas.filter((a) => a.status === "Hoạt động").length,
            icon: <CheckCircle2 className="size-4" />,
          },
          {
            label: "Tổng vị trí khay",
            detail: "Sức chứa toàn nông trại",
            color: "text-blue-500",
            value: allPositions(state).length,
            icon: <Layers3 className="size-4" />,
          },
          {
            label: "Khay đang trồng",
            detail: "Đang có chu kỳ trồng",
            color: "text-primary",
            value: state.trays.filter((t) => t.status === "Đang trồng").length,
            icon: <Sprout className="size-4" />,
          },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-44 flex-1 sm:max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã hoặc tên khu vực..."
            aria-label="Tìm mã hoặc tên khu vực"
            className="h-9 bg-white pl-9 text-xs"
          />
        </div>
        <div className="w-40">
          <Choice
            label="Trạng thái khu vực"
            value={status}
            onChange={setStatus}
            options={["", "Hoạt động", "Bảo trì", "Ngừng sử dụng"].map((v) => ({
              value: v,
              label: v || "Tất cả",
            }))}
          />
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          {areas.length} khu vực
        </p>
        <div className="flex rounded-lg border bg-white p-0.5">
          <Button
            size="icon"
            variant={view === "grid" ? "secondary" : "ghost"}
            className="size-8"
            aria-label="Xem dạng lưới"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            size="icon"
            variant={view === "table" ? "secondary" : "ghost"}
            className="size-8"
            aria-label="Xem dạng bảng"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            <List className="size-4" />
          </Button>
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="h-9 text-xs">
            <Plus className="size-4" />
            Thêm khu vực
          </Button>
        )}
      </div>
      {!areas.length ? (
        <div className="section-card">
          <EmptyState
            title={
              state.areas.length ? "Không tìm thấy khu vực" : "Chưa có khu vực"
            }
            description="Thử thay đổi từ khóa hoặc trạng thái khu vực."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("");
                }}
              >
                Xóa bộ lọc
              </Button>
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((a) => (
            <AreaCard
              key={a.id}
              area={a}
              onEdit={() => { void openEdit(a); }}
              onMaintenance={() => setMaintenance(a)}
            />
          ))}
        </div>
      ) : (
        <div className="section-card min-w-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Mã khu vực",
                  "Tên khu vực",
                  "Số kệ",
                  "Khay đã bố trí / sức chứa",
                  "Khay đang trồng",
                  "Trạng thái",
                  "Thao tác",
                ].map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a) => {
                const s = areaStats(state, a);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-primary">
                      <Link href={`${routes.trays}/areas/${a.id}`}>{a.code}</Link>
                    </TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.shelves.length}</TableCell>
                    <TableCell>
                      {s.installed}/{s.positions}
                    </TableCell>
                    <TableCell>{s.growing}</TableCell>
                    <TableCell>
                      <PhysicalStatus status={a.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          <Link href={`${routes.trays}/areas/${a.id}`}>
                            Xem chi tiết
                          </Link>
                        </Button>
                        {!routes.readOnly && (
                          <AreaMenu
                            area={a}
                            onEdit={() => { void openEdit(a); }}
                            onMaintenance={() => setMaintenance(a)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {!routes.readOnly && edit && (
        <AreaFormSheet area={edit} onClose={() => setEdit(null)} />
      )}{" "}
      {!routes.readOnly && maintenance && (
        <AreaMaintenanceDialog
          area={maintenance}
          onClose={() => setMaintenance(null)}
        />
      )}
    </div>
  );
}
