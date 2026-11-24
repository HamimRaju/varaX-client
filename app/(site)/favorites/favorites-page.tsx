"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/app/lib/platform-context";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./favorites.module.css";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.8 8.8c0 4.1-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.8a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const {
    ready,
    user,
    roleDataLoading,
    favoriteListings,
    dashboardPages,
    loadDashboardPage,
    toggleFavorite,
    notify,
  } = usePlatform();
  const [pageLoading, setPageLoading] = useState(false);
  const savedItems = favoriteListings;
  const favoritePagination = dashboardPages.favorites;

  useEffect(() => {
    if (ready && !user) router.replace("/login?callbackURL=%2Ffavorites");
  }, [ready, router, user]);

  async function removeFavorite(id: string) {
    try {
      await toggleFavorite(id);
      notify("Removed from favorites.", "success");
    } catch (error) {
      notify(getErrorMessage(error, "The favorite could not be removed."), "error");
    }
  }

  async function changePage(page: number) {
    if (pageLoading) return;
    setPageLoading(true);
    try {
      await loadDashboardPage("favorites", page);
    } catch (error) {
      notify(getErrorMessage(error, "Favorites could not be loaded."), "error");
    } finally {
      setPageLoading(false);
    }
  }

  if (!ready || !user || roleDataLoading) {
    return <main className={styles.favoritesPage}><p>Loading your favorites…</p></main>;
  }

  return (
    <main className={styles.favoritesPage}>
      <div className={styles.favoritesShell}>
        <div className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>YOUR RENTAL SHORTLIST</span>
            <h1>My Favorites</h1>
            <p>Your saved equipment, all in one place.</p>
          </div>
          <span className={styles.favoriteCount}>
            <HeartIcon />
            {favoritePagination?.totalItems ?? savedItems.length} saved
          </span>
        </div>

        {savedItems.length > 0 ? (
          <section className={styles.favoriteList} aria-label="Saved equipment">
            {savedItems.map((item) => (
              <article className={styles.favoriteCard} key={item.id}>
                <Link className={styles.itemImage} href={`/equipment/${item.id}`}>
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 600px) 5rem, 6rem"
                  />
                </Link>
                <div className={styles.itemDetails}>
                  <span className={styles.category}>{item.categoryLabel}</span>
                  <h2>
                    <Link href={`/equipment/${item.id}`}>{item.name}</Link>
                  </h2>
                  <p className={styles.itemPrice}>
                    ৳{item.price.toLocaleString("en-BD")} <span>/ {item.rentals[0]?.toLowerCase() ?? "rental period"}</span>
                  </p>
                </div>
                <div className={styles.itemActions}>
                  <Link className={styles.detailsButton} href={`/equipment/${item.id}`}>
                    View Details
                  </Link>
                  <button
                    className={styles.removeButton}
                    type="button"
                    onClick={() => void removeFavorite(item.id)}
                    aria-label={`Remove ${item.name} from favorites`}
                  >
                    Remove
                  </button>
                </div>
                <span className={styles.savedHeart} aria-hidden="true">
                  <HeartIcon />
                </span>
              </article>
            ))}
          </section>
        ) : favoritePagination?.totalItems ? (
          <section className={styles.emptyState} aria-live="polite">
            <h2>Loading favorites…</h2>
          </section>
        ) : (
          <section className={styles.emptyState}>
            <span className={styles.emptyHeart} aria-hidden="true">
              <HeartIcon />
            </span>
            <h2>Your favorites list is empty</h2>
            <p>Save equipment you like and it will be waiting here.</p>
            <Link className={styles.browseButton} href="/equipment">
              Browse equipment
            </Link>
          </section>
        )}

        {favoritePagination && favoritePagination.totalPages > 1 ? (
          <nav className={styles.favoritePagination} aria-label="Favorite pages">
            <button
              type="button"
              disabled={pageLoading || !favoritePagination.hasPrevPage}
              onClick={() => void changePage(favoritePagination.currentPage - 1)}
            >
              Previous
            </button>
            <span>Page {favoritePagination.currentPage} of {favoritePagination.totalPages}</span>
            <button
              type="button"
              disabled={pageLoading || !favoritePagination.hasNextPage}
              onClick={() => void changePage(favoritePagination.currentPage + 1)}
            >
              Next
            </button>
          </nav>
        ) : null}

        <div className={styles.pageFootnote}>
          <span className={styles.footnoteDot} />
          Find something you love? Check availability and book it in a few clicks.
        </div>
      </div>
    </main>
  );
}
