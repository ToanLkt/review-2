import { SeedDetailPage } from "@/components/seeds/seed-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeedDetailPage seedId={id} />;
}
