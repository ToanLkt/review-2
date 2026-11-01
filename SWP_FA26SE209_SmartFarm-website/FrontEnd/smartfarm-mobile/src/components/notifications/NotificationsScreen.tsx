import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, CreditCard, Sprout, Truck } from "lucide-react-native";
import { AppHeader, AppText, EmptyState, Screen } from "@/components/ui";
import { brand } from "@/constants/brand";
import { useStore } from "@/hooks/store";
export function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useStore();
  const unread = notifications.filter((item) => !item.read).length;
  const icons = {
    tray: Sprout,
    payment: CreditCard,
    delivery: Truck,
    reminder: Bell,
  };
  return (
    <Screen scroll={false}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <AppHeader title="Thông báo" />
            <View className="mb-5 flex-row items-center justify-between">
              <AppText className="text-[12px] text-muted">
                {unread} thông báo chưa đọc
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={markAllRead}
                className="min-h-11 justify-center"
              >
                <AppText weight="semibold" className="text-[12px] text-forest">
                  Đánh dấu tất cả đã đọc
                </AppText>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const Icon = icons[item.type];
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => { markRead(item.id); router.push({ pathname: "/notifications/[id]", params: { id: item.id } }); }}
              className={`mb-3 flex-row gap-3 rounded-2xl border border-mint p-4 ${item.read ? "bg-white" : "bg-canvas"}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint">
                <Icon size={20} color={brand.forest} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <AppText
                    weight={item.read ? "medium" : "bold"}
                    className="flex-1 text-[13px] text-ink"
                  >
                    {item.title}
                  </AppText>
                  {!item.read ? (
                    <View className="ml-2 h-2 w-2 rounded-full bg-forest" />
                  ) : null}
                </View>
                <AppText className="mt-1 text-[12px] leading-5 text-muted">
                  {item.body}
                </AppText>
                <AppText className="mt-2 text-[11px] text-muted">
                  {item.time}
                </AppText>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có thông báo"
            description="Cập nhật mới sẽ hiển thị tại đây."
          />
        }
      />
    </Screen>
  );
}
