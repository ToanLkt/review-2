import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rentalId = Number(id);
  if (!Number.isInteger(rentalId) || rentalId <= 0) notFound();
  redirect(`/orders/${rentalId}`);
}
