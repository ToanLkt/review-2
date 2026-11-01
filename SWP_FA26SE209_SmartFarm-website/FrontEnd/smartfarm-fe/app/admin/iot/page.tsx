import { EnvironmentPage } from "@/components/environment/environment-page";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
export const metadata = { title: "Giám sát môi trường | SmartFarm" };
export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-96" />}>
      <EnvironmentPage />
    </Suspense>
  );
}
