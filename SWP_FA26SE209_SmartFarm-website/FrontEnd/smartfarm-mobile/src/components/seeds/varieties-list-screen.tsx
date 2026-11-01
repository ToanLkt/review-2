import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { AppHeader, AppText, Screen } from "@/components/ui";
import { seeds } from "@/data/mock";
export function Varieties() { const router = useRouter(); return <Screen><AppHeader title="Giống cây cho thuê khay" /><AppText className="mb-4 text-[13px] text-muted">Chọn giống để trồng trong khay thuê; giá gói hạt ở Seed Products là nghiệp vụ mua hàng.</AppText>{seeds.map((seed) => <Pressable key={seed.id} className="mb-3 rounded-xl bg-white p-4" onPress={() => router.push({ pathname: "/seed-varieties/[id]", params: { id: seed.id } })}><AppText weight="bold" className="text-[16px] text-ink">{seed.name}</AppText><AppText className="mt-2 text-[12px] text-muted">{seed.growDays} ngày · {seed.shortDesc}</AppText></Pressable>)}</Screen>; }
