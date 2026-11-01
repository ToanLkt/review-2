import { useState } from "react";
import { useRouter } from "expo-router";
import { AppText, FormField, PrimaryButton, Screen } from "@/components/ui";
import { useAuth } from "@/hooks/auth";
export default function ForgotPassword() { const router = useRouter(); const { requestReset } = useAuth(); const [email, setEmail] = useState(""); const [error, setError] = useState(""); return <Screen><AppText weight="bold" className="mt-12 text-[26px] text-ink">Quên mật khẩu</AppText><AppText className="my-4 text-[14px] leading-6 text-muted">Nhập email để mô phỏng gửi liên kết đặt lại.</AppText><FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />{error ? <AppText className="my-3 text-[12px] text-red-600">{error}</AppText> : null}<PrimaryButton title="Gửi liên kết demo" onPress={() => requestReset(email) ? router.push("/reset-password") : setError("Không tìm thấy email demo.")} /></Screen>; }
