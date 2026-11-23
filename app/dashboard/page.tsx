import { requireSession } from "@/app/lib/server-auth";
import DashboardEntry from "./entry";

export default async function DashboardPage() {
  await requireSession("/dashboard");
  return <DashboardEntry />;
}
