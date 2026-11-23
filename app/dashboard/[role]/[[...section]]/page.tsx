import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/app/components/page-states";
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

export default function DashboardRolePage({ params }: DashboardRouteProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardRoleContent params={params} />
    </Suspense>
  );
}

async function DashboardRoleContent({ params }: DashboardRouteProps) {
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
