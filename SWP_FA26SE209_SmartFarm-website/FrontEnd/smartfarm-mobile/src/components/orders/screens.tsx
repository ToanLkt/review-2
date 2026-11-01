import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OrderCard } from "@/components/cards";
import {
  AppHeader,
  AppText,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SearchBar,
  SectionHeader,
  SegmentedTabs,
  StatusBadge,
} from "@/components/ui";
import { brand, formatCurrency } from "@/constants/brand";
import { useStore } from "@/hooks/store";
import { filterOrders } from "@/lib/catalog";
export function OrdersScreen() {
  const router = useRouter();
  const { orders } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const visible = useMemo(
    () => filterOrders(orders, query, status),
    [orders, query, status],
  );
  return (
    <Screen scroll={false}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <AppText weight="bold" className="mb-5 text-[28px] text-ink">
              Đơn hàng
            </AppText>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm mã hoặc sản phẩm..."
            />
            <View className="my-4">
              <SegmentedTabs
                values={["Tất cả", "Chờ xử lý", "Hoàn thành", "Đã hủy"]}
                selected={status}
                onChange={setStatus}
              />
            </View>
            <AppText className="mb-3 text-[12px] text-muted">
              {visible.length} đơn hàng
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() =>
              router.push({ pathname: "/orders/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Không có đơn hàng"
            description="Thử bộ lọc hoặc từ khóa khác."
          />
        }
      />
    </Screen>
  );
}
const steps = ["Đặt hàng", "Xác nhận", "Đang xử lý", "Đang giao", "Hoàn thành"];
export function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useStore();
  const order = orders.find((item) => item.id === id);
  if (!order)
    return (
      <Screen>
        <AppHeader title="Chi tiết đơn hàng" />
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng này hiện không có trong dữ liệu demo."
        />
      </Screen>
    );
  const reached =
    order.status === "Hoàn thành" ? 5 : order.status === "Đã hủy" ? 1 : 3;
  return (
    <Screen>
      <AppHeader title="Chi tiết đơn hàng" />
      <View className="rounded-2xl bg-white p-5">
        <StatusBadge label={order.status} tone={order.statusColor} />
        <AppText weight="bold" className="mt-3 text-[23px] text-ink">
          {order.code}
        </AppText>
        <AppText className="mt-1 text-[12px] text-muted">{order.kind ?? "Mixed"}</AppText>
        <AppText className="mt-1 text-[12px] text-muted">
          Ngày đặt {order.date}
        </AppText>
      </View>
      <SectionHeader title="Theo dõi đơn hàng" />
      {steps.map((step, index) => (
        <View key={step} className="flex-row gap-3">
          <View className="items-center">
            <View
              className={`h-5 w-5 rounded-full ${index < reached ? "bg-forest" : "bg-mint"}`}
            />
            {index < steps.length - 1 ? (
              <View className="h-9 w-[2px] bg-mint" />
            ) : null}
          </View>
          <AppText
            weight={index < reached ? "semibold" : "regular"}
            className={`pt-0.5 text-[13px] ${index < reached ? "text-ink" : "text-muted"}`}
          >
            {step}
          </AppText>
        </View>
      ))}
      <SectionHeader title="Sản phẩm" />
      <View className="rounded-2xl bg-white p-4">
        {order.items.map((item) => (
          <View
            key={item.name}
            className="mb-3 flex-row justify-between gap-3 border-b border-mint pb-3"
          >
            <View className="flex-1">
              <AppText weight="semibold" className="text-[13px] text-ink">
                {item.name}
              </AppText>
              <AppText className="mt-1 text-[11px] text-muted">
                {item.qty} × {formatCurrency(item.price)}
              </AppText>
            </View>
            <AppText weight="semibold" className="text-[13px] text-ink">
              {formatCurrency(item.qty * item.price)}
            </AppText>
          </View>
        ))}
        <View className="flex-row justify-between">
          <AppText weight="bold" className="text-[14px] text-ink">
            Tổng cộng
          </AppText>
          <AppText weight="bold" className="text-[16px] text-forest">
            {formatCurrency(order.total)}
          </AppText>
        </View>
      </View>
      <SectionHeader title="Thanh toán & giao hàng" />
      <View className="rounded-2xl bg-white p-4">
        <AppText className="text-[12px] text-muted">
          Phương thức thanh toán
        </AppText>
        <AppText weight="medium" className="mt-1 text-[13px] text-ink">
          {order.payment}
        </AppText>
        <AppText className="mt-4 text-[12px] text-muted">
          Địa chỉ giao hàng
        </AppText>
        <AppText weight="medium" className="mt-1 text-[13px] text-ink">
          {order.address}
        </AppText>
      </View>
      <View className="mt-5">
        <PrimaryButton
          title="Xem lịch giao hàng"
          onPress={() => router.push("/delivery")}
        />
      </View>
    </Screen>
  );
}
export function DeliveryScreen() {
  const { deliveries, updateDelivery, scheduleDelivery, orders } = useStore();
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(""); const [address, setAddress] = useState(""); const [date, setDate] = useState(""); const [slot, setSlot] = useState("09:00–12:00");
  const eligible = orders.filter((order) => order.status !== "Đã hủy" && !deliveries.some((item) => item.orderCode === order.code));
  return (
    <Screen>
      <AppHeader title="Giao hàng" />
      <SectionHeader title="Đặt lịch giao" />
      <AppText className="mb-2 text-[12px] text-muted">Chọn đơn đã thanh toán và chưa có lịch giao.</AppText>
      {eligible.map((order) => <Pressable key={order.id} onPress={() => setOrderId(order.id)} className="mb-2 rounded-xl border bg-white p-3" style={{ borderColor: orderId === order.id ? brand.forest : brand.line }}><AppText className="text-[13px] text-ink">{order.code}</AppText></Pressable>)}
      <FormField label="Địa chỉ giao" value={address} onChangeText={setAddress} />
      <FormField label="Ngày giao (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-09-25" />
      <View className="mb-3 flex-row gap-2">{["09:00–12:00", "14:00–17:00"].map((value) => <Pressable key={value} onPress={() => setSlot(value)} className="rounded-xl border bg-white p-3" style={{ borderColor: slot === value ? brand.forest : brand.line }}><AppText className="text-[12px] text-ink">{value}</AppText></Pressable>)}</View>
      <PrimaryButton title="Xác nhận lịch giao" onPress={() => setMessage(scheduleDelivery(orderId, address, date, slot) ? "Đã đặt lịch giao demo." : "Chọn đơn đủ điều kiện, địa chỉ và ngày giao.")} />
      <SectionHeader title="Lịch đã đặt" />
      {deliveries.map((delivery) => (
        <View
          key={delivery.id}
          className="mb-3 rounded-2xl border border-mint bg-white p-4"
        >
          <View className="flex-row justify-between">
            <AppText weight="bold" className="text-[15px] text-ink">
              {delivery.orderCode}
            </AppText>
            <StatusBadge label={delivery.status} tone={delivery.statusColor} />
          </View>
          <AppText className="mt-3 text-[13px] text-ink">
            {delivery.items}
          </AppText>
          <AppText className="mt-2 text-[12px] text-muted">
            Dự kiến: {delivery.expectedDate}
          </AppText>
          <AppText className="mt-1 text-[12px] text-muted">
            {delivery.address}
          </AppText>
          {delivery.status === "Chờ xác nhận" ? (
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <PrimaryButton
                  title="Xác nhận lịch"
                  onPress={() => {
                    updateDelivery(
                      delivery.id,
                      "Đang giao",
                      delivery.expectedDate === "Chưa chọn lịch"
                        ? "24/09/2026"
                        : undefined,
                    );
                    setMessage(`Đã xác nhận lịch cho ${delivery.orderCode}.`);
                  }}
                />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  title="Đổi lịch"
                  variant="outline"
                  onPress={() => {
                    updateDelivery(delivery.id, "Chờ xác nhận", "24/09/2026");
                    setMessage(
                      `Đã đổi lịch ${delivery.orderCode} sang 24/09/2026.`,
                    );
                  }}
                />
              </View>
            </View>
          ) : null}
        </View>
      ))}
      {message ? (
        <AppText className="mt-2 text-[12px] text-forest">{message}</AppText>
      ) : null}
    </Screen>
  );
}
