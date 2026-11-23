import type { Metadata } from "next";
import { SessionBoundary } from "@/app/components/session-boundary";
import ProfilePage from "./profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your VaraX account information.",
};

export default function ProfileRoute() {
  return (
    <SessionBoundary callbackURL="/profile">
      <ProfilePage />
    </SessionBoundary>
  );
}
