import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AppHeader, AppText, Screen } from "@/components/ui";
import { useStore } from "@/hooks/store";

export default function NotificationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications } = useStore();
  const notification = notifications.find((item) => item.id === id);
  return <Screen><AppHeader title="Chi tiết thông báo" /><View className="rounded-2xl bg-white p-5"><AppText className="text-[12px] text-muted">{notification?.time ?? ""}</AppText><AppText weight="bold" className="mt-3 text-[20px] text-ink">{notification?.title ?? "Không tìm thấy thông báo"}</AppText>{notification && <AppText className="mt-4 text-[14px] leading-6 text-ink">{notification.body}</AppText>}</View></Screen>;
}
