"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlatform } from "@/app/lib/platform-context";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./payment.module.css";

const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;
export default function PaymentCheckout({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { ready, user, bookings, completePayment, notify } = usePlatform();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const booking = bookings.find((item) => item.id === bookingId);

  useEffect(() => {
    if (ready && !user) {
      const callbackURL = `/payment?bookingId=${encodeURIComponent(bookingId)}`;
      router.replace(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
    }
  }, [bookingId, ready, router, user]);

  async function handlePayment() {
    if (!booking || processing || booking.paymentStatus === "Paid") return;
    setProcessing(true);
    setErrorMessage("");
    try {
      const result = await completePayment(booking.id);
      if (!result.redirectUrl) {
        throw new Error("Stripe Checkout could not be started. Please try again.");
      }
      window.location.assign(result.redirectUrl);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The payment could not be completed. Please try again.",
      );
      setErrorMessage(message);
      notify(message, "error");
      setProcessing(false);
    }
  }

  if (!ready || !user) {
    return <main className={styles.checkoutPage}><p className={styles.loading}>Loading checkout…</p></main>;
  }

  if (!booking || user.role !== "customer" || booking.customerEmail !== user.email) {
    return (
      <main className={styles.checkoutPage}>
        <section className={styles.checkoutCard}>
          <span className={styles.secureIcon}>!</span>
          <h1>Booking not found</h1>
          <p>This booking may have expired. Choose equipment and start a new booking.</p>
          <Link className={styles.primaryButton} href="/equipment">Browse equipment</Link>
        </section>
      </main>
    );
  }

  const alreadyPaid = booking.paymentStatus === "Paid";

  return (
    <main className={styles.checkoutPage}>
      <div className={styles.checkoutShell}>
        <header className={styles.checkoutHeader}>
          <Link className={styles.backLink} href={`/equipment/${booking.equipmentId}`}>← Back to equipment</Link>
          <span className={styles.secureLabel}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="4" y="8.5" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 8.5V6a3 3 0 0 1 6 0v2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Secure checkout
          </span>
        </header>
        <div className={styles.checkoutGrid}>
          <section className={styles.checkoutCard}>
            <span className={styles.eyebrow}>RENTAL SUMMARY</span>
            <h1>Review your booking</h1>
            <p className={styles.subheading}>Confirm your rental details before continuing.</p>
            <div className={styles.equipmentSummary}>
              <div className={styles.equipmentImage}>
                <Image src={booking.equipmentImage} alt="" fill sizes="5rem" unoptimized />
              </div>
              <div>
                <strong>{booking.equipmentName}</strong>
                <span>Owner: {booking.ownerName}</span>
              </div>
            </div>
            <dl className={styles.bookingDetails}>
              <div><dt>Rental period</dt><dd>{booking.startDate} — {booking.endDate}</dd></div>
              <div><dt>Quantity</dt><dd>{booking.quantity} unit{booking.quantity === 1 ? "" : "s"}</dd></div>
              <div><dt>Delivery address</dt><dd>{booking.address}</dd></div>
              <div><dt>Contact number</dt><dd>{booking.contact}</dd></div>
              {booking.notes ? <div><dt>Additional notes</dt><dd>{booking.notes}</dd></div> : null}
            </dl>
          </section>
          <aside className={styles.paymentCard}>
            <span className={styles.eyebrow}>PAYMENT</span>
            <h2>Order total</h2>
            <div className={styles.totalLine}><span>Rental amount</span><strong>{formatPrice(booking.totalAmount)}</strong></div>
            <div className={styles.totalLine}><span>Service fee</span><strong>{formatPrice(0)}</strong></div>
            <div className={`${styles.totalLine} ${styles.grandTotal}`}><span>Total due</span><strong>{formatPrice(booking.totalAmount)}</strong></div>
            <div className={styles.paymentNotice}>
              <strong>Secure Stripe checkout</strong>
              <span>You will be redirected to Stripe to complete this payment. VaraX does not store your card details.</span>
            </div>
            {alreadyPaid ? (
              <div className={styles.paymentNotice}>
                <strong>Payment already received</strong>
                <span>Payment is complete and the booking is confirmed. The owner can now coordinate the rental.</span>
              </div>
            ) : null}
            {errorMessage ? <p className={styles.paymentError} role="alert">{errorMessage}</p> : null}
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => void handlePayment()}
              disabled={processing || alreadyPaid || booking.bookingStatus === "Cancelled"}
            >
              {processing
                ? "Opening Stripe…"
                : alreadyPaid
                  ? "Payment already complete"
                  : booking.bookingStatus === "Cancelled"
                    ? "Booking cancelled"
                    : "Continue to Stripe"}
            </button>
            {alreadyPaid ? (
              <Link
                className={styles.cancelLink}
                href={`/payment-success?bookingId=${encodeURIComponent(booking.id)}`}
              >
                View payment status
              </Link>
            ) : (
              <Link className={styles.cancelLink} href={`/equipment/${booking.equipmentId}`}>Cancel and return</Link>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
