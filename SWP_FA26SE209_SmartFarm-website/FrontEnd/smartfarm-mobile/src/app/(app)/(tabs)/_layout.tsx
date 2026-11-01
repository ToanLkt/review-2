import { Tabs } from "expo-router";
import { House, Leaf, Package, Sprout, UserRound } from "lucide-react-native";
import { brand } from "@/constants/brand";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.forest,
        tabBarInactiveTintColor: brand.lightMuted,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: brand.line,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="seeds"
        options={{
          title: "Hạt giống",
          tabBarIcon: ({ color, size }) => (
            <Leaf color={color} size={size} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="trays"
        options={{
          title: "Khay của tôi",
          tabBarIcon: ({ color, size }) => (
            <Sprout color={color} size={size} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} strokeWidth={1.9} />
          ),
        }}
      />
    </Tabs>
  );
}
