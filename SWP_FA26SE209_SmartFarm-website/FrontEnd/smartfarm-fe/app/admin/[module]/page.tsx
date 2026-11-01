import Link from "next/link";
import { Sprout, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigation } from "@/lib/navigation";
import { redirect } from "next/navigation";
export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { module } = await params;
  if (module === "planting-cycles") {
    const query = await searchParams;
    const next = new URLSearchParams({ tab: "cycles" });
    for (const key of ["cycle", "tray", "action"])
      if (typeof query[key] === "string") next.set(key, query[key]);
    redirect("/admin/trays?" + next.toString());
  }
  const title =
    navigation.flatMap((g) => g.items).find((i) => i.path === module)?.label ??
    "Thông tin tài khoản";
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 rounded-2xl bg-secondary p-5">
        <Sprout className="size-9 text-primary" />
      </div>
      <p className="eyebrow mb-3">{title}</p>
      <h1 className="text-2xl font-semibold">Trang đang được phát triển</h1>
      <p className="mt-3 mb-7 max-w-sm text-muted-foreground">
        Mô-đun này sẽ sớm có mặt trong SmartFarm. Bạn có thể tiếp tục khám phá
        tổng quan nông trại.
      </p>
      <Button asChild>
        <Link href="/admin/dashboard">
          <ArrowLeft />
          Về trang tổng quan
        </Link>
      </Button>
    </div>
  );
}
