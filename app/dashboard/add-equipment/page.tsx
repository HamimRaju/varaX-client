import type { Metadata } from "next";
import DashboardWorkspace from "../workspace";
import OwnerDashboardRoute from "../_components/owner-dashboard-route";

export const metadata: Metadata = {
  title: "Add Equipment",
  description: "List new equipment for rent on VaraX.",
};

export default function AddEquipmentRoute() {
  return (
    <OwnerDashboardRoute callbackURL="/dashboard/add-equipment">
      <DashboardWorkspace role="owner" section={["add-equipment"]} />
    </OwnerDashboardRoute>
  );
}
