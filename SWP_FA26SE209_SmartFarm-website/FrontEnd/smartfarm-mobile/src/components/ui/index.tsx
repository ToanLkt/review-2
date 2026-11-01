import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import { brand, formatCurrency } from "@/constants/brand";

type Weight = "regular" | "medium" | "semibold" | "bold";
const fonts: Record<Weight, string> = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};
export function AppText({
  weight = "regular",
  style,
  ...props
}: TextProps & { weight?: Weight }) {
  return <Text {...props} style={[{ fontFamily: fonts[weight] }, style]} />;
}
export function ScreenContainer({
  children,
  scroll = true,
  background = brand.canvas,
}: {
  children: ReactNode;
  scroll?: boolean;
  background?: string;
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: background }}
      edges={["top", "bottom"]}
    >
      {scroll ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 32,
            }}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
export const Screen = ScreenContainer;
export function AppHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View className="mb-5 flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={() => router.back()}
        className="h-11 w-11 items-center justify-center rounded-xl bg-white"
      >
        <ArrowLeft size={21} color={brand.ink} />
      </Pressable>
      <AppText weight="bold" className="flex-1 text-[20px] text-ink">
        {title}
      </AppText>
      {action}
    </View>
  );
}
export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between gap-3">
      <AppText weight="bold" className="flex-1 text-[20px] text-ink">
        {title}
      </AppText>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          className="min-h-11 justify-center"
        >
          <AppText weight="semibold" className="text-[13px] text-forest">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
export const SectionHeading = SectionHeader;
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
}) {
  const styles =
    variant === "primary"
      ? {
          backgroundColor: disabled ? "#A9C4B3" : brand.forest,
          borderColor: brand.forest,
          color: "#fff",
        }
      : variant === "danger"
        ? {
            backgroundColor: "#fff",
            borderColor: brand.danger,
            color: brand.danger,
          }
        : variant === "outline"
          ? {
              backgroundColor: "#fff",
              borderColor: brand.line,
              color: brand.forest,
            }
          : {
              backgroundColor: brand.mint,
              borderColor: brand.mint,
              color: brand.forest,
            };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <AppText weight="semibold" style={{ color: styles.color, fontSize: 15 }}>
        {title}
      </AppText>
    </Pressable>
  );
}
export const SecondaryButton = (
  props: Omit<Parameters<typeof PrimaryButton>[0], "variant">,
) => <PrimaryButton {...props} variant="secondary" />;
export function StatusBadge({
  label,
  tone = "green",
}: {
  label: string;
  tone?: string;
}) {
  const tones: Record<string, [string, string]> = {
    green: [brand.mint, brand.forest],
    blue: ["#EFF6FF", brand.info],
    red: ["#FEF2F2", brand.danger],
    yellow: ["#FFFBEB", brand.orange],
    purple: ["#F5F3FF", "#7C3AED"],
    gray: ["#F9FAFB", brand.muted],
  };
  const [backgroundColor, color] = tones[tone] ?? tones.green;
  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: "flex-start",
      }}
    >
      <AppText weight="semibold" style={{ color, fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}
export function ProgressBar({ value }: { value: number }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-mint">
      <View
        style={{
          width: `${Math.max(0, Math.min(value, 100))}%`,
          height: "100%",
          backgroundColor: brand.forest,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function KpiCard({
  label,
  value,
  color = brand.ink,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View className="rounded-xl bg-white p-4">
      <AppText weight="bold" style={{ fontSize: 20, color }}>
        {value}
      </AppText>
      <AppText className="mt-1 text-[11px] text-muted">{label}</AppText>
    </View>
  );
}
export function FormField({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="mb-4">
      <AppText weight="semibold" className="mb-2 text-[13px] text-ink">
        {label}
      </AppText>
      <TextInput
        {...props}
        placeholderTextColor={brand.lightMuted}
        style={[
          {
            minHeight: props.multiline ? 108 : 50,
            borderWidth: 1,
            borderColor: error ? brand.danger : brand.line,
            borderRadius: 12,
            backgroundColor: brand.canvas,
            paddingHorizontal: 15,
            paddingVertical: 10,
            fontFamily: fonts.regular,
            fontSize: 14,
            color: brand.ink,
            textAlignVertical: props.multiline ? "top" : "center",
          },
          props.style,
        ]}
      />
      {error ? (
        <AppText className="mt-1 text-[12px]" style={{ color: brand.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View className="h-12 flex-row items-center gap-2 rounded-xl border border-mint bg-white px-3">
      <Search size={18} color={brand.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand.lightMuted}
        className="flex-1 font-inter text-[14px] text-ink"
      />
    </View>
  );
}
export function QuantityStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <View className="flex-row items-center rounded-xl border border-mint bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Giảm số lượng"
        onPress={() => onChange(Math.max(min, value - 1))}
        className="h-11 w-11 items-center justify-center"
      >
        <AppText weight="bold" className="text-[18px] text-forest">
          −
        </AppText>
      </Pressable>
      <AppText
        weight="bold"
        className="min-w-8 text-center text-[15px] text-ink"
      >
        {value}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tăng số lượng"
        onPress={() => onChange(value + 1)}
        className="h-11 w-11 items-center justify-center"
      >
        <AppText weight="bold" className="text-[18px] text-forest">
          +
        </AppText>
      </Pressable>
    </View>
  );
}
export function EmptyState({
  title,
  description,
  action,
  onPress,
}: {
  title: string;
  description: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="items-center rounded-2xl border border-mint bg-white px-6 py-10">
      <AppText weight="bold" className="text-center text-[17px] text-ink">
        {title}
      </AppText>
      <AppText className="mt-2 text-center text-[13px] leading-5 text-muted">
        {description}
      </AppText>
      {action && onPress ? (
        <View className="mt-5 w-full">
          <PrimaryButton title={action} onPress={onPress} />
        </View>
      ) : null}
    </View>
  );
}
export function OrderSummaryCard({
  rows,
  total,
}: {
  rows: { label: string; value: string }[];
  total: number;
}) {
  return (
    <View className="rounded-2xl border border-mint bg-white p-4">
      {rows.map((row) => (
        <View key={row.label} className="mb-3 flex-row justify-between gap-3">
          <AppText className="flex-1 text-[13px] text-muted">
            {row.label}
          </AppText>
          <AppText weight="medium" className="text-[13px] text-ink">
            {row.value}
          </AppText>
        </View>
      ))}
      <View className="mt-1 flex-row justify-between border-t border-mint pt-3">
        <AppText weight="bold" className="text-[15px] text-ink">
          Tổng cộng
        </AppText>
        <AppText weight="bold" className="text-[18px] text-forest">
          {formatCurrency(total)}
        </AppText>
      </View>
    </View>
  );
}
export function SegmentedTabs({
  values,
  selected,
  onChange,
}: {
  values: string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          onPress={() => onChange(value)}
          style={{
            minHeight: 42,
            justifyContent: "center",
            borderRadius: 22,
            paddingHorizontal: 16,
            backgroundColor: value === selected ? brand.forest : "#fff",
            borderWidth: 1,
            borderColor: value === selected ? brand.forest : brand.line,
          }}
        >
          <AppText
            weight="semibold"
            style={{
              fontSize: 12,
              color: value === selected ? "#fff" : brand.muted,
            }}
          >
            {value}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
