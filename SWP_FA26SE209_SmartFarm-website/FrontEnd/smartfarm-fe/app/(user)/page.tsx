import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";

export const metadata: Metadata = {
  title: "SmartFarm | Rau mầm tươi, trồng thông minh hơn",
  description: "Chọn giống, thuê khay và theo dõi hành trình phát triển của rau mầm tại SmartFarm.",
};

export default function Page() {
  return <HomePage />;
}
