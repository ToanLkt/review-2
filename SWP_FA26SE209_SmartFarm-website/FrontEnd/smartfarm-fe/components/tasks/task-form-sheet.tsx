"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDateTimePicker } from "@/components/ui/local-date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { DevicePanel } from "@/components/devices/device-ui";
import { Choice, Field, FormError } from "@/components/operations/shared/ui";
import { DiscardDialog } from "@/components/operations/shared/discard-dialog";
import {
  taskAreas,
  taskAssignees,
  taskPriorities,
  taskTypes,
  type TaskDraft,
  type TaskErrors,
  type WorkTask,
} from "@/lib/work-schedule";
import { useTasks } from "./tasks-provider";

export function TaskFormSheet({
  task,
  defaultDate = "2026-09-09",
  onClose,
  returnFocus,
}: {
  task?: WorkTask;
  defaultDate?: string;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { save } = useTasks();
  const [initial] = useState<TaskDraft>(() => ({
    title: task?.title ?? "",
    type: task?.type ?? "Gieo hạt",
    target: task?.target ?? "",
    area: task?.area ?? "Khu A",
    assignee: task?.assignee ?? "Minh Anh",
    start: task?.start ?? `${defaultDate}T08:00`,
    end: task?.end ?? `${defaultDate}T09:00`,
    priority: task?.priority ?? "Bình thường",
    description: task?.description ?? "",
    status: task?.status ?? "Chờ thực hiện",
  }));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<TaskErrors>({});
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function requestClose() {
    if (dirty) setDiscard(true);
    else onClose();
  }

  function submit() {
    const nextErrors = save(form, task?.id);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onClose();
  }

  return (
    <>
      <DevicePanel
        title={task ? "Chỉnh sửa công việc" : "Tạo công việc"}
        description={
          task
            ? "Cập nhật lịch, người phụ trách và nội dung thực hiện."
            : "Sắp xếp công việc chăm sóc và vận hành nông trại."
        }
        onClose={requestClose}
        returnFocus={returnFocus}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button type="submit" form="task-form">
              {task ? "Lưu thay đổi" : "Tạo công việc"}
            </Button>
          </>
        }
      >
        <form
          id="task-form"
          noValidate
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field
            label="Tên công việc *"
            htmlFor="task-title"
            error={errors.title}
          >
            <Input
              id="task-title"
              autoFocus
              placeholder="VD: Kiểm tra khay ươm khu A"
              value={form.title}
              aria-invalid={!!errors.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
          </Field>
          <Field label="Loại công việc" error={errors.type}>
            <Choice
              label="Loại công việc"
              value={form.type}
              onChange={(value) =>
                setForm({ ...form, type: value as TaskDraft["type"] })
              }
              options={taskTypes.map((value) => ({ value, label: value }))}
            />
          </Field>
          <Field label="Khu vực" error={errors.area}>
            <Choice
              label="Khu vực"
              value={form.area}
              onChange={(value) =>
                setForm({ ...form, area: value as TaskDraft["area"] })
              }
              options={taskAreas.map((value) => ({ value, label: value }))}
            />
          </Field>
          <Field
            label="Khu vực / Lô trồng *"
            htmlFor="task-target"
            error={errors.target}
          >
            <Input
              id="task-target"
              placeholder="VD: Khu A / LT-024"
              value={form.target}
              aria-invalid={!!errors.target}
              onChange={(event) =>
                setForm({ ...form, target: event.target.value })
              }
            />
          </Field>
          <Field label="Người phụ trách *" error={errors.assignee}>
            <Choice
              label="Người phụ trách"
              value={form.assignee}
              onChange={(value) =>
                setForm({ ...form, assignee: value as TaskDraft["assignee"] })
              }
              options={taskAssignees.map((value) => ({ value, label: value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bắt đầu *" error={errors.start}>
              <LocalDateTimePicker label="Bắt đầu" value={form.start} onChange={(value) => setForm({ ...form, start: value })} />
            </Field>
            <Field label="Kết thúc *" error={errors.end}>
              <LocalDateTimePicker label="Kết thúc" value={form.end} onChange={(value) => setForm({ ...form, end: value })} />
            </Field>
          </div>
          <Field label="Mức độ ưu tiên">
            <Choice
              label="Mức độ ưu tiên"
              value={form.priority}
              onChange={(value) =>
                setForm({ ...form, priority: value as TaskDraft["priority"] })
              }
              options={taskPriorities.map((value) => ({ value, label: value }))}
            />
          </Field>
          <Field label="Mô tả" htmlFor="task-description">
            <Textarea
              id="task-description"
              rows={5}
              placeholder="Mô tả chi tiết công việc..."
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </Field>
          <FormError message={errors.form} />
        </form>
      </DevicePanel>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={!task}
      />
    </>
  );
}
