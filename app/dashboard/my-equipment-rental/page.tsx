import type { Metadata } from "next";
import DashboardWorkspace from "../workspace";
import OwnerDashboardRoute from "../_components/owner-dashboard-route";

export const metadata: Metadata = {
  title: "Equipment Rentals",
  description: "Review rental bookings for your VaraX equipment.",
};

export default function MyEquipmentRentalRoute() {
  return (
    <OwnerDashboardRoute callbackURL="/dashboard/my-equipment-rental">
      <DashboardWorkspace role="owner" section={["rentals"]} />
    </OwnerDashboardRoute>
  );
}
