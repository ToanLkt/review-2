import { TasksPage } from "@/components/tasks/tasks-page";
import { TasksProvider } from "@/components/tasks/tasks-provider";

export const metadata = {
  title: "Lịch công việc | SmartFarm",
  description: "Sắp xếp và theo dõi công việc chăm sóc nông trại.",
};

export default function Page() {
  return <TasksProvider><TasksPage /></TasksProvider>;
}
