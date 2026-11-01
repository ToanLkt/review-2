import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/ui";
import { authBackground, whiteBrandMark } from "@/constants/assets";
import { useAuth } from "@/hooks/auth";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(user ? "/(app)/(tabs)" : "/sign-in");
    }, 2400);

    return () => clearTimeout(timer);
  }, [router, user]);

  return (
    <View className="flex-1 bg-[#173622]">
      <StatusBar style="light" />
      <Image
        source={authBackground}
        contentFit="cover"
        transition={300}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.fill, styles.overlay]} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            entering={FadeIn.duration(700)}
            className="h-[92px] w-[92px] items-center justify-center rounded-[26px] border border-white/25 bg-white/15"
            style={styles.logoSurface}
          >
            <Image
              source={whiteBrandMark}
              contentFit="contain"
              style={styles.logo}
            />
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(180).duration(650)}
            className="mt-6 items-center"
          >
            <AppText weight="bold" className="text-[38px] text-white">
              SmartFarm
            </AppText>
            <AppText
              weight="medium"
              className="mt-3 text-center text-[14px] text-white/85"
            >
              Smart Urban Microgreens Farm
            </AppText>
          </Animated.View>
        </View>
        <Animated.View
          entering={FadeIn.delay(650).duration(500)}
          className="items-center pb-7"
        >
          <View className="h-1 w-10 rounded-full bg-white/75" />
          <AppText className="mt-4 text-[11px] text-white/70">
            Gieo mầm xanh, sống thông minh
          </AppText>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    inset: 0,
  },
  overlay: {
    backgroundColor: "rgba(16, 48, 28, 0.54)",
    pointerEvents: "none",
  },
  logoSurface: {
    shadowColor: "#102F1C",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  logo: {
    width: 56,
    height: 56,
  },
});
