import { DeviceControlsPage } from "@/components/devices/device-controls-page";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const id = Number(deviceId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  return <DeviceControlsPage deviceId={id} basePath="/admin/devices" />;
}
