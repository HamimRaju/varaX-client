import { Suspense } from "react";
import { LoadingState } from "@/app/components/page-states";
import { requireSession } from "@/app/lib/server-auth";
import DashboardWorkspace from "./workspace";

export type AdminSection = "users" | "equipment" | "rentals";

export default function AdminSectionPage({
  section,
  callbackURL,
}: {
  section: AdminSection;
  callbackURL: string;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProtectedAdminSection section={section} callbackURL={callbackURL} />
    </Suspense>
  );
}

async function ProtectedAdminSection({
  section,
  callbackURL,
}: {
  section: AdminSection;
  callbackURL: string;
}) {
  await requireSession(callbackURL, "admin");
  return <DashboardWorkspace role="admin" section={[section]} />;
}
