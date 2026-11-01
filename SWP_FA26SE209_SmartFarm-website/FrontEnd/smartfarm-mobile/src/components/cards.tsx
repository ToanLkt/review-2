import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import {
  ArrowUpRight,
  CalendarDays,
  Droplets,
  MapPin,
  Thermometer,
} from "lucide-react-native";
import { AppText, ProgressBar, StatusBadge } from "@/components/ui";
import { brand, formatCurrency } from "@/constants/brand";
import { trayProgress } from "@/lib/catalog";
import type { Order, Seed, Tray } from "@/data/mock";
export function SeedCard({
  seed,
  onPress,
  compact = false,
}: {
  seed: Seed;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`overflow-hidden rounded-2xl border border-mint bg-white ${compact ? "mr-3 w-48" : "mb-3"}`}
    >
      <Image
        placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
        source={{ uri: seed.img }}
        contentFit="cover"
        style={{
          width: "100%",
          height: compact ? 112 : 154,
          backgroundColor: brand.mint,
        }}
      />
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <StatusBadge label={seed.badge} tone={seed.badgeColor} />
          <AppText className="text-[11px] text-muted">
            {seed.difficulty}
          </AppText>
        </View>
        <AppText weight="bold" className="mt-2 text-[17px] text-ink">
          {seed.name}
        </AppText>
        <AppText numberOfLines={1} className="mt-1 text-[12px] text-muted">
          {seed.shortDesc}
        </AppText>
        {!compact ? (
          <View className="mt-2 flex-row gap-2">
            {seed.nutrition.slice(0, 2).map((value) => (
              <StatusBadge key={value} label={value} tone="gray" />
            ))}
          </View>
        ) : null}
        <View className="mt-3 flex-row items-center justify-between">
          <AppText weight="bold" className="text-[15px] text-forest">
            {formatCurrency(seed.price)}
          </AppText>
          <AppText className="text-[11px] text-muted">
            {seed.growDays} ngày
          </AppText>
        </View>
        {!compact ? (
          <AppText weight="semibold" className="mt-3 text-[12px] text-forest">
            Xem chi tiết →
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
export function TrayCard({
  tray,
  onPress,
  compact = false,
}: {
  tray: Tray;
  onPress: () => void;
  compact?: boolean;
}) {
  const progress = trayProgress(tray.daysLeft, tray.totalDays);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-mint bg-white"
    >
      <View>
        <Image
          placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
          source={{ uri: tray.img }}
          contentFit="cover"
          style={{
            width: "100%",
            height: compact ? 132 : 166,
            backgroundColor: brand.mint,
          }}
        />
        <View className="absolute left-3 top-3 flex-row gap-2">
          <StatusBadge label={tray.status} tone={tray.statusColor} />
          <StatusBadge label="● LIVE" tone="red" />
        </View>
      </View>
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <AppText weight="bold" className="text-[17px] text-ink">
            {tray.code} · {tray.seedName}
          </AppText>
          <ArrowUpRight size={18} color={brand.forest} />
        </View>
        <View className="mt-2 flex-row items-center gap-1">
          <MapPin size={14} color={brand.muted} />
          <AppText className="text-[12px] text-muted">{tray.location}</AppText>
        </View>
        <View className="mt-3 flex-row gap-4">
          <View className="flex-row items-center gap-1">
            <Thermometer size={15} color={brand.orange} />
            <AppText className="text-[13px] text-ink">{tray.temp}°C</AppText>
          </View>
          <View className="flex-row items-center gap-1">
            <Droplets size={15} color={brand.info} />
            <AppText className="text-[13px] text-ink">{tray.humidity}%</AppText>
          </View>
        </View>
        <View className="mt-3 flex-row justify-between">
          <AppText className="text-[11px] text-muted">
            Tiến độ sinh trưởng
          </AppText>
          <AppText weight="semibold" className="text-[11px] text-forest">
            {progress}%
          </AppText>
        </View>
        <View className="mt-2">
          <ProgressBar value={progress} />
        </View>
        <View className="mt-2 flex-row justify-between">
          <AppText className="text-[11px] text-muted">
            Còn {tray.daysLeft} ngày
          </AppText>
          <AppText className="text-[11px] text-muted">
            Cập nhật {tray.lastUpdate}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
export function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 rounded-2xl border border-mint bg-white p-4"
    >
      <View className="flex-row items-center justify-between">
        <AppText weight="bold" className="text-[15px] text-ink">
          {order.code}
        </AppText>
        <StatusBadge label={order.status} tone={order.statusColor} />
      </View>
      <View className="mt-3 flex-row items-center gap-1">
        <CalendarDays size={14} color={brand.muted} />
        <AppText className="text-[12px] text-muted">{order.date}</AppText>
      </View>
      <AppText className="mt-1 text-[11px] text-forest">{order.kind ?? "Mixed"}</AppText>
      <AppText numberOfLines={2} className="mt-3 text-[13px] text-ink">
        {order.items.map((item) => `${item.qty} × ${item.name}`).join(" · ")}
      </AppText>
      <AppText numberOfLines={1} className="mt-2 text-[11px] text-muted">
        {order.payment} · {order.address}
      </AppText>
      <View className="mt-4 flex-row items-center justify-between border-t border-mint pt-3">
        <AppText weight="bold" className="text-[16px] text-forest">
          {formatCurrency(order.total)}
        </AppText>
        <AppText weight="semibold" className="text-[12px] text-forest">
          Xem chi tiết →
        </AppText>
      </View>
    </Pressable>
  );
}
