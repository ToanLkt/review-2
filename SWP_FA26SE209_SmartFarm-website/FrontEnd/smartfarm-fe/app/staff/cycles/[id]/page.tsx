import { StaffCycleDetail } from "@/components/staff/staff-cycle-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <StaffCycleDetail id={id} />; }
