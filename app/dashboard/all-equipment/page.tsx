import type { Metadata } from "next";
import AdminSectionPage from "../admin-section-page";

export const metadata: Metadata = {
  title: "All Equipment",
  description: "Review and manage VaraX equipment listings.",
};

export default function AllEquipmentPage() {
  return (
    <AdminSectionPage
      section="equipment"
      callbackURL="/dashboard/all-equipment"
    />
  );
}
