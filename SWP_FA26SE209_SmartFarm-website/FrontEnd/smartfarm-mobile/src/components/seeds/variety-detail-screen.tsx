import { useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader, AppText, PrimaryButton, Screen } from "@/components/ui";
import { seeds } from "@/data/mock";
export function VarietyDetail() { const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const seed = seeds.find((item) => item.id === id); return <Screen><AppHeader title="Chi tiết giống cây" /><AppText weight="bold" className="text-[23px] text-ink">{seed?.name ?? "Không tìm thấy giống"}</AppText>{seed && <><AppText className="my-4 text-[14px] text-muted">{seed.description}</AppText><PrimaryButton title="Chọn giống để thuê khay" onPress={() => router.push({ pathname: "/rent-tray/[id]", params: { id: seed.id, seedId: seed.id } })} /></>}</Screen>; }
