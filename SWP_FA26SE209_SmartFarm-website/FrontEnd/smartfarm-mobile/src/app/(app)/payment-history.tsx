import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { AppHeader, AppText, Screen } from "@/components/ui";
import { formatCurrency } from "@/constants/brand";
import { useStore } from "@/hooks/store";
import { useAuth } from "@/hooks/auth";
import { paymentStatusLabel, paymentTypeLabel } from "@/lib/payment";
export default function PaymentHistory() { const { payments } = useStore(); const { user } = useAuth(); const router = useRouter(); const own = payments.filter((item) => item.userId === user?.email); return <Screen><AppHeader title="Lịch sử thanh toán" />{own.length === 0 && <AppText className="text-[13px] text-muted">Chưa có giao dịch demo.</AppText>}{own.map((item) => <Pressable key={item.id} onPress={() => router.push({ pathname: "/payment-status", params: { id: item.id } })} className="mb-3 rounded-xl bg-white p-4"><AppText weight="bold" className="text-[14px] text-ink">{item.id}</AppText><AppText className="mt-2 text-[12px] text-muted">{item.orderId} · {paymentTypeLabel(item)} · {item.method}</AppText><AppText className="mt-1 text-[12px] text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")} · {formatCurrency(item.amount)} · {paymentStatusLabel(item.status)}</AppText></Pressable>)}</Screen>; }
