import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Bell,
  Camera,
  Droplets,
  Leaf,
  Package,
  Settings2,
  Sprout,
  Thermometer,
  UserRound,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText, PrimaryButton, Screen, SectionHeader } from "@/components/ui";
import { SeedCard, TrayCard } from "@/components/cards";
import { brand } from "@/constants/brand";
import { seeds } from "@/data/mock";
import { useAuth } from "@/hooks/auth";
import { useStore } from "@/hooks/store";
const actions = [
  { label: "Thuê khay", icon: Sprout, route: "/rent-tray" },
  { label: "Hạt giống", icon: Leaf, route: "/(app)/(tabs)/seeds" },
  { label: "Đơn hàng", icon: Package, route: "/(app)/(tabs)/orders" },
  { label: "Thông báo", icon: Bell, route: "/notifications" },
  { label: "Giỏ hàng", icon: Package, route: "/cart" },
  { label: "Giống cây", icon: Leaf, route: "/seed-varieties" },
] as const;
export function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, trays } = useStore();
  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View>
          <AppText weight="bold" className="text-[18px] text-forest">
            SmartFarm
          </AppText>
          <AppText className="mt-2 text-[12px] text-muted">
            Chào buổi sáng,
          </AppText>
          <AppText weight="bold" className="text-[24px] text-ink">
            {user?.name}
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thông báo"
            onPress={() => router.push("/notifications")}
            className="h-11 w-11 items-center justify-center rounded-xl bg-white"
          >
            <Bell size={20} color={brand.ink} />
            {notifications.some((item) => !item.read) ? (
              <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF5350]" />
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tài khoản"
            onPress={() => router.push("/(app)/(tabs)/profile")}
            className="h-11 w-11 items-center justify-center rounded-full bg-mint"
          >
            <UserRound size={20} color={brand.forest} />
          </Pressable>
        </View>
      </View>
      <Animated.View
        entering={FadeInDown.duration(350)}
        className="mt-6 overflow-hidden rounded-[20px] bg-[#1A2E1F]"
      >
        <Image
          source={{ uri: seeds[5].img }}
          contentFit="cover"
          transition={250}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12, 35, 20, 0.72)" }]}
        />
        <View className="p-5">
          <AppText weight="semibold" className="text-[11px] text-[#BDE1C8]">
            IOT FARMING · GIÁM SÁT 24/7
          </AppText>
          <AppText
            weight="bold"
            className="mt-3 text-[24px] leading-8 text-white"
          >
            Trồng rau mầm thông minh giữa đô thị
          </AppText>
          <AppText className="mt-2 text-[13px] leading-5 text-[#E7F1E9]">
            Chọn giống, theo dõi khay và đón rau tươi mỗi ngày.
          </AppText>
          <View className="mt-5 w-40">
            <PrimaryButton
              title="Thuê khay ngay"
              onPress={() => router.push("/rent-tray")}
            />
          </View>
        </View>
      </Animated.View>
      <SectionHeader
        title="Khay đang hoạt động"
        action="Xem tất cả"
        onPress={() => router.push("/(app)/(tabs)/trays")}
      />
      {trays[0] ? (
        <TrayCard
          tray={trays[0]}
          compact
          onPress={() =>
            router.push({
              pathname: "/trays/[id]",
              params: { id: trays[0].id },
            })
          }
        />
      ) : (
        <PrimaryButton
          title="Bắt đầu thuê khay"
          onPress={() => router.push("/rent-tray")}
        />
      )}
      <SectionHeader title="Truy cập nhanh" />
      <View className="flex-row flex-wrap gap-3">
        {actions.map(({ label, icon: Icon, route }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => router.push(route)}
            style={{ width: "48%", minHeight: 82 }}
            className="flex-row items-center gap-3 rounded-2xl border border-mint bg-white p-3"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint">
              <Icon size={21} color={brand.forest} />
            </View>
            <AppText weight="semibold" className="flex-1 text-[12px] text-ink">
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>
      <SectionHeader
        title="Hạt giống nổi bật"
        action="Xem tất cả"
        onPress={() => router.push("/(app)/(tabs)/seeds")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {seeds.slice(0, 3).map((seed) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            compact
            onPress={() =>
              router.push({ pathname: "/seeds/[id]", params: { id: seed.id } })
            }
          />
        ))}
      </ScrollView>
      <SectionHeader title="Nông trại trong tầm tay" />
      <View className="flex-row flex-wrap gap-3">
        {[
          { icon: Thermometer, label: "Nhiệt độ" },
          { icon: Droplets, label: "Độ ẩm" },
          { icon: Camera, label: "Camera HD" },
          { icon: Settings2, label: "Tự động hóa" },
        ].map(({ icon: Icon, label }) => (
          <View
            key={label}
            style={{ width: "48%" }}
            className="rounded-2xl bg-white p-4"
          >
            <Icon size={23} color={brand.forest} />
            <AppText weight="semibold" className="mt-2 text-[13px] text-ink">
              {label}
            </AppText>
          </View>
        ))}
      </View>
      <SectionHeader title="Góc kiến thức" />
      <View className="gap-2">
        {[
          "Chọn giống rau mầm cho người mới bắt đầu",
          "Giữ độ ẩm ổn định để mầm lớn khỏe",
        ].map((tip, index) => (
          <View
            key={tip}
            className="rounded-2xl border border-mint bg-white p-4"
          >
            <AppText className="text-[11px] text-forest">
              MẸO {index + 1}
            </AppText>
            <AppText weight="semibold" className="mt-1 text-[14px] text-ink">
              {tip}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
