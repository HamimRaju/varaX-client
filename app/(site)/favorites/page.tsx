import type { Metadata } from "next";
import FavoritesPage from "./favorites-page";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Your saved VaraX equipment rentals.",
};

export default function FavoritesRoute() {
  return <FavoritesPage />;
}
