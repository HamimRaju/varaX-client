"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePlatform } from "@/app/lib/platform-context";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./payment-success.module.css";

function CheckIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m8 16.5 5.1 5L24 10.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 10v6.4l4.2 2.6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}

export default function PaymentSuccessClient({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { ready, bookings, user, getPaymentStatus, refresh } = usePlatform();
  const [remoteStatus, setRemoteStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");
  const [checking, setChecking] = useState(false);

  const booking = bookings.find((item) => item.id === bookingId);
  const bookingBelongsToUser =
    !booking ||
    !user ||
    booking.customerEmail === user.email ||
    booking.customerEmail === "";

  const loadStatus = useCallback(async () => {
    if (!bookingId) return;
    setChecking(true);
    try {
      const payment = await getPaymentStatus(bookingId);
      setRemoteStatus(payment.status);
      setStatusError("");
    } catch (error) {
      setStatusError(
        getErrorMessage(error, "We could not verify this payment yet."),
      );
    } finally {
      setChecking(false);
    }
  }, [bookingId, getPaymentStatus]);

  useEffect(() => {
    if (ready && !user) {
      const callbackURL = `/payment-success?bookingId=${encodeURIComponent(bookingId)}`;
      router.replace(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
    }
  }, [bookingId, ready, router, user]);

  useEffect(() => {
    if (!ready || !user || !bookingId) return;
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [bookingId, loadStatus, ready, user]);

  async function refreshStatus() {
    await Promise.all([loadStatus(), refresh()]);
  }

  if (!ready || !user) {
    return <main className={styles.successPage}><p>Loading your booking…</p></main>;
  }

  const status = remoteStatus ?? "pending";
  const paid = status === "paid" || status === "succeeded";
  const failed = status === "failed";
  const refunded = status === "refunded";
  const pending = !paid && !failed && !refunded;

  const heading = paid
    ? "Payment received!"
    : refunded
      ? "Payment refunded"
      : failed
        ? "Payment failed"
        : statusError
          ? "Payment status unavailable"
          : "Payment processing";
  const message = paid
    ? "Your payment is complete and the booking is confirmed. You can follow rental progress from your dashboard."
    : refunded
      ? "This payment has been refunded. Contact VaraX support if you need help with the booking."
      : failed
        ? "The payment did not go through. No charge was completed, so you can return to checkout and try again."
        : statusError
          ? statusError
          : "We are waiting for the payment provider to confirm this transaction. Refresh the status in a moment.";

  return (
    <main className={styles.successPage}>
      <section className={styles.successCard} aria-labelledby="success-title">
        {paid ? (
          <div className={styles.confetti} aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => <span key={index} />)}
          </div>
        ) : null}
        <span className={`${styles.successIcon} ${paid ? "" : styles.pendingIcon}`}>
          {paid ? <CheckIcon /> : <ClockIcon />}
        </span>
        <span className={styles.eyebrow}>
          {paid ? "PAYMENT COMPLETE" : "PAYMENT STATUS"}
        </span>
        <h1 id="success-title">{heading}</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.bookingSummary}>
          <span>Confirmation number</span>
          <strong>{bookingId || "—"}</strong>
          {booking && bookingBelongsToUser ? (
            <span>
              {booking.equipmentName} · {booking.bookingStatus} · {booking.paymentStatus}
            </span>
          ) : (
            <span>Booking details will appear in your dashboard.</span>
          )}
        </div>
        {pending || statusError ? (
          <button
            className={styles.refreshButton}
            type="button"
            onClick={() => void refreshStatus()}
            disabled={checking}
          >
            {checking ? "Checking status…" : "Refresh status"}
          </button>
        ) : null}
        <Link className={styles.bookingButton} href={`/dashboard/${user.role}/rentals`}>
          View My Rentals
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
        </Link>
        <Link className={styles.homeLink} href="/">Back to home</Link>
      </section>
    </main>
  );
}
