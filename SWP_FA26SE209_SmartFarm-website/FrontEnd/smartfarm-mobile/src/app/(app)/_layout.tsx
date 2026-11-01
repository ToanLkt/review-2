import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/hooks/auth";
import { brand } from "@/constants/brand";

export default function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brand.canvas },
        headerTintColor: brand.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trays/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="seeds/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="rent-tray/index" options={{ headerShown: false }} />
      <Stack.Screen name="rent-tray/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="payment-status" options={{ headerShown: false }} />
      <Stack.Screen name="delivery" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}
