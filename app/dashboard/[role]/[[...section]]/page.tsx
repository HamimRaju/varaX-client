import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardWorkspace from "../../workspace";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your VaraX rentals and equipment.",
};

const roles = new Set(["customer", "owner", "admin"]);

type DashboardRouteProps = {
  params: Promise<{ role: string; section?: string[] }>;
};

export default async function DashboardRolePage({ params }: DashboardRouteProps) {
  const { role, section = [] } = await params;
  if (!roles.has(role)) notFound();
  return <DashboardWorkspace role={role as "customer" | "owner" | "admin"} section={section} />;
}
