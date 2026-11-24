import { requireSession } from "@/app/lib/server-auth";
import DashboardWorkspace from "../workspace";

export default async function CustomerFavoritesPage() {
  await requireSession("/dashboard/favorites", "customer");
  return <DashboardWorkspace role="customer" section={["favorites"]} />;
}
