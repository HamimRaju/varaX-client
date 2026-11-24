import type { Metadata } from "next";
import { SessionBoundary } from "@/app/components/session-boundary";
import ProfilePage from "@/app/(site)/profile/profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your VaraX account information.",
};

export default function DashboardProfilePage() {
  return (
    <SessionBoundary callbackURL="/dashboard/profile">
      <ProfilePage dashboardRoute />
    </SessionBoundary>
  );
}
