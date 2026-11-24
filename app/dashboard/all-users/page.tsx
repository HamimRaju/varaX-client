import type { Metadata } from "next";
import AdminSectionPage from "../admin-section-page";

export const metadata: Metadata = {
  title: "All Users",
  description: "Manage VaraX user accounts and roles.",
};

export default function AllUsersPage() {
  return (
    <AdminSectionPage
      section="users"
      callbackURL="/dashboard/all-users"
    />
  );
}
