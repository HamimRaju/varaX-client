import type { Metadata } from "next";
import { SessionBoundary } from "@/app/components/session-boundary";
import FavoritesPage from "./favorites-page";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Your saved VaraX equipment rentals.",
};

export default function FavoritesRoute() {
  return (
    <SessionBoundary callbackURL="/favorites" requiredRole="customer">
      <FavoritesPage />
    </SessionBoundary>
  );
}
