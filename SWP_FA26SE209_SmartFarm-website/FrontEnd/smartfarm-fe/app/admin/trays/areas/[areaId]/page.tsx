import { AreaDetail } from "@/components/operations/areas/area-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  return <AreaDetail areaId={areaId} />;
}
