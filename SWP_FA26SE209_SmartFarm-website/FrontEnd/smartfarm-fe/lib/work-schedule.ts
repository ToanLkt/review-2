export const taskTypes = [
  "Gieo hạt",
  "Chăm sóc",
  "Kiểm tra môi trường",
  "Kiểm tra thiết bị",
  "Thu hoạch",
  "Đóng gói",
  "Vệ sinh",
  "Bổ sung dinh dưỡng",
  "Khác",
] as const;

export const taskAssignees = [
  "Minh Anh",
  "Hoàng Nam",
  "Thanh Hà",
  "Nguyễn Minh",
] as const;

export const taskAreas = ["Khu A", "Khu B", "Khu C", "Tất cả"] as const;
export const taskPriorities = [
  "Thấp",
  "Bình thường",
  "Cao",
  "Khẩn cấp",
] as const;
export const taskStatuses = [
  "Chờ thực hiện",
  "Đang thực hiện",
  "Hoàn thành",
  "Quá hạn",
  "Bỏ qua",
] as const;

export type TaskType = (typeof taskTypes)[number];
export type TaskAssignee = (typeof taskAssignees)[number];
export type TaskArea = (typeof taskAreas)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];

export type WorkTask = {
  id: string;
  title: string;
  type: TaskType;
  target: string;
  area: string;
  assignee: string;
  assignedUserId?: number | null;
  start: string;
  end: string;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
};

export type TaskDraft = Omit<WorkTask, "id" | "status"> & {
  status?: TaskStatus;
};

export type TaskErrors = Partial<Record<keyof TaskDraft | "form", string>>;

const makeTask = (
  id: string,
  title: string,
  type: TaskType,
  target: string,
  area: TaskArea,
  assignee: TaskAssignee,
  start: string,
  end: string,
  status: TaskStatus = "Chờ thực hiện",
  priority: TaskPriority = "Bình thường",
  description = "Theo dõi và cập nhật kết quả sau khi hoàn thành công việc.",
): WorkTask => ({
  id,
  title,
  type,
  target,
  area,
  assignee,
  start,
  end,
  status,
  priority,
  description,
});

export const initialWorkTasks: WorkTask[] = [
  makeTask(
    "CV-001",
    "Kiểm tra khay ươm",
    "Chăm sóc",
    "Khu A / Kệ A1",
    "Khu A",
    "Minh Anh",
    "2026-09-08T08:00",
    "2026-09-08T09:00",
    "Hoàn thành",
  ),
  makeTask(
    "CV-002",
    "Bổ sung dinh dưỡng",
    "Bổ sung dinh dưỡng",
    "Khu B / Kệ B1",
    "Khu B",
    "Hoàng Nam",
    "2026-09-08T14:00",
    "2026-09-08T15:00",
    "Hoàn thành",
  ),
  makeTask(
    "CV-003",
    "Kiểm tra khay ươm khu A",
    "Chăm sóc",
    "Khu A / Kệ A1",
    "Khu A",
    "Minh Anh",
    "2026-09-09T08:00",
    "2026-09-09T09:00",
    "Hoàn thành",
  ),
  makeTask(
    "CV-004",
    "Kiểm tra môi trường",
    "Kiểm tra môi trường",
    "Khu B / Kệ B1",
    "Khu B",
    "Hoàng Nam",
    "2026-09-09T09:30",
    "2026-09-09T10:00",
    "Hoàn thành",
  ),
  makeTask(
    "CV-005",
    "Vệ sinh hệ thống tưới",
    "Vệ sinh",
    "Toàn nông trại",
    "Tất cả",
    "Hoàng Nam",
    "2026-09-09T15:00",
    "2026-09-09T16:00",
  ),
  makeTask(
    "CV-006",
    "Kiểm tra lô sắp thu hoạch",
    "Chăm sóc",
    "Khu A / LT-024",
    "Khu A",
    "Minh Anh",
    "2026-09-09T16:30",
    "2026-09-09T17:30",
    "Chờ thực hiện",
    "Cao",
  ),
  makeTask(
    "CV-007",
    "Thu hoạch LT-024",
    "Thu hoạch",
    "Khu A / LT-024",
    "Khu A",
    "Minh Anh",
    "2026-09-10T07:00",
    "2026-09-10T09:00",
    "Chờ thực hiện",
    "Cao",
  ),
  makeTask(
    "CV-008",
    "Gieo hạt lô mới",
    "Gieo hạt",
    "Khu C / LT-030",
    "Khu C",
    "Thanh Hà",
    "2026-09-10T10:00",
    "2026-09-10T11:30",
  ),
  makeTask(
    "CV-009",
    "Đóng gói sản phẩm",
    "Đóng gói",
    "Khu đóng gói",
    "Tất cả",
    "Hoàng Nam",
    "2026-09-10T14:00",
    "2026-09-10T16:00",
  ),
  makeTask(
    "CV-010",
    "Kiểm tra môi trường",
    "Kiểm tra môi trường",
    "Khu B / Kệ B2",
    "Khu B",
    "Minh Anh",
    "2026-09-11T09:00",
    "2026-09-11T10:00",
  ),
  makeTask(
    "CV-011",
    "Vệ sinh kệ trồng",
    "Vệ sinh",
    "Khu C / Kệ C1",
    "Khu C",
    "Thanh Hà",
    "2026-09-12T08:00",
    "2026-09-12T10:00",
  ),
  makeTask(
    "CV-012",
    "Kiểm tra thiết bị IoT",
    "Kiểm tra thiết bị",
    "Khu B / ESP32-B",
    "Khu B",
    "Hoàng Nam",
    "2026-09-12T14:00",
    "2026-09-12T15:00",
    "Chờ thực hiện",
    "Cao",
  ),
];

