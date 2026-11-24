import type { Metadata } from "next";
import DashboardWorkspace from "../workspace";
import OwnerDashboardRoute from "../_components/owner-dashboard-route";

export const metadata: Metadata = {
  title: "My Equipment",
  description: "Manage your VaraX equipment listings.",
};

export default function MyEquipmentRoute() {
  return (
    <OwnerDashboardRoute callbackURL="/dashboard/my-equipment">
      <DashboardWorkspace role="owner" section={["equipment"]} />
    </OwnerDashboardRoute>
  );
}
