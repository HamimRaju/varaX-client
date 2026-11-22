import type { Metadata } from "next";
import ProfilePage from "./profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your VaraX account information.",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
