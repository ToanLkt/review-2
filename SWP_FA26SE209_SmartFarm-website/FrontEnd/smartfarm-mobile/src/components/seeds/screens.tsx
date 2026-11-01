import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { SeedCard } from "@/components/cards";
import {
  AppHeader,
  AppText,
  EmptyState,
  PrimaryButton,
  QuantityStepper,
  Screen,
  SearchBar,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { brand, formatCurrency } from "@/constants/brand";
import { seeds } from "@/data/mock";
import { useStore } from "@/hooks/store";
import { filterSeeds } from "@/lib/catalog";
const categories = [
  "Tất cả",
  "Oleaginous",
  "Legume",
  "Root",
  "Cruciferous",
  "Cereal",
];
export function SeedsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc">(
    "popular",
  );
  const visible = useMemo(
    () => filterSeeds(seeds, query, category, sort),
    [query, category, sort],
  );
  return (
    <Screen scroll={false}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" className="text-[28px] text-ink">
                Hạt giống
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Giỏ hàng"
                onPress={() => router.push("/cart")}
                className="h-11 w-11 items-center justify-center rounded-xl bg-white"
              >
                <ShoppingCart size={20} color={brand.forest} />
              </Pressable>
            </View>
            <AppText className="mb-5 mt-1 text-[13px] text-muted">
              Khám phá giống rau mầm cho khay của bạn.
            </AppText>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm hạt giống..."
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="my-4"
            >
              <View className="flex-row gap-2">
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => setCategory(item)}
                    className={`min-h-11 justify-center rounded-full px-4 ${category === item ? "bg-forest" : "border border-mint bg-white"}`}
                  >
                    <AppText
                      weight="semibold"
                      className={`text-[12px] ${category === item ? "text-white" : "text-muted"}`}
                    >
                      {item}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View className="mb-4 flex-row items-center justify-between">
              <AppText className="text-[12px] text-muted">
                {visible.length} sản phẩm
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setSort(
                    sort === "popular"
                      ? "price-asc"
                      : sort === "price-asc"
                        ? "price-desc"
                        : "popular",
                  )
                }
                className="min-h-11 justify-center"
              >
                <AppText weight="semibold" className="text-[12px] text-forest">
                  {sort === "popular"
                    ? "Phổ biến"
                    : sort === "price-asc"
                      ? "Giá thấp đến cao"
                      : "Giá cao đến thấp"}{" "}
                  ⇅
                </AppText>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SeedCard
            seed={item}
            onPress={() =>
              router.push({ pathname: "/seeds/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Không tìm thấy hạt giống"
            description="Thử từ khóa hoặc danh mục khác."
          />
        }
      />
    </Screen>
  );
}
export function SeedDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const seed = seeds.find((item) => item.id === id);
  const [qty, setQty] = useState(1);
  const { addItem } = useStore();
  if (!seed)
    return (
      <Screen>
        <AppHeader title="Sản phẩm hạt giống" />
        <EmptyState
          title="Không tìm thấy hạt giống"
          description="Sản phẩm này hiện không có trong danh mục."
        />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader
        title="Chi tiết hạt giống"
        action={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/cart")}
            className="h-11 w-11 items-center justify-center rounded-xl bg-white"
          >
            <ShoppingCart size={20} color={brand.forest} />
          </Pressable>
        }
      />
      <Image
        placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
        source={{ uri: seed.img }}
        contentFit="cover"
        style={{
          width: "100%",
          height: 238,
          borderRadius: 16,
          backgroundColor: brand.mint,
        }}
      />
      <View className="mt-4 flex-row items-center gap-2">
        <StatusBadge label={seed.badge} tone={seed.badgeColor} />
        <AppText className="text-[12px] text-muted">{seed.category}</AppText>
      </View>
      <AppText weight="bold" className="mt-3 text-[26px] text-ink">
        {seed.name}
      </AppText>
      <AppText className="mt-2 text-[14px] leading-6 text-muted">
        {seed.description}
      </AppText>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {seed.nutrition.map((item) => (
          <StatusBadge key={item} label={item} tone="green" />
        ))}
      </View>
      <View className="mt-5 flex-row gap-2">
        {[
          { label: "Thời gian", value: `${seed.growDays} ngày` },
          { label: "Độ khó", value: seed.difficulty },
          { label: "Đơn vị", value: seed.unit },
        ].map((item) => (
          <View key={item.label} className="flex-1 rounded-xl bg-white p-3">
            <AppText className="text-[11px] text-muted">{item.label}</AppText>
            <AppText weight="semibold" className="mt-1 text-[12px] text-ink">
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
      <View className="mt-6 flex-row items-center justify-between">
        <View>
          <AppText className="text-[12px] text-muted">Đơn giá</AppText>
          <AppText weight="bold" className="text-[21px] text-forest">
            {formatCurrency(seed.price)}
          </AppText>
        </View>
        <QuantityStepper value={qty} onChange={setQty} />
      </View>
      <AppText weight="bold" className="my-4 text-right text-[15px] text-ink">
        Tạm tính: {formatCurrency(seed.price * qty)}
      </AppText>
      <PrimaryButton
        title="Thêm vào giỏ hàng"
        onPress={() => {
          addItem({
            id: `seed-${seed.id}`,
            type: "seed",
            name: `Hạt giống ${seed.name}`,
            img: seed.img,
            price: seed.price,
            qty,
          });
          router.push("/cart");
        }}
      />
      <View className="mt-3">
        <PrimaryButton
          title="Thuê khay trồng"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/rent-tray",
              params: { seedId: seed.id },
            })
          }
        />
      </View>
      <SectionHeader title="Hướng dẫn gieo trồng" />
      {["Ngâm hạt", "Gieo vào khay", "Tưới và chờ"].map((step, index) => (
        <View
          key={step}
          className="mb-2 flex-row items-center gap-3 rounded-xl bg-white p-4"
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-mint">
            <AppText weight="bold" className="text-forest">
              {index + 1}
            </AppText>
          </View>
          <AppText weight="medium" className="text-[13px] text-ink">
            {step}
          </AppText>
        </View>
      ))}
      <SectionHeader title="Hạt giống liên quan" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {seeds
          .filter((item) => item.id !== seed.id)
          .slice(0, 3)
          .map((item) => (
            <SeedCard
              key={item.id}
              seed={item}
              compact
              onPress={() =>
                router.push({
                  pathname: "/seeds/[id]",
                  params: { id: item.id },
                })
              }
            />
          ))}
      </ScrollView>
    </Screen>
  );
}
