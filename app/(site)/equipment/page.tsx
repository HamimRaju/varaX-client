import type { Metadata } from "next";
import { Suspense } from "react";
import EquipmentCatalog from "./equipment-catalog";

export const metadata: Metadata = {
  title: "All Equipment",
  description:
    "Browse and rent construction, photography, vehicle, agriculture, electronics, and event equipment across Bangladesh.",
};

type EquipmentPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    location?: string | string[];
    q?: string | string[];
  }>;
};

export default function EquipmentPage({ searchParams }: EquipmentPageProps) {
  return (
    <Suspense fallback={<div className="page-container">Loading equipment…</div>}>
      <EquipmentResults searchParams={searchParams} />
    </Suspense>
  );
}

async function EquipmentResults({ searchParams }: EquipmentPageProps) {
  const { category, location, q } = await searchParams;
  const initialCategory = Array.isArray(category) ? category[0] : category;
  const initialLocation = Array.isArray(location) ? location[0] : location;
  const initialQuery = Array.isArray(q) ? q[0] : q;

  return (
    <EquipmentCatalog
      initialCategory={initialCategory}
      initialLocation={initialLocation}
      initialQuery={initialQuery}
    />
  );
}
