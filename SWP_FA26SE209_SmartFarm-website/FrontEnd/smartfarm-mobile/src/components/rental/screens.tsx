import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bell,
  Camera,
  Droplets,
  Gauge,
  Headphones,
  Wifi,
} from "lucide-react-native";
import {
  AppHeader,
  AppText,
  FormField,
  OrderSummaryCard,
  PrimaryButton,
  QuantityStepper,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { brand, formatCurrency } from "@/constants/brand";
import { rentalPricing, seeds } from "@/data/mock";
import { useStore } from "@/hooks/store";
import { rentalDiscount, rentalTotal } from "@/lib/catalog";
import { availableTrayCapacity, validTrayQuantity } from "@/lib/capacity";
const features = [
  { icon: Camera, name: "Camera HD" },
  { icon: Gauge, name: "Cảm biến nhiệt độ" },
  { icon: Droplets, name: "Tưới tự động" },
  { icon: Wifi, name: "Bảng điều khiển IoT" },
  { icon: Bell, name: "Cảnh báo" },
  { icon: Headphones, name: "Hỗ trợ kỹ thuật" },
];
export function RentTrayScreen({ config = false }: { config?: boolean }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ seedId?: string }>();
  const [seedId, setSeedId] = useState(
    params.seedId && seeds.some((item) => item.id === params.seedId)
      ? params.seedId
      : seeds[0].id,
  );
  const [qty, setQty] = useState(1);
  const [duration, setDuration] = useState(1);
  const [note, setNote] = useState("");
  const { addItem, payments } = useStore();
  const available = availableTrayCapacity(payments);
  const seed = seeds.find((item) => item.id === seedId)!;
  const discount = rentalDiscount(qty);
  const total = rentalTotal(qty, duration);
  const add = (checkout: boolean) => {
    if (!validTrayQuantity(qty) || qty > available) return;
    addItem({
      id: `tray-${seedId}-${duration}`,
      type: "tray",
      name: `Thuê khay ${seed.name} · ${duration} tháng${note ? ` · ${note}` : ""}`,
      img: seed.img,
      price: rentalPricing.basePrice * duration,
      qty,
      duration,
      seedId,
    });
    router.push(checkout ? "/checkout" : "/cart");
  };
  return (
    <Screen>
      <AppHeader title={config ? "Cấu hình khay" : "Thuê khay trồng"} />
      <AppText className="text-[13px] leading-5 text-muted">
        Chọn giống và thời gian thuê. SmartFarm sẽ chăm sóc khay và gửi dữ liệu
        theo thời gian thực.
      </AppText>
      <SectionHeader title="1. Chọn giống" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {seeds.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => setSeedId(item.id)}
            className="mr-3 w-36 overflow-hidden rounded-2xl border bg-white"
            style={{
              borderColor: item.id === seedId ? brand.forest : brand.line,
            }}
          >
            <Image
              placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
              source={{ uri: item.img }}
              contentFit="cover"
              style={{ width: "100%", height: 90 }}
            />
            <View className="p-3">
              <AppText weight="semibold" className="text-[12px] text-ink">
                {item.name}
              </AppText>
              {item.id === seedId ? (
                <AppText className="mt-1 text-[11px] text-forest">
                  Đã chọn ✓
                </AppText>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <SectionHeader title="2. Số lượng khay" />
      <View className="flex-row items-center justify-between rounded-2xl bg-white p-4">
        <AppText weight="medium" className="text-[14px] text-ink">
          Số khay muốn thuê
        </AppText>
        <QuantityStepper value={qty} onChange={(next) => setQty(Math.min(available, next))} />
      </View>
      <AppText className="mt-2 text-[12px] text-forest">Còn {available} khay khả dụng (demo)</AppText>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {rentalPricing.discounts.map((tier) => (
          <StatusBadge
            key={tier.label}
            label={`${tier.label}: giảm ${tier.pct}%`}
            tone={discount === tier.pct ? "green" : "gray"}
          />
        ))}
      </View>
      <SectionHeader title="3. Thời gian thuê" />
      <View className="flex-row gap-2">
        {[1, 2, 3].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setDuration(value)}
            className="min-h-16 flex-1 items-center justify-center rounded-xl border bg-white"
            style={{
              borderColor: duration === value ? brand.forest : brand.line,
            }}
          >
            <AppText weight="bold" className="text-[14px] text-ink">
              {value} tháng
            </AppText>
            {value > 1 ? (
              <AppText className="mt-1 text-[10px] text-forest">
                Tiết kiệm hơn
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </View>
      {config ? (
        <View className="mt-6">
          <FormField
            label="Ghi chú cho khay"
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Yêu cầu hoặc ghi chú của bạn..."
          />
        </View>
      ) : (
        <View className="mt-5">
          <PrimaryButton
            title="Thêm ghi chú cấu hình"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/rent-tray/[id]",
                params: { id: seedId, seedId },
              })
            }
          />
        </View>
      )}
      <SectionHeader title="Dịch vụ đi kèm" />
      <View className="flex-row flex-wrap gap-2">
        {features.map(({ icon: Icon, name }) => (
          <View
            key={name}
            style={{ width: "48%" }}
            className="flex-row items-center gap-2 rounded-xl bg-white p-3"
          >
            <Icon size={18} color={brand.forest} />
            <AppText className="flex-1 text-[12px] text-ink">{name}</AppText>
          </View>
        ))}
      </View>
      <SectionHeader title="Tóm tắt đơn thuê" />
      <OrderSummaryCard
        rows={[
          { label: "Giống", value: seed.name },
          { label: "Số khay", value: String(qty) },
          { label: "Thời gian", value: `${duration} tháng` },
          {
            label: "Đơn giá",
            value: `${formatCurrency(rentalPricing.basePrice)}/khay/tháng`,
          },
          { label: "Giảm giá", value: `${discount}%` },
        ]}
        total={total}
      />
      <View className="mt-5 gap-3">
        <PrimaryButton title="Thêm vào giỏ" onPress={() => add(false)} disabled={qty > available} />
        <PrimaryButton
          title="Thanh toán ngay"
          variant="secondary"
          onPress={() => add(true)}
          disabled={qty > available}
        />
      </View>
    </Screen>
  );
}
