import { requireSession } from "@/app/lib/server-auth";
import DashboardWorkspace from "../workspace";

export default async function CustomerRentalsPage() {
  await requireSession("/dashboard/my-rentals", "customer");
  return <DashboardWorkspace role="customer" section={["rentals"]} />;
}
