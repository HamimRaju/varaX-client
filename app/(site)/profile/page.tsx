import type { Metadata } from "next";
import { requireSession } from "@/app/lib/server-auth";
import ProfilePage from "./profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your VaraX account information.",
};

export default async function ProfileRoute() {
  await requireSession("/profile");
  return <ProfilePage />;
}
