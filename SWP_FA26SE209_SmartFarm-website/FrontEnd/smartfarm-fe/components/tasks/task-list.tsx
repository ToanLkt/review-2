"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Choice } from "@/components/operations/shared/ui";
import { tableHead } from "@/components/devices/device-ui";
import {
  dateTimeLabel,
  normalizeTaskText,
  taskAreas,
  taskAssignees,
  taskStatuses,
  taskTypes,
  type WorkTask,
} from "@/lib/work-schedule";
import { TaskStatusBadge } from "./task-ui";

export function TaskList({
  tasks,
  canEdit = true,
  showAssigneeFilter = true,
  onOpenTask,
  onEditTask,
  onCompleteTask,
}: {
  tasks: WorkTask[];
  canEdit?: boolean;
  showAssigneeFilter?: boolean;
  onOpenTask: (task: WorkTask, trigger: HTMLElement) => void;
  onEditTask: (task: WorkTask, trigger: HTMLElement) => void;
  onCompleteTask: (task: WorkTask) => void;
}) {
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!assignee || task.assignee === assignee) &&
          (!area || task.area === area) &&
          (!type || task.type === type) &&
          (!status || task.status === status) &&
          normalizeTaskText(
            `${task.title} ${task.target} ${task.assignee} ${task.type}`,
          ).includes(normalizeTaskText(query)),
      ),
    [tasks, query, assignee, area, type, status],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 10, current * 10);
  const from = filtered.length ? (current - 1) * 10 + 1 : 0;
  const to = Math.min(current * 10, filtered.length);
  const resetPage = () => setPage(1);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3012]">
      <div className="flex flex-wrap gap-3 border-b p-5">
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute top-2.5 left-3 size-4 text-[#8BAF9A]" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            placeholder="Tìm công việc..."
            aria-label="Tìm công việc"
            className="h-9 rounded-xl pl-9 shadow-none"
          />
        </div>
        {showAssigneeFilter && (
          <div className="w-full sm:w-44">
            <Choice
              label="Nhân viên"
              value={assignee}
              onChange={(value) => {
                setAssignee(value);
                resetPage();
              }}
              options={[
                { value: "", label: "Tất cả nhân viên" },
                ...taskAssignees.map((value) => ({ value, label: value })),
              ]}
            />
          </div>
        )}
        <div className="w-full sm:w-40">
          <Choice
            label="Khu vực"
            value={area}
            onChange={(value) => {
              setArea(value);
              resetPage();
            }}
            options={[
              { value: "", label: "Tất cả khu vực" },
              ...taskAreas
                .filter((value) => value !== "Tất cả")
                .map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Choice
            label="Loại công việc"
            value={type}
            onChange={(value) => {
              setType(value);
              resetPage();
            }}
            options={[
              { value: "", label: "Tất cả loại" },
              ...taskTypes.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Choice
            label="Trạng thái"
            value={status}
            onChange={(value) => {
              setStatus(value);
              resetPage();
            }}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              ...taskStatuses.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1180px] table-fixed">
          <TableHeader className={tableHead}>
            <TableRow>
              <TableHead className="w-[220px]">CÔNG VIỆC</TableHead>
              <TableHead className="w-[130px]">LOẠI</TableHead>
              <TableHead className="w-[150px]">KHU VỰC / LÔ</TableHead>
              <TableHead className="w-[130px]">NGƯỜI PHỤ TRÁCH</TableHead>
              <TableHead className="w-[145px]">BẮT ĐẦU</TableHead>
              <TableHead className="w-[145px]">KẾT THÚC</TableHead>
              <TableHead className="w-[90px]">ƯU TIÊN</TableHead>
              <TableHead className="w-[140px]">TRẠNG THÁI</TableHead>
              <TableHead className="w-[220px]">THAO TÁC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((task) => (
              <TableRow key={task.id} className="h-20 hover:bg-[#F3F8F4]">
                <TableCell className="px-5">
                  <button
                    type="button"
                    onClick={(event) => onOpenTask(task, event.currentTarget)}
                    className="text-left font-semibold text-[#1F2937] hover:text-primary"
                  >
                    {task.title}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {task.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="px-5 text-xs text-muted-foreground">
                  {task.type}
                </TableCell>
                <TableCell className="px-5 text-xs text-muted-foreground">
                  {task.target}
                </TableCell>
                <TableCell className="px-5 text-xs font-medium">
                  {task.assignee}
                </TableCell>
                <TableCell className="px-5 text-xs tabular-nums text-muted-foreground">
                  {dateTimeLabel(task.start)}
                </TableCell>
                <TableCell className="px-5 text-xs tabular-nums text-muted-foreground">
                  {dateTimeLabel(task.end)}
                </TableCell>
                <TableCell className="px-5 text-xs font-medium">
                  {task.priority}
                </TableCell>
                <TableCell className="px-5">
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell className="px-5">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={(event) => onOpenTask(task, event.currentTarget)}
                    >
                      <Eye /> Xem
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => onEditTask(task, event.currentTarget)}
                      >
                        <Pencil /> Sửa
                      </Button>
                    )}
                    {task.status !== "Hoàn thành" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Đánh dấu ${task.title} hoàn thành`}
                        onClick={() => onCompleteTask(task)}
                      >
                        <Check />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {visible.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={(event) => onOpenTask(task, event.currentTarget)}
            className="w-full space-y-3 p-5 text-left hover:bg-[#F3F8F4]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-[#1F2937]">{task.title}</span>
              <TaskStatusBadge status={task.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {task.target} · {task.assignee}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {dateTimeLabel(task.start)}
            </p>
          </button>
        ))}
      </div>

      {!visible.length && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="rounded-2xl bg-secondary p-4 text-primary">
            <ListTodo className="size-6" />
          </span>
          <h3 className="font-semibold">Không tìm thấy công việc</h3>
          <p className="text-sm text-muted-foreground">
            Thử thay đổi từ khóa hoặc bộ lọc.
          </p>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
        <span>
          Hiển thị {from}–{to} trong {filtered.length} công việc
        </span>
        <nav
          aria-label="Phân trang công việc"
          className="flex items-center gap-1"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={current === 1}
            aria-label="Trang trước"
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </Button>
          {Array.from({ length: pages }, (_, index) => (
            <Button
              key={index}
              variant={current === index + 1 ? "default" : "ghost"}
              size="icon-sm"
              aria-current={current === index + 1 ? "page" : undefined}
              onClick={() => setPage(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={current === pages}
            aria-label="Trang sau"
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </nav>
      </footer>
    </section>
  );
}
