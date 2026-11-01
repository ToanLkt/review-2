import { useRouter } from "expo-router";
import { AppHeader, AppText, PrimaryButton, Screen } from "@/components/ui";
import { availableTrayCapacity, demoTrayCapacity } from "@/lib/capacity";
import { useStore } from "@/hooks/store";
export function TrayCapacity() { const router = useRouter(); const { payments } = useStore(); return <Screen><AppHeader title="Sức chứa khay" /><AppText weight="bold" className="mt-5 text-[23px] text-ink">Còn {availableTrayCapacity(payments)}/{demoTrayCapacity.total} khay</AppText><AppText className="my-5 text-[13px] text-muted">Dữ liệu capacity demo, không chọn khay vật lý.</AppText><PrimaryButton title="Xem option thuê khay" onPress={() => router.push("/tray-capacity/standard")} /></Screen>; }
