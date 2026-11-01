import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, KeyRound, Pencil, Truck } from "lucide-react-native";
import {
  AppText,
  FormField,
  PrimaryButton,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { brand } from "@/constants/brand";
import { useAuth } from "@/hooks/auth";
import { useStore } from "@/hooks/store";
export function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser, changePassword: updatePassword } = useAuth();
  const { profile, saveProfile, orders, trays, migratePaymentOwner, clearCart } = useStore();
  const [name, setName] = useState(user?.name ?? profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(user?.email ?? profile.email);
  const [address, setAddress] = useState(profile.address);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [activeForm, setActiveForm] = useState<"profile" | "password" | null>(
    null,
  );
  const [state, setState] = useState<"default" | "loading" | "success">(
    "default",
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(() => setState("default"), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  const save = () => {
    if (!name.trim() || !email.includes("@") || !/^\d{9,11}$/.test(phone))
      return setMessage("Vui lòng nhập thông tin hợp lệ.");
    setState("loading");
    setMessage("");
    setTimeout(() => {
      if (user && user.email !== email.trim().toLowerCase()) migratePaymentOwner(user.email, email);
      updateUser(name, email);
      saveProfile({
        ...profile,
        name,
        phone,
        email,
        address,
        avatarInitial: name
          .trim()
          .split(" ")
          .slice(-2)
          .map((part) => part[0])
          .join("")
          .toUpperCase(),
        totalOrders: orders.length,
        activeTrays: trays.length,
      });
      setState("success");
      setMessage("Đã lưu thông tin cá nhân.");
      setActiveForm(null);
    }, 350);
  };
  const changePassword = () => {
    if (
      newPassword.length < 6 ||
      newPassword !== confirm || !updatePassword(currentPassword, newPassword)
    )
      return setMessage(
        "Kiểm tra mật khẩu hiện tại và mật khẩu mới (ít nhất 6 ký tự).",
      );
    setMessage("Mật khẩu demo đã được xác nhận trong phiên này.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setActiveForm(null);
  };
  const cancelProfileEdit = () => {
    setName(user?.name ?? profile.name);
    setPhone(profile.phone);
    setEmail(user?.email ?? profile.email);
    setAddress(profile.address);
    setMessage("");
    setActiveForm(null);
  };
  const cancelPasswordEdit = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setMessage("");
    setActiveForm(null);
  };
  return (
    <Screen>
      <AppText weight="bold" className="text-[28px] text-ink">
        Tài khoản
      </AppText>
      <View className="mt-5 items-center rounded-2xl bg-white p-5">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-mint">
          <AppText weight="bold" className="text-[20px] text-forest">
            {profile.avatarInitial}
          </AppText>
        </View>
        <AppText weight="bold" className="mt-3 text-[19px] text-ink">
          {name}
        </AppText>
        <AppText className="mt-1 text-[12px] text-muted">{email}</AppText>
        <View className="mt-5 flex-row gap-2">
          {[
            { label: "Khay", value: trays.length },
            { label: "Đơn hàng", value: orders.length },
            { label: "Thành viên", value: profile.memberSince },
          ].map((item) => (
            <View
              key={item.label}
              className="flex-1 items-center rounded-xl bg-canvas p-2"
            >
              <AppText weight="bold" className="text-[13px] text-ink">
                {item.value}
              </AppText>
              <AppText className="text-[10px] text-muted">{item.label}</AppText>
            </View>
          ))}
        </View>
      </View>
      <SectionHeader title="Thông tin cá nhân" />
      {activeForm === "profile" ? (
        <View className="rounded-2xl bg-white p-4">
          <FormField label="Họ tên" value={name} onChangeText={setName} />
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
          <FormField
            label="Địa chỉ"
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <View className="gap-2">
            <PrimaryButton
              title={state === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
              onPress={save}
              disabled={state === "loading"}
            />
            <PrimaryButton
              title="Hủy"
              variant="outline"
              onPress={cancelProfileEdit}
            />
          </View>
        </View>
      ) : (
        <View className="rounded-2xl bg-white px-4">
          {[
            ["Họ tên", name],
            ["Số điện thoại", phone],
            ["Email", email],
            ["Địa chỉ", address || "Chưa cập nhật"],
          ].map(([label, value], index) => (
            <View
              key={label}
              className={`py-4 ${index ? "border-t border-mint" : ""}`}
            >
              <AppText className="text-[11px] text-muted">{label}</AppText>
              <AppText weight="semibold" className="mt-1 text-[14px] text-ink">
                {value}
              </AppText>
            </View>
          ))}
        </View>
      )}
      {activeForm !== "profile" ? (
        <View className="mt-3">
          <PrimaryButton
            title="Chỉnh sửa thông tin cá nhân"
            variant="outline"
            onPress={() => {
              setMessage("");
              setActiveForm("profile");
            }}
          />
        </View>
      ) : null}
      <SectionHeader title="Thanh toán" />
      <PrimaryButton title="Lịch sử thanh toán" variant="outline" onPress={() => router.push("/payment-history")} />
      <SectionHeader title="Đổi mật khẩu" />
      {activeForm === "password" ? (
        <View className="rounded-2xl bg-white p-4">
          <FormField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <FormField
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <FormField
            label="Xác nhận mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <View className="gap-2">
            <PrimaryButton title="Cập nhật mật khẩu" onPress={changePassword} />
            <PrimaryButton
              title="Hủy"
              variant="outline"
              onPress={cancelPasswordEdit}
            />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMessage("");
            setActiveForm("password");
          }}
          className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-white px-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint">
            <KeyRound size={19} color={brand.forest} />
          </View>
          <View className="flex-1">
            <AppText weight="semibold" className="text-[13px] text-ink">
              Đổi mật khẩu
            </AppText>
            <AppText className="mt-1 text-[11px] text-muted">
              Mở biểu mẫu xác nhận mật khẩu
            </AppText>
          </View>
          <Pencil size={17} color={brand.forest} />
        </Pressable>
      )}
      {message ? (
        <AppText className="mt-2 text-[12px] text-forest">{message}</AppText>
      ) : null}
      <SectionHeader title="Tiện ích" />
      {[
        { label: "Thông báo", icon: Bell, route: "/notifications" },
        { label: "Lịch giao hàng", icon: Truck, route: "/delivery" },
      ].map(({ label, icon: Icon, route }) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          onPress={() => router.push(route as "/notifications")}
          className="mb-2 min-h-14 flex-row items-center gap-3 rounded-xl bg-white px-4"
        >
          <Icon size={19} color={brand.forest} />
          <AppText className="text-[13px] text-ink">{label}</AppText>
        </Pressable>
      ))}
      <SectionHeader title="Tài khoản" />
      <View>
        <PrimaryButton
          title="Đăng xuất"
          variant="outline"
          onPress={() => {
            clearCart();
            signOut();
            router.replace("/sign-in");
          }}
        />
      </View>
    </Screen>
  );
}
