import { AreaDetail } from "@/components/operations/areas/area-detail";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ areaId: string }>;
  searchParams: Promise<{ rackId?: string; trayId?: string }>;
}) {
  const { areaId } = await params;
  const { rackId, trayId } = await searchParams;
  return <AreaDetail areaId={areaId} rackId={rackId} trayId={trayId} />;
}
