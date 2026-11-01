import { SeedDetailPage } from "@/components/seeds/seed-detail-page";
import { SeedsPage } from "@/components/seeds/seeds-page";

export function VarietyListPage() {
  return <SeedsPage basePath="/seed-varieties" title="Giống cây cho thuê khay" />;
}

export function VarietyDetailPage({ id }: { id: string }) {
  return <SeedDetailPage seedId={id} basePath="/seed-varieties" />;
}
