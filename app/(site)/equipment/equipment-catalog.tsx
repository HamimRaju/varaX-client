"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDemoPlatform } from "@/app/lib/demo-platform";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./equipment.module.css";

import { categories, rentalTypes, type Category, type RentalType } from "./equipment-data";

const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m12.7 12.7 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M20.8 8.8c0 4.1-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.8a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 6.7c0 3.5-5 7.3-5 7.3S3 10.2 3 6.7a5 5 0 1 1 10 0Z"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="m10 1.8 2.5 5.1 5.7.8-4.1 4 .9 5.7-5-2.7-5.1 2.7 1-5.7-4.2-4 5.8-.8L10 1.8Z" />
    </svg>
  );
}

export default function EquipmentCatalog({
  initialCategory,
  initialLocation,
  initialQuery,
}: {
  initialCategory?: string;
  initialLocation?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const { listings, favorites, toggleFavorite, user, notify } = useDemoPlatform();
  const [search, setSearch] = useState(initialQuery ?? "");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() =>
    categories.some((category) => category.value === initialCategory)
      ? [initialCategory as Category]
      : [],
  );
  const [selectedRentals, setSelectedRentals] = useState<RentalType[]>([]);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    () => ["Dhaka", "Chattogram", "Gazipur"].find((city) => initialLocation?.includes(city)) ?? "",
  );
  const [sortBy, setSortBy] = useState("price-asc");
  const [page, setPage] = useState(1);

  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = listings.filter((item) => {
      if (item.status !== "Approved") return false;
      const matchesSearch =
        !query ||
        `${item.name} ${item.categoryLabel} ${item.location}`.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const matchesRental =
        selectedRentals.length === 0 ||
        selectedRentals.some((rental) => item.rentals.includes(rental));
      const matchesPrice = item.price <= maxPrice;
      const matchesAvailability = !availableOnly || item.available;
      const matchesCity = !selectedCity || item.location.includes(selectedCity);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRental &&
        matchesPrice &&
        matchesAvailability &&
        matchesCity
      );
    });

    return filtered.sort((first, second) => {
      if (sortBy === "price-desc") return second.price - first.price;
      if (sortBy === "rating-desc") return second.rating - first.rating;
      if (sortBy === "recent") {
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      }
      return first.price - second.price;
    });
  }, [
    availableOnly,
    maxPrice,
    search,
    selectedCity,
    selectedCategories,
    selectedRentals,
    sortBy,
    listings,
  ]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredEquipment.length / pageSize));
  const visibleEquipment = filteredEquipment.slice((page - 1) * pageSize, page * pageSize);
  const firstItem = filteredEquipment.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, filteredEquipment.length);

  function toggleCategory(category: Category) {
    setPage(1);
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function toggleRental(rental: RentalType) {
    setPage(1);
    setSelectedRentals((current) =>
      current.includes(rental)
        ? current.filter((item) => item !== rental)
        : [...current, rental],
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setSelectedRentals([]);
    setMaxPrice(200000);
    setAvailableOnly(false);
    setSelectedCity("");
    setPage(1);
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  async function handleFavorite(id: string, isFavorite: boolean, name: string) {
    if (!user) {
      notify("Sign in to save equipment to your favorites.", "info");
      router.push(`/login?callbackURL=${encodeURIComponent("/favorites")}`);
      return;
    }
    try {
      await toggleFavorite(id);
      notify(
        isFavorite
          ? `Removed ${name} from favorites.`
          : `Added ${name} to favorites.`,
      );
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  }

  return (
    <main className={styles.catalogPage}>
      <div className={styles.catalogLayout}>
        <aside className={styles.filters} aria-label="Equipment filters">
          <div className={styles.filterHeading}>
            <h1>Filters</h1>
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.groupLabel} htmlFor="equipment-search">
              Search
            </label>
            <div className={styles.searchBox}>
              <SearchIcon />
              <input
                id="equipment-search"
                type="search"
                placeholder="Search equipment..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <fieldset className={styles.filterGroup}>
            <legend className={styles.groupLabel}>Category</legend>
            <div className={styles.optionList}>
              {categories.map((category) => (
                <label className={styles.checkOption} key={category.value}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => toggleCategory(category.value)}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.filterGroup}>
            <legend className={styles.groupLabel}>Rental Type</legend>
            <div className={styles.optionList}>
              {rentalTypes.map((rental) => (
                <label className={styles.checkOption} key={rental}>
                  <input
                    type="checkbox"
                    checked={selectedRentals.includes(rental)}
                    onChange={() => toggleRental(rental)}
                  />
                  <span>{rental}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.filterGroup}>
            <label className={styles.groupLabel} htmlFor="price-range">
              Price Range
            </label>
            <input
              className={styles.priceSlider}
              id="price-range"
              type="range"
              min="0"
              max="200000"
              step="500"
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(Number(event.target.value));
                setPage(1);
              }}
            />
            <div className={styles.priceRange}>
              <span>{formatPrice(0)}</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>
          </div>

          <fieldset className={styles.filterGroup}>
            <legend className={styles.groupLabel}>Location</legend>
            <div className={styles.locationOptions}>
              {["Dhaka", "Chattogram", "Gazipur"].map((city) => (
                <button
                  className={`${styles.locationChip} ${selectedCity === city ? styles.selectedLocation : ""}`}
                  type="button"
                  aria-pressed={selectedCity === city}
                  key={city}
                  onClick={() => {
                    setSelectedCity((current) => (current === city ? "" : city));
                    setPage(1);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
            <p className={styles.locationNote}>Listings shown near your selected city</p>
          </fieldset>

          <label className={`${styles.checkOption} ${styles.availabilityOption}`}>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => {
                setAvailableOnly(event.target.checked);
                setPage(1);
              }}
            />
            <span>Available only</span>
          </label>
        </aside>

        <section className={styles.results} aria-label="Equipment listings">
          <div className={styles.resultsToolbar}>
            <div className={styles.resultsSummary} aria-live="polite">
              <span className={styles.resultCount}>{filteredEquipment.length}</span>
              <span>
                Showing <strong>{firstItem}–{lastItem}</strong> of{" "}
                <strong>{filteredEquipment.length}</strong> rentals
              </span>
            </div>
            <label className={styles.sortControl}>
              <span>Sort by:</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="price-asc">Price Low to High</option>
                <option value="price-desc">Price High to Low</option>
                <option value="recent">Recently Added</option>
                <option value="rating-desc">Top Rated</option>
              </select>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="m4 6 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </label>
          </div>

          {visibleEquipment.length > 0 ? (
            <div className={styles.equipmentGrid}>
              {visibleEquipment.map((item) => {
                const isFavorite = favorites.includes(item.id);

                return (
                  <article className={styles.equipmentCard} key={item.id}>
                    <div className={styles.cardImage}>
                      <Link
                        className={styles.imageLink}
                        href={`/equipment/${item.id}`}
                        aria-label={`View ${item.name} details`}
                      >
                        <Image
                          src={item.image}
                          alt={item.imageAlt}
                          fill
                          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 30vw"
                          className={styles.productPhoto}
                          unoptimized
                        />
                      </Link>
                      <span className={item.available ? styles.availableBadge : styles.unavailableBadge}>
                        {item.available ? "Available" : "Booked"}
                      </span>
                      <button
                        className={`${styles.favoriteButton} ${isFavorite ? styles.isFavorite : ""}`}
                        type="button"
                        aria-label={isFavorite ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
                        aria-pressed={isFavorite}
                        onClick={() => {
                          void handleFavorite(item.id, isFavorite, item.name);
                        }}
                      >
                        <HeartIcon filled={isFavorite} />
                      </button>
                    </div>
                    <div className={styles.cardContent}>
                      <h2>
                        <Link href={`/equipment/${item.id}`}>{item.name}</Link>
                      </h2>
                      <p className={styles.categoryName}>{item.categoryLabel}</p>
                      <p className={styles.itemLocation}>
                        <PinIcon />
                        {item.location}
                      </p>
                      <div className={styles.cardFooter}>
                        <p className={styles.itemPrice}>
                          <strong>{formatPrice(item.price)}</strong>
                          <span>/ {item.rentals[0]?.toLowerCase() ?? "day"}</span>
                        </p>
                        <p className={styles.itemRating} aria-label={`${item.rating} out of 5 from ${item.reviews} reviews`}>
                          <StarIcon />
                          <strong>{item.rating.toFixed(1)}</strong>
                          <span>({item.reviews})</span>
                        </p>
                      </div>
                      <Link
                        className={styles.detailsLink}
                        href={`/equipment/${item.id}`}
                      >
                        View Details <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                <SearchIcon />
              </span>
              <h2>No equipment found</h2>
              <p>Try changing your search or clearing a few filters.</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {filteredEquipment.length > pageSize ? (
            <nav className={styles.pagination} aria-label="Equipment pages">
              <button
                className={styles.pageArrow}
                type="button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                ←
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  className={`${styles.pageNumber} ${page === pageNumber ? styles.currentPage : ""}`}
                  type="button"
                  aria-current={page === pageNumber ? "page" : undefined}
                  key={pageNumber}
                  onClick={() => changePage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className={styles.pageArrow}
                type="button"
                aria-label="Next page"
                disabled={page === pageCount}
                onClick={() => changePage(page + 1)}
              >
                →
              </button>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
