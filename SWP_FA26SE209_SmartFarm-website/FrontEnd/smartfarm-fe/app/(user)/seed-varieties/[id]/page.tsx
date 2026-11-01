import { VarietyDetailPage } from "@/components/seed-varieties/variety-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <VarietyDetailPage id={id} />; }
