"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePlatform, type PlatformEquipment } from "@/app/lib/platform-context";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./details.module.css";

const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const galleryPositions = ["50% 50%", "28% 50%", "70% 50%", "50% 72%"];

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 8.3c0 4.4-6 9.2-6 9.2S4 12.7 4 8.3a6 6 0 1 1 12 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.7" />
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="m4 9.2 3.1 3.1L14.2 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3.3" y="4.5" width="13.4" height="12.1" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 2.8v3.4m7-3.4v3.4M3.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function rentalDuration(
  rentalType: string,
  startDate: string,
  endDate: string,
): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86400000),
  );
  if (rentalType.toLowerCase() === "weekly") return Math.ceil(days / 7);
  if (rentalType.toLowerCase() === "monthly") {
    let months =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());
    if (end.getUTCDate() > start.getUTCDate()) months += 1;
    return Math.max(1, months);
  }
  return days;
}

export default function EquipmentDetails({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const {
    ready,
    user,
    listings,
    favorites,
    toggleFavorite,
    createBooking,
    checkAvailability,
    loadEquipment,
    notify,
  } = usePlatform();
  const [remoteItem, setRemoteItem] = useState<PlatformEquipment | null>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const item = listings.find((equipmentItem) => equipmentItem.id === equipmentId) ?? remoteItem;
  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [contactNumber, setContactNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [rentalType, setRentalType] = useState("Daily");
  const [showBooking, setShowBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<{
    remainingQuantity: number;
    isAvailable: boolean;
  } | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const bookingTriggerRef = useRef<HTMLButtonElement>(null);
  const bookingDialogRef = useRef<HTMLElement>(null);
  const isFavorite = favorites.includes(equipmentId);

  useEffect(() => {
    if (listings.some((equipmentItem) => equipmentItem.id === equipmentId)) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setItemLoading(true);
      void loadEquipment(equipmentId)
        .then((loaded) => {
          if (active) setRemoteItem(loaded);
        })
        .catch(() => {
          if (active) setRemoteItem(null);
        })
        .finally(() => {
          if (active) setItemLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [equipmentId, listings, loadEquipment]);

  useEffect(() => {
    if (!item || !startDate || !endDate || endDate <= startDate) {
      const timerId = window.setTimeout(() => {
        setAvailability(null);
        setAvailabilityError("");
      }, 0);
      return () => window.clearTimeout(timerId);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void checkAvailability(
        item.id,
        startDate,
        endDate,
        quantity,
        controller.signal,
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          setAvailability(result);
          setAvailabilityError("");
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setAvailability(null);
          setAvailabilityError(
            getErrorMessage(error, "Availability could not be checked."),
          );
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [checkAvailability, endDate, item, quantity, startDate]);

  useEffect(() => {
    if (!showBooking) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    const dialog = bookingDialogRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    focusableElements[0]?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowBooking(false);
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeyDown);
      previousFocus?.focus();
    };
  }, [showBooking]);

  if (!ready) {
    return (
      <main className={styles.detailsPage}>
        <div className={styles.notFound}>
          <p>Loading equipment details…</p>
        </div>
      </main>
    );
  }

  if (!item) {
    if (itemLoading) {
      return (
        <main className={styles.detailsPage}>
          <div className={styles.notFound}><p>Loading equipment details…</p></div>
        </main>
      );
    }
    return (
      <main className={styles.detailsPage}>
        <div className={styles.notFound}>
          <h1>Equipment not found</h1>
          <p>This listing may have been removed or is no longer available.</p>
          <Link href="/equipment">Browse all equipment</Link>
        </div>
      </main>
    );
  }

  const canViewUnapproved =
    user?.role === "admin" ||
    (user?.role === "owner" && item.ownerId === user.id);
  if (item.status !== "Approved" && !canViewUnapproved) {
    return (
      <main className={styles.detailsPage}>
        <div className={styles.notFound}>
          <h1>This listing is not available</h1>
          <p>Only approved listings can be viewed and booked.</p>
          <Link href="/equipment">Browse all equipment</Link>
        </div>
      </main>
    );
  }

  const bookingItem = item;
  const bookingUser = user;
  const isOwnListing =
    bookingUser?.role === "owner" &&
    (bookingUser.id === bookingItem.ownerId ||
      bookingUser.name === bookingItem.ownerName);
  const availableUnits = Math.max(
    0,
    availability?.remainingQuantity ?? bookingItem.quantity,
  );
  const bookingQuantity = Math.min(quantity, Math.max(availableUnits, 1));
  const ownerName = bookingItem.ownerName;
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 10);
  const billingPeriods = rentalDuration(
    rentalType || bookingItem.rentals[0] || "Daily",
    startDate || minDate,
    endDate || minDate,
  );
  const totalAmount = bookingItem.price * bookingQuantity * billingPeriods;

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingUser) {
      router.push(
        `/login?callbackURL=${encodeURIComponent(`/equipment/${equipmentId}`)}`,
      );
      return;
    }
    if (isOwnListing || submitting) return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        equipmentId: bookingItem.id,
        startDate,
        endDate,
        quantity: bookingQuantity,
        contact: contactNumber,
        address: deliveryAddress,
        notes: additionalNotes,
      });
      notify(
        "Booking request created. Complete payment to send it to the owner.",
        "success",
      );
      router.push(`/payment?bookingId=${encodeURIComponent(booking.id)}`);
    } catch (error) {
      notify(
        getErrorMessage(error, "Your booking request could not be created."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFavorite() {
    if (!item) return;
    if (!user) {
      notify("Sign in to save equipment to your favorites.", "info");
      router.push(
        `/login?callbackURL=${encodeURIComponent(`/equipment/${equipmentId}`)}`,
      );
      return;
    }
    try {
      await toggleFavorite(item.id);
      notify(isFavorite ? "Removed from favorites." : "Added to favorites.");
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  }

  return (
    <main className={styles.detailsPage}>
      <div className={styles.detailsShell}>
        <section className={styles.galleryColumn} aria-label={`${item.name} photos`}>
          <div className={styles.mainPhoto}>
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              priority
              sizes="(max-width: 700px) 100vw, 34vw"
              className={styles.mainImage}
              style={{ objectPosition: galleryPositions[activeImage] }}
              unoptimized
            />
            <span className={styles.photoCount}>
              {activeImage + 1} / {galleryPositions.length}
            </span>
          </div>
          <div className={styles.thumbnailList} role="group" aria-label="Choose a product photo">
            {galleryPositions.map((position, index) => (
              <button
                className={`${styles.thumbnail} ${activeImage === index ? styles.activeThumbnail : ""}`}
                type="button"
                aria-label={`View product photo ${index + 1}`}
                aria-pressed={activeImage === index}
                key={position}
                onClick={() => setActiveImage(index)}
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 25vw, 9vw"
                  className={styles.thumbnailImage}
                  style={{ objectPosition: position }}
                  unoptimized
                />
              </button>
            ))}
          </div>

          <section className={styles.ownerCard} aria-labelledby="owner-heading">
            <div className={styles.ownerCardHeading}>
              <h2 id="owner-heading">Owner Information</h2>
              <span className={styles.verifiedMark} aria-label="VaraX owner account">
                <CheckIcon />
              </span>
            </div>
            <div className={styles.ownerDetails}>
              <div className={styles.ownerAvatar} aria-hidden="true">
                {ownerName.split(" ").map((part) => part[0]).join("")}
              </div>
              <div className={styles.ownerCopy}>
                <strong>{ownerName}</strong>
                <span>Equipment owner</span>
              </div>
              <a
                className={styles.messageButton}
                href={`mailto:hello@varax.com?subject=${encodeURIComponent(`Question about ${item.name}`)}`}
              >
                Message
              </a>
            </div>
          </section>
        </section>

        <section className={styles.productDetails} aria-labelledby="equipment-title">
          <div className={styles.titleRow}>
            <div>
              <span className={styles.categoryBadge}>{item.categoryLabel}</span>
              <h1 id="equipment-title">{item.name}</h1>
            </div>
            <button
              className={`${styles.saveButton} ${isFavorite ? styles.saved : ""}`}
              type="button"
              aria-label={isFavorite ? "Remove from saved equipment" : "Save equipment"}
              aria-pressed={isFavorite}
              onClick={() => void handleFavorite()}
            >
              <HeartIcon filled={isFavorite} />
            </button>
          </div>

          <div className={styles.ratingLine}>
            {item.rating && item.reviews ? (
              <>
                <StarIcon />
                <strong>{item.rating.toFixed(1)}</strong>
                <span>({item.reviews} reviews)</span>
              </>
            ) : <span>No reviews yet</span>}
          </div>

          <p className={styles.priceLine}>
            <strong>{formatPrice(item.price)}</strong>
            <span>/ {item.rentals[0]?.toLowerCase() ?? "rental period"}</span>
          </p>

          <div className={styles.quickFacts}>
            <p>
              <PinIcon />
              <span>{item.location}, Bangladesh</span>
            </p>
            <p>
              <span className={styles.statusDot} />
              <span>
                {availableUnits > 0 ? `Available: ${availableUnits} units` : "Currently unavailable"}
              </span>
            </p>
          </div>

          <section className={styles.descriptionSection}>
            <h2>Description</h2>
            <p>{item.description || "The owner has not added a description yet."}</p>
            <dl className={styles.specificationList}>
              <div><dt>Condition</dt><dd>{item.condition}</dd></div>
              <div><dt>Brand</dt><dd>{item.brand}</dd></div>
              <div><dt>Model</dt><dd>{item.model}</dd></div>
            </dl>
          </section>

          <section className={styles.termsSection} id="rental-terms">
            <h2>Rental Terms</h2>
            <ul>
              <li>
                <CheckIcon />
                <span>Available for {item.rentals.join(", ").toLowerCase()} rentals</span>
              </li>
              <li>
                <CheckIcon />
                <span>{item.terms}</span>
              </li>
              <li>
                <CheckIcon />
                <span>Please return the equipment in its listed condition</span>
              </li>
            </ul>
          </section>
          <p className={styles.localNote}>Locally listed in Bangladesh · Prices in Bangladeshi Taka</p>
        </section>

        <aside className={styles.bookingCard} aria-labelledby="booking-heading">
          <div className={styles.bookingHeading}>
            <div>
              <span className={styles.bookingKicker}>Reserve for your project</span>
              <h2 id="booking-heading">Book Equipment</h2>
            </div>
            <CalendarIcon />
          </div>
          <p className={styles.bookingPrice}>{formatPrice(item.price)} <span>/ {item.rentals[0]?.toLowerCase() ?? "rental period"}</span></p>
          <p className={styles.bookingAvailability}>
            {availabilityError
              ? availabilityError
              : availableUnits > 0
                ? `${availableUnits} unit${availableUnits === 1 ? "" : "s"} available`
                : "Currently unavailable"}
          </p>
          <button
            className={styles.bookingButton}
            type="button"
            ref={bookingTriggerRef}
            disabled={availableUnits === 0 || isOwnListing}
            onClick={() => {
              if (!user) {
                router.push(
                  `/login?callbackURL=${encodeURIComponent(`/equipment/${equipmentId}`)}`,
                );
                return;
              }
              setContactNumber(user.phone ?? "");
              setDeliveryAddress(user.address ?? "");
              setRentalType(item.rentals[0] ?? "Daily");
              setShowBooking(true);
            }}
          >
            {availableUnits === 0
              ? "Currently Unavailable"
              : isOwnListing
                ? "Your own listing"
              : user
                ? "Book Now"
                : "Sign in to book"}
          </button>
          <p className={styles.bookingFootnote}>
            {isOwnListing
              ? "You can’t book equipment from your own listing."
              : "Choose dates and delivery details to see your rental total."}
          </p>
        </aside>
      </div>

      {showBooking ? (
        <div className={styles.bookingBackdrop} onMouseDown={() => setShowBooking(false)}>
          <section
            className={styles.bookingModal}
            ref={bookingDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.bookingHeading}>
              <div>
                <span className={styles.bookingKicker}>Reserve for your project</span>
                <h2 id="booking-modal-title">Book {item.name}</h2>
              </div>
              <button
                className={styles.modalClose}
                type="button"
                aria-label="Close booking form"
                onClick={() => setShowBooking(false)}
              >
                ×
              </button>
            </div>

            <form className={styles.bookingForm} onSubmit={submitBooking}>
            <div className={styles.dateGrid}>
              <label className={styles.formField}>
                <span>Start Date</span>
                <input
                  type="date"
                  min={minDate}
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className={styles.formField}>
                <span>End Date</span>
                <input
                  type="date"
                  min={startDate ? nextDate(startDate) : nextDate(minDate)}
                  required
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>

            <label className={styles.formField}>
              <span>Rental Type</span>
              <select value={rentalType} onChange={(event) => setRentalType(event.target.value)}>
                {item.rentals.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>

            <label className={styles.formField}>
              <span>Quantity</span>
              <select
                value={bookingQuantity}
                disabled={availableUnits === 0 || isOwnListing}
                onChange={(event) => setQuantity(Number(event.target.value))}
              >
                {Array.from({ length: Math.max(availableUnits, 1) }, (_, index) => index + 1).map(
                  (number) => (
                    <option value={number} key={number}>
                      {number} {number === 1 ? "unit" : "units"}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className={styles.formField}>
              <span>Contact Number</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder={bookingUser?.phone || "01XXXXXXXXX"}
                pattern="(\+?8801|01)[3-9][0-9]{8}"
                title="Enter a Bangladeshi number, such as 01XXXXXXXXX"
                required
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span>Delivery Address</span>
              <input
                type="text"
                required
                autoComplete="street-address"
                placeholder="Street, area, city"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
              />
            </label>

            <label className={styles.formField}>
              <span>Additional Notes <small>(optional)</small></span>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Anything the owner should know?"
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
              />
            </label>

            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <strong>{formatPrice(totalAmount)}</strong>
              <small>
                {billingPeriods}{" "}
                {rentalType.toLowerCase() === "daily"
                  ? billingPeriods === 1
                    ? "day"
                    : "days"
                  : billingPeriods === 1
                    ? rentalType.toLowerCase().replace(/ly$/, "")
                    : `${rentalType.toLowerCase().replace(/ly$/, "")}s`}{" "}
                · {bookingQuantity} {bookingQuantity === 1 ? "unit" : "units"}
              </small>
            </div>

            <button
              className={styles.bookingButton}
              type="submit"
              disabled={availableUnits === 0 || isOwnListing || bookingQuantity > availableUnits || submitting}
            >
              {submitting ? "Creating booking…" : "Continue to checkout"}
            </button>
            <p className={styles.bookingFootnote}>
              You will be redirected to Stripe to complete payment securely.
            </p>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
