import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import EquipmentDetails from "./equipment-details";

export const metadata: Metadata = {
  title: "Equipment Details",
};

type EquipmentDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default function EquipmentDetailsPage({
  params,
}: EquipmentDetailsPageProps) {
  return (
    <Suspense fallback={<div className="page-container">Loading equipment details…</div>}>
      <EquipmentDetailsContent params={params} />
    </Suspense>
  );
}

async function EquipmentDetailsContent({ params }: EquipmentDetailsPageProps) {
  const { id } = await params;

  if (!/^[a-f\d]{24}$/i.test(id)) notFound();

  return <EquipmentDetails key={id} equipmentId={id} />;
}
