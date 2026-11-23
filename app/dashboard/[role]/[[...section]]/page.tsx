import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/app/lib/server-auth";
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
  const callbackURL = `/dashboard/${role}${section.length ? `/${section.join("/")}` : ""}`;
  const session = await requireSession(callbackURL);
  if (session.user.role !== role) {
    const target = `/dashboard/${session.user.role}`;
    const path = section.length ? `${target}/${section.join("/")}` : target;
    redirect(path);
  }
  return <DashboardWorkspace role={role as "customer" | "owner" | "admin"} section={section} />;
}
