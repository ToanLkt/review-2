import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Droplets, Thermometer, Wifi } from "lucide-react-native";
import { TrayCard } from "@/components/cards";
import {
  AppHeader,
  AppText,
  EmptyState,
  KpiCard,
  PrimaryButton,
  ProgressBar,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatusBadge,
} from "@/components/ui";
import { brand } from "@/constants/brand";
import { useStore } from "@/hooks/store";
import { trayProgress } from "@/lib/catalog";
export function TraysScreen() {
  const router = useRouter();
  const { trays } = useStore();
  const active = trays.filter((tray) => tray.status !== "Sẵn thu hoạch").length;
  return (
    <Screen scroll={false}>
      <FlatList
        data={trays}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" className="text-[28px] text-ink">
                Khay của tôi
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/rent-tray")}
                className="min-h-11 justify-center"
              >
                <AppText weight="semibold" className="text-[13px] text-forest">
                  + Thuê thêm
                </AppText>
              </Pressable>
            </View>
            <View className="my-5 flex-row flex-wrap gap-2">
              {[
                { label: "Tổng khay", value: trays.length },
                { label: "Đang trồng", value: active },
                { label: "Sẵn thu hoạch", value: trays.length - active },
                {
                  label: "Nhiệt độ TB",
                  value: `${(trays.reduce((sum, tray) => sum + tray.temp, 0) / trays.length).toFixed(1)}°C`,
                },
              ].map((item) => (
                <View key={item.label} style={{ width: "48%" }}>
                  <KpiCard label={item.label} value={item.value} />
                </View>
              ))}
            </View>
            <AppText weight="bold" className="mb-3 text-[18px] text-ink">
              Danh sách khay
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <TrayCard
            tray={item}
            onPress={() =>
              router.push({ pathname: "/trays/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có khay"
            description="Thuê khay để bắt đầu trồng rau mầm."
            action="Thuê khay"
            onPress={() => router.push("/rent-tray")}
          />
        }
      />
    </Screen>
  );
}
const tabNames = ["Tổng quan", "Môi trường", "Hình ảnh", "Lịch sử"];
export function TrayDetailScreen() {
  const router = useRouter();
  const { trays } = useStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tray = trays.find((item) => item.id === id);
  const [tab, setTab] = useState(tabNames[0]);
  if (!tray)
    return (
      <Screen>
        <AppHeader title="Chi tiết khay" />
        <EmptyState
          title="Không tìm thấy khay"
          description="Khay này hiện không có trong dữ liệu demo."
        />
      </Screen>
    );
  const progress = trayProgress(tray.daysLeft, tray.totalDays);
  return (
    <Screen>
      <AppHeader
        title={tray.code}
        action={<StatusBadge label={tray.status} tone={tray.statusColor} />}
      />
      <View className="overflow-hidden rounded-2xl">
        <Image
          placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
          source={{ uri: tray.img }}
          contentFit="cover"
          style={{ width: "100%", height: 220, backgroundColor: brand.mint }}
        />
        <View className="absolute left-3 top-3">
          <StatusBadge label="● LIVE" tone="red" />
        </View>
        <View className="absolute bottom-3 left-3 rounded-lg bg-[#1A2E1F] px-2 py-1">
          <AppText className="text-[11px] text-white">
            Cập nhật {tray.lastUpdate} · 18/09/2026 09:42
          </AppText>
        </View>
      </View>
      <AppText weight="bold" className="mt-5 text-[22px] text-ink">
        {tray.seedName}
      </AppText>
      <AppText className="mt-1 text-[12px] text-muted">{tray.location}</AppText>
      <View className="mt-5 flex-row flex-wrap gap-2">
        {[
          { label: "Nhiệt độ", value: `${tray.temp}°C`, color: brand.orange },
          { label: "Độ ẩm", value: `${tray.humidity}%`, color: brand.info },
          {
            label: "Đã trồng",
            value: `${tray.totalDays - tray.daysLeft} ngày`,
            color: brand.forest,
          },
          {
            label: "Còn lại",
            value: `${tray.daysLeft} ngày`,
            color: brand.forest,
          },
        ].map((item) => (
          <View
            key={item.label}
            style={{ width: "48%" }}
            className="rounded-xl bg-white p-4"
          >
            <AppText weight="bold" style={{ fontSize: 20, color: item.color }}>
              {item.value}
            </AppText>
            <AppText className="mt-1 text-[11px] text-muted">
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
      <View className="mt-6">
        <SegmentedTabs values={tabNames} selected={tab} onChange={setTab} />
      </View>
      {tab === "Tổng quan" ? (
        <>
          <SectionHeader title="Tiến độ sinh trưởng" />
          <View className="rounded-2xl bg-white p-4">
            <View className="mb-2 flex-row justify-between">
              <AppText className="text-[13px] text-ink">Thu hoạch</AppText>
              <AppText weight="bold" className="text-[13px] text-forest">
                {progress}%
              </AppText>
            </View>
            <ProgressBar value={progress} />
          </View>
          <SectionHeader title="Trạng thái hệ thống" />
          {[
            { icon: Droplets, name: "Tưới tự động", value: "Đang hoạt động" },
            { icon: Camera, name: "Camera", value: "Trực tuyến" },
            { icon: Thermometer, name: "Cảm biến nhiệt", value: "Bình thường" },
            { icon: Wifi, name: "Kết nối", value: "Ổn định" },
          ].map(({ icon: Icon, name, value }) => (
            <View
              key={name}
              className="mb-2 flex-row items-center gap-3 rounded-xl bg-white p-4"
            >
              <Icon size={19} color={brand.forest} />
              <AppText className="flex-1 text-[13px] text-ink">{name}</AppText>
              <AppText className="text-[11px] text-forest">{value}</AppText>
            </View>
          ))}
        </>
      ) : tab === "Môi trường" ? (
        <>
          <SectionHeader title="Chỉ số gần đây" />
          {["09:40", "09:10", "08:40", "08:10"].map((time, index) => (
            <View
              key={time}
              className="mb-2 flex-row justify-between rounded-xl bg-white p-4"
            >
              <AppText className="text-[12px] text-muted">{time}</AppText>
              <AppText className="text-[12px] text-ink">
                {(tray.temp - index * 0.2).toFixed(1)}°C
              </AppText>
              <AppText className="text-[12px] text-ink">
                {tray.humidity + index}%
              </AppText>
              <StatusBadge label="Ổn định" />
            </View>
          ))}
        </>
      ) : tab === "Hình ảnh" ? (
        <>
          <SectionHeader title="Hình ảnh khay" />
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4].map((value) => (
              <Image
                placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
                key={value}
                source={{ uri: tray.img }}
                contentFit="cover"
                style={{ width: "48%", height: 140, borderRadius: 12 }}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionHeader title="Lịch sử chăm sóc" />
          {[
            "Gieo hạt",
            "Bắt đầu nảy mầm",
            "Tưới tự động",
            "Cập nhật cảm biến",
          ].map((item, index) => (
            <View
              key={item}
              className="mb-2 flex-row gap-3 rounded-xl bg-white p-4"
            >
              <View className="h-3 w-3 rounded-full bg-forest" />
              <View>
                <AppText weight="semibold" className="text-[13px] text-ink">
                  {item}
                </AppText>
                <AppText className="mt-1 text-[11px] text-muted">
                  {18 - index}/09/2026
                </AppText>
              </View>
            </View>
          ))}
        </>
      )}
      <View className="mt-6 gap-3">
        <PrimaryButton
          title="Lên lịch thu hoạch"
          onPress={() => router.push("/delivery")}
        />
        <PrimaryButton
          title="Xem giao hàng"
          variant="secondary"
          onPress={() => router.push("/delivery")}
        />
      </View>
    </Screen>
  );
}
