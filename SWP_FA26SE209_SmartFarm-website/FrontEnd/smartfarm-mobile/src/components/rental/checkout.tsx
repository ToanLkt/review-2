import { useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Clock3, ShoppingCart, Trash2 } from "lucide-react-native";
import {
  AppHeader,
  AppText,
  EmptyState,
  FormField,
  OrderSummaryCard,
  PrimaryButton,
  QuantityStepper,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { brand, formatCurrency } from "@/constants/brand";
import {
  cartLineTotal,
  cartShipping,
  cartSubtotal,
  cartTotal,
} from "@/lib/catalog";
import { useStore } from "@/hooks/store";
import { availableTrayCapacity } from "@/lib/capacity";
import { useAuth } from "@/hooks/auth";
import { paymentStatusLabel } from "@/lib/payment";
export function CartScreen() {
  const router = useRouter();
  const { cart, setQuantity, removeItem } = useStore();
  return (
    <Screen>
      <AppHeader title="Giỏ hàng" />
      <AppText className="mb-5 text-[13px] text-muted">
        {cart.length} sản phẩm trong giỏ
      </AppText>
      {cart.length ? (
        <>
          {cart.map((item) => (
            <View
              key={item.id}
              className="mb-3 flex-row gap-3 rounded-2xl border border-mint bg-white p-3"
            >
              <Image
                placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
                source={{ uri: item.img }}
                contentFit="cover"
                style={{
                  width: 76,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: brand.mint,
                }}
              />
              <View className="flex-1">
                <StatusBadge
                  label={item.type === "seed" ? "Hạt giống" : "Thuê khay"}
                />
                <AppText
                  weight="semibold"
                  className="mt-1 text-[13px] text-ink"
                >
                  {item.name}
                </AppText>
                <AppText weight="bold" className="mt-1 text-[13px] text-forest">
                  {formatCurrency(cartLineTotal(item))}
                </AppText>
                <View className="mt-2 flex-row items-center justify-between">
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => setQuantity(item.id, qty)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xóa ${item.name}`}
                    onPress={() => removeItem(item.id)}
                    className="h-11 w-11 items-center justify-center"
                  >
                    <Trash2 size={19} color={brand.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          <SectionHeader title="Mua thêm" />
          <View className="gap-2">
            <PrimaryButton
              title="Xem hạt giống"
              variant="outline"
              onPress={() => router.push("/(app)/(tabs)/seeds")}
            />
            <PrimaryButton
              title="Thuê thêm khay"
              variant="outline"
              onPress={() => router.push("/rent-tray")}
            />
          </View>
          <SectionHeader title="Tóm tắt đơn hàng" />
          <OrderSummaryCard
            rows={[
              { label: "Tạm tính", value: formatCurrency(cartSubtotal(cart)) },
              {
                label: "Phí vận chuyển",
                value: formatCurrency(cartShipping(cart)),
              },
              { label: "Mã giảm giá", value: "—" },
            ]}
            total={cartTotal(cart)}
          />
          <View className="mt-5">
            <PrimaryButton
              title="Tiến hành thanh toán"
              onPress={() => router.push("/checkout")}
            />
          </View>
        </>
      ) : (
        <EmptyState
          title="Giỏ hàng trống"
          description="Thêm hạt giống hoặc khay trồng để bắt đầu."
          action="Mua hạt giống ngay"
          onPress={() => router.push("/(app)/(tabs)/seeds")}
        />
      )}
    </Screen>
  );
}
const methods = [
  "SePay QR (mô phỏng)",
];
export function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, profile, beginPayment, payments } = useStore();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState(methods[0]);
  const [error, setError] = useState("");
  const submit = () => {
    if (
      !name.trim() ||
      !/^\d{9,11}$/.test(phone) ||
      !email.includes("@") ||
      !address.trim()
    )
      return setError("Vui lòng kiểm tra thông tin giao hàng.");
    if (!cart.length) return setError("Giỏ hàng đang trống.");
    if (cart.filter((item) => item.type === "tray").reduce((sum, item) => sum + item.qty, 0) > availableTrayCapacity(payments)) return setError(`Số khay thuê vượt sức chứa demo (${availableTrayCapacity(payments)}).`);
    if (!user) return setError("Vui lòng đăng nhập.");
    const payment = beginPayment(address.trim(), user.email);
    router.replace({ pathname: "/payment-status", params: { id: payment.id } });
  };
  return (
    <Screen>
      <AppHeader title="Thanh toán" />
      <SectionHeader title="Thông tin giao hàng" />
      <FormField label="Họ và tên" value={name} onChangeText={setName} />
      <FormField
        label="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField label="Địa chỉ" value={address} onChangeText={setAddress} />
      <FormField
        label="Ghi chú"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Ghi chú cho đơn hàng..."
      />
      <SectionHeader title="Phương thức thanh toán" />
      {methods.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          onPress={() => setMethod(item)}
          className="mb-2 min-h-14 justify-center rounded-xl border bg-white px-4"
          style={{ borderColor: method === item ? brand.forest : brand.line }}
        >
          <AppText weight="semibold" className="text-[13px] text-ink">
            {method === item ? "◉ " : "○ "}
            {item}
          </AppText>
        </Pressable>
      ))}
      {method === methods[0] ? (
        <View className="mt-2 items-center rounded-2xl border border-mint bg-white p-5">
          <View className="h-28 w-28 items-center justify-center border border-mint bg-canvas">
            <AppText
              weight="bold"
              className="text-center text-[12px] text-forest"
            >
              MÃ QR MINH HỌA
            </AppText>
          </View>
          <AppText className="mt-2 text-[11px] text-muted">
            Mã QR minh họa · thanh toán demo
          </AppText>
        </View>
      ) : null}
      <SectionHeader title="Tóm tắt đơn hàng" />
      <OrderSummaryCard
        rows={[
          ...cart.map((item) => ({
            label: `${item.qty} × ${item.name}`,
            value: formatCurrency(cartLineTotal(item)),
          })),
          {
            label: "Phí vận chuyển",
            value: formatCurrency(cartShipping(cart)),
          },
        ]}
        total={cartTotal(cart)}
      />
      <AppText className="my-4 text-[11px] text-muted">
        Thông tin chỉ dùng trong bản demo; chưa có giao dịch thật.
      </AppText>
      {error ? (
        <AppText className="mb-3 text-[12px]" style={{ color: brand.danger }}>
          {error}
        </AppText>
      ) : null}
      <PrimaryButton
        title="Xác nhận thanh toán"
        onPress={submit}
        disabled={!cart.length}
      />
    </Screen>
  );
}
export function PaymentSuccessScreen() {
  const router = useRouter();
  const [paymentError, setPaymentError] = useState("");
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { payments, completePayment } = useStore();
  const payment = payments.find((item) => item.id === id && item.userId === user?.email);
  return (
    <Screen>
      <View className="items-center py-10">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-mint">
          <Clock3 size={48} color={brand.forest} />
        </View>
        <AppText
          weight="bold"
          className="mt-6 text-center text-[25px] text-ink"
        >
          Thanh toán SePay QR · Bản thử nghiệm
        </AppText>
        <AppText className="mt-2 text-center text-[13px] leading-5 text-muted">
          Giao dịch đang chờ thanh toán. Dùng các nút bên dưới để mô phỏng kết quả SePay.
        </AppText>
        <View className="mt-5">
          <StatusBadge label={payment ? paymentStatusLabel(payment.status) : "Không tìm thấy"} tone={payment?.status === "Paid" ? "green" : "gray"} />
        </View>
      </View>
      {payment ? (
        <View className="mb-4 items-center rounded-2xl border border-mint bg-white p-5"><View className="h-32 w-32 items-center justify-center border border-mint bg-canvas"><AppText weight="bold" className="text-center text-[12px] text-forest">MÃ SEPAY QR MINH HỌA</AppText></View><AppText className="mt-2 text-[11px] text-muted">{payment.orderId}</AppText></View>
      ) : null}
      {payment ? (
        <OrderSummaryCard
          rows={[
            { label: "Giao dịch", value: payment.id },
            { label: "Đơn", value: payment.orderId },
            { label: "Phương thức", value: payment.method },
          ]}
          total={payment.amount}
        />
      ) : null}
      {paymentError ? <AppText className="mt-3 text-[12px] text-red-600">{paymentError}</AppText> : null}
      {payment?.status === "Pending" ? <View className="mt-5 gap-3"><PrimaryButton title="Mô phỏng: Đã thanh toán" onPress={() => { if (!completePayment(payment.id, "Paid")) setPaymentError("Không còn đủ sức chứa khay demo."); }} /><PrimaryButton title="Mô phỏng: Thanh toán thất bại" variant="outline" onPress={() => completePayment(payment.id, "Failed")} /><PrimaryButton title="Mô phỏng: Đã hết hạn" variant="outline" onPress={() => completePayment(payment.id, "Expired")} /></View> : null}
      <View className="mt-6 gap-3">
        {payment?.status === "Paid" ? <PrimaryButton
          title="Xem đơn hàng"
          onPress={() =>
            router.replace({
              pathname: "/orders/[id]",
              params: { id: payment?.orderId ?? "missing" },
            })
          }
        /> : null}
        <PrimaryButton
          title="Khay của tôi"
          variant="secondary"
          onPress={() => router.replace("/(app)/(tabs)/trays")}
        />
        <PrimaryButton
          title="Về trang chủ"
          variant="outline"
          onPress={() => router.replace("/(app)/(tabs)")}
        />
      </View>
    </Screen>
  );
}
