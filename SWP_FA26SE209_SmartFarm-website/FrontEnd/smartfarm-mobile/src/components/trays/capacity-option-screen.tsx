import { useRouter } from "expo-router";
import { AppHeader, AppText, PrimaryButton, Screen } from "@/components/ui";
import { availableTrayCapacity, demoTrayCapacity } from "@/lib/capacity";
import { useStore } from "@/hooks/store";
import { rentalPricing } from "@/data/mock";
import { formatCurrency } from "@/constants/brand";
export function TrayOption() { const router = useRouter(); const { payments } = useStore(); return <Screen><AppHeader title="Option thuê khay" /><AppText weight="bold" className="mt-5 text-[22px] text-ink">{demoTrayCapacity.optionName}</AppText><AppText className="my-4 text-[13px] text-muted">Còn {availableTrayCapacity(payments)} khay. Giá {formatCurrency(rentalPricing.basePrice)}/khay/tháng. Staff sẽ gán khay vật lý sau.</AppText><PrimaryButton title="Thuê khay" onPress={() => router.push("/rent-tray")} /></Screen>; }
