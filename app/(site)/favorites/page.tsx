import type { Metadata } from "next";
import { requireSession } from "@/app/lib/server-auth";
import FavoritesPage from "./favorites-page";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Your saved VaraX equipment rentals.",
};

export default async function FavoritesRoute() {
  await requireSession("/favorites", "customer");
  return <FavoritesPage />;
}