export const staffWorkTasks: WorkTask[] = [
  makeTask(
    "CV-NM-001",
    "Kiểm tra khay B-08",
    "Chăm sóc",
    "Khu B / Khay B-08",
    "Khu B",
    "Nguyễn Minh",
    "2026-09-09T08:30",
    "2026-09-09T09:15",
    "Chờ thực hiện",
    "Cao",
    "Kiểm tra độ ẩm giá thể, tình trạng nảy mầm và ghi nhận bất thường của khay.",
  ),
  makeTask(
    "CV-NM-002",
    "Kiểm tra mức nước bồn dinh dưỡng",
    "Kiểm tra thiết bị",
    "Khu A / Bồn dinh dưỡng số 1",
    "Khu A",
    "Nguyễn Minh",
    "2026-09-09T10:00",
    "2026-09-09T10:45",
    "Đang thực hiện",
    "Bình thường",
    "Đối chiếu mức nước thực tế với cảm biến và báo cáo nếu có sai lệch.",
  ),
  makeTask(
    "CV-NM-003",
    "Thu hoạch rau mầm cải xanh",
    "Thu hoạch",
    "Khu C / Khay C-03",
    "Khu C",
    "Nguyễn Minh",
    "2026-09-09T14:00",
    "2026-09-09T15:30",
    "Chờ thực hiện",
    "Cao",
    "Thu hoạch đúng lô, cân sản lượng và chuyển sang khu vực đóng gói.",
  ),
  makeTask(
    "CV-NM-004",
    "Vệ sinh khay sau thu hoạch",
    "Vệ sinh",
    "Khu C / Khay C-03",
    "Khu C",
    "Nguyễn Minh",
    "2026-09-10T08:00",
    "2026-09-10T09:00",
    "Chờ thực hiện",
    "Bình thường",
    "Vệ sinh, khử khuẩn khay và xác nhận khay sẵn sàng cho chu kỳ tiếp theo.",
  ),
  makeTask(
    "CV-NM-005",
    "Kiểm tra cảm biến nhiệt độ",
    "Kiểm tra môi trường",
    "Khu B / SHT31-B01",
    "Khu B",
    "Nguyễn Minh",
    "2026-09-11T09:00",
    "2026-09-11T10:00",
    "Chờ thực hiện",
    "Bình thường",
    "Kiểm tra kết nối và so sánh số đo cảm biến với thiết bị tham chiếu.",
  ),
  makeTask(
    "CV-NM-006",
    "Bổ sung dinh dưỡng khay A-02",
    "Bổ sung dinh dưỡng",
    "Khu A / Khay A-02",
    "Khu A",
    "Nguyễn Minh",
    "2026-09-12T15:00",
    "2026-09-12T15:45",
    "Chờ thực hiện",
    "Cao",
    "Bổ sung dung dịch theo định mức và cập nhật tình trạng sau khi hoàn thành.",
  ),
];

export const REFERENCE_TODAY = "2026-09-09";

export function localDateKey(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeLabel(value: string) {
  return value.slice(11, 16);
}

export function dateTimeLabel(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} · ${time}`;
}

export function normalizeTaskText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function validateTask(draft: TaskDraft): TaskErrors {
  const errors: TaskErrors = {};
  if (!draft.title.trim()) errors.title = "Vui lòng nhập tên công việc.";
  if (!draft.type) errors.type = "Vui lòng chọn loại công việc.";
  if (!draft.target.trim())
    errors.target = "Vui lòng nhập khu vực hoặc lô trồng.";
  if (!draft.assignee) errors.assignee = "Vui lòng chọn người phụ trách.";
  if (!draft.start) errors.start = "Vui lòng chọn thời gian bắt đầu.";
  if (!draft.end) errors.end = "Vui lòng chọn thời gian kết thúc.";
  if (draft.start && draft.end && draft.end <= draft.start)
    errors.end = "Thời gian kết thúc phải sau thời gian bắt đầu.";
  return errors;
}

export function saveTask(tasks: WorkTask[], draft: TaskDraft, id?: string) {
  const errors = validateTask(draft);
  if (Object.keys(errors).length) return { tasks, errors };
  const normalized: Omit<WorkTask, "id"> = {
    ...draft,
    title: draft.title.trim(),
    target: draft.target.trim(),
    description: draft.description.trim(),
    status: draft.status ?? "Chờ thực hiện",
  };
  if (id) {
    return {
      errors,
      tasks: tasks.map((task) =>
        task.id === id ? { ...normalized, id: task.id } : task,
      ),
    };
  }
  const nextId =
    Math.max(0, ...tasks.map((task) => Number(task.id.replace("CV-", "")))) + 1;
  return {
    errors,
    tasks: [
      ...tasks,
      { ...normalized, id: `CV-${String(nextId).padStart(3, "0")}` },
    ],
  };
}
