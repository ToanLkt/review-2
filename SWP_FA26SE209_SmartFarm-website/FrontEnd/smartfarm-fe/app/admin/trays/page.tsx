import { Suspense } from "react";
import { TraysPage } from "@/components/operations/trays-page";
import Loading from "./loading";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TraysPage />
    </Suspense>
  );
}
