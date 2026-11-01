import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff, Leaf, LockKeyhole, Mail } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText, FormField, PrimaryButton } from "@/components/ui";
import { authBackground, whiteBrandMark } from "@/constants/assets";
import { brand } from "@/constants/brand";
import { useAuth } from "@/hooks/auth";
import { useStore } from "@/hooks/store";

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: "center",
          }}
        >
          <View className="mb-9 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-forest">
              <Leaf size={25} color="#fff" />
            </View>
            <AppText weight="bold" className="text-[22px] text-ink">
              SmartFarm
            </AppText>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function PasswordField({
  value,
  onChangeText,
  label,
}: {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <FormField
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder="Nhập mật khẩu"
        secureTextEntry={!visible}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onPress={() => setVisible(!visible)}
        className="absolute bottom-4 right-1 h-11 w-11 items-center justify-center"
      >
        {visible ? (
          <EyeOff size={20} color={brand.muted} />
        ) : (
          <Eye size={20} color={brand.muted} />
        )}
      </Pressable>
    </View>
  );
}

function LoginField({
  label,
  icon: Icon,
  secure = false,
  ...props
}: TextInputProps & {
  label: string;
  icon: typeof Mail;
  secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <AppText weight="semibold" className="mb-2 text-[13px] text-ink">
        {label}
      </AppText>
      <View
        className="min-h-[54px] flex-row items-center rounded-[14px] border bg-[#F7FAF8] px-4"
        style={{ borderColor: focused ? brand.forest : "#DCE9E0" }}
      >
        <Icon size={19} color={focused ? brand.forest : brand.lightMuted} />
        <TextInput
          {...props}
          secureTextEntry={secure && !visible}
          placeholderTextColor={brand.lightMuted}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={styles.loginInput}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            hitSlop={10}
            onPress={() => setVisible((current) => !current)}
            className="h-11 w-11 items-end justify-center"
          >
            {visible ? (
              <EyeOff size={19} color={brand.muted} />
            ) : (
              <Eye size={19} color={brand.muted} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-[#173622]">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.loginScroll}
        >
          <View className="h-[310px] overflow-hidden bg-[#173622]">
            <Image
              source={authBackground}
              contentFit="cover"
              contentPosition="center"
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.fill, styles.loginOverlay]} />
            <SafeAreaView className="flex-1 px-6" edges={["top"]}>
              <View className="mt-3 flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-[14px] border border-white/25 bg-white/15">
                  <Image
                    source={whiteBrandMark}
                    contentFit="contain"
                    style={styles.headerLogo}
                  />
                </View>
                <AppText weight="bold" className="text-[20px] text-white">
                  SmartFarm
                </AppText>
              </View>
              <View className="mt-auto pb-14">
                <AppText weight="medium" className="text-[12px] text-white/80">
                  NÔNG TRẠI THÔNG MINH TRONG TẦM TAY
                </AppText>
                <AppText
                  weight="bold"
                  className="mt-3 text-[29px] leading-9 text-white"
                >
                  Chăm mầm xanh,{"\n"}gieo nhịp sống mới
                </AppText>
              </View>
            </SafeAreaView>
          </View>
          <View
            className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-8 pt-7"
            style={styles.formSurface}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    [],
  );

  const submit = () => {
    if (loading) return;
    if (!email.trim() || !password)
      return setError("Vui lòng nhập email và mật khẩu.");
    setError("");
    setLoading(true);
    submitTimer.current = setTimeout(() => {
      if (!signIn(email, password)) {
        setError("Email hoặc mật khẩu không đúng.");
        setLoading(false);
        return;
      }
      router.replace("/(app)/(tabs)");
    }, 450);
  };

  return (
    <LoginShell>
      <AppText weight="bold" className="text-[28px] text-ink">
        Chào mừng trở lại
      </AppText>
      <AppText className="mb-7 mt-2 text-[13px] leading-5 text-muted">
        Đăng nhập để theo dõi khay trồng và quản lý mùa vụ của bạn.
      </AppText>
      <LoginField
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError("");
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="ban@smartfarm.vn"
        editable={!loading}
      />
      <LoginField
        label="Mật khẩu"
        icon={LockKeyhole}
        secure
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (error) setError("");
        }}
        autoComplete="current-password"
        placeholder="Nhập mật khẩu"
        editable={!loading}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/forgot-password")}
        disabled={loading}
        className="mb-4 min-h-11 items-end justify-center"
      >
        <AppText weight="semibold" className="text-[12px] text-forest">
          Quên mật khẩu?
        </AppText>
      </Pressable>
      {error ? (
        <View className="mb-4 rounded-xl bg-[#FFF3F1] px-4 py-3">
          <AppText className="text-[12px]" style={{ color: brand.danger }}>
            {error}
          </AppText>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={submit}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={[styles.loginButton, { opacity: loading ? 0.68 : 1 }]}
      >
        {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
        <AppText weight="semibold" className="text-[15px] text-white">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </AppText>
      </Pressable>
      <View className="my-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-[#E5EEE8]" />
        <AppText className="text-[11px] text-muted">hoặc tiếp tục với</AppText>
        <View className="h-px flex-1 bg-[#E5EEE8]" />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() =>
          setError("Đăng nhập Google sẽ có khi kết nối dịch vụ xác thực.")
        }
        className="min-h-[50px] items-center justify-center rounded-[14px] border border-[#DCE9E0] bg-white"
      >
        <AppText weight="semibold" className="text-[13px] text-ink">
          Tiếp tục với Google
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/sign-up")}
        disabled={loading}
        className="mt-4 min-h-11 items-center justify-center"
      >
        <AppText className="text-[13px] text-muted">
          Chưa có tài khoản?{" "}
          <AppText weight="semibold" className="text-forest">
            Đăng ký ngay
          </AppText>
        </AppText>
      </Pressable>
      <View className="mt-5 flex-row items-center gap-3 rounded-[14px] bg-[#F2F7F3] p-4">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
          <Leaf size={18} color={brand.forest} />
        </View>
        <View className="flex-1">
          <AppText weight="semibold" className="text-[11px] text-ink">
            Tài khoản dùng thử
          </AppText>
          <AppText className="mt-1 text-[11px] text-muted">
            user@smartfarm.vn · User123!
          </AppText>
        </View>
      </View>
    </LoginShell>
  );
}
export function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { profile, saveProfile } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const submit = () => {
    if (
      !name.trim() ||
      !email.includes("@") ||
      !/^\d{9,11}$/.test(phone) ||
      password.length < 6
    )
      return setError(
        "Vui lòng nhập đầy đủ thông tin hợp lệ. Mật khẩu cần ít nhất 6 ký tự.",
      );
    if (password !== confirm) return setError("Mật khẩu xác nhận chưa khớp.");
    if (!agreed) return setError("Vui lòng đồng ý với điều khoản sử dụng.");
    if (signUp(name, email, password)) {
      saveProfile({
        ...profile,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        avatarInitial: name
          .trim()
          .split(" ")
          .slice(-2)
          .map((part) => part[0])
          .join("")
          .toUpperCase(),
      });
      router.replace("/sign-in");
    } else setError("Email đã được đăng ký trong bản demo.");
  };
  return (
    <AuthShell>
      <AppText weight="bold" className="text-[30px] text-ink">
        Tạo tài khoản
      </AppText>
      <AppText className="mb-8 mt-2 text-[14px] text-muted">
        Bắt đầu khu vườn thông minh của bạn.
      </AppText>
      <FormField
        label="Họ và tên"
        value={name}
        onChangeText={setName}
        placeholder="Nguyễn Văn A"
      />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="ban@smartfarm.vn"
      />
      <FormField
        label="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="0901234567"
      />
      <PasswordField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
      />
      <PasswordField
        label="Xác nhận mật khẩu"
        value={confirm}
        onChangeText={setConfirm}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed(!agreed)}
        className="mb-5 min-h-11 flex-row items-center gap-3"
      >
        <View
          className={`h-5 w-5 rounded border ${agreed ? "border-forest bg-forest" : "border-mint"}`}
        />
        <AppText className="flex-1 text-[12px] text-muted">
          Tôi đồng ý với điều khoản sử dụng SmartFarm.
        </AppText>
      </Pressable>
      {error ? (
        <AppText className="mb-3 text-[12px]" style={{ color: brand.danger }}>
          {error}
        </AppText>
      ) : null}
      <PrimaryButton title="Tạo tài khoản" onPress={submit} />
      <AppText className="my-5 text-center text-[12px] text-muted">
        hoặc
      </AppText>
      <PrimaryButton
        title="Tiếp tục với Google"
        onPress={() =>
          setError("Đăng nhập Google sẽ có khi kết nối dịch vụ xác thực.")
        }
        variant="outline"
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        className="mt-5 min-h-11 items-center justify-center"
      >
        <AppText className="text-[13px] text-muted">
          Đã có tài khoản?{" "}
          <AppText weight="semibold" className="text-forest">
            Đăng nhập
          </AppText>
        </AppText>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    inset: 0,
  },
  loginScroll: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  loginOverlay: {
    backgroundColor: "rgba(15, 49, 27, 0.48)",
  },
  headerLogo: {
    width: 27,
    height: 27,
  },
  formSurface: {
    shadowColor: "#173622",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  loginInput: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: brand.ink,
  },
  loginButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: brand.forest,
  },
});
