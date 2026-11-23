"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import styles from "./review-carousel.module.css";

const testimonials = [
  {
    name: "Customer feedback",
    role: "Verified renter reviews",
    quote: "Reviews from verified customers will appear here after completed rentals.",
    initials: "VX",
  },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8.8 2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SlideStatus() {
  const { selectedIndex } = useCarousel();

  return (
    <span className={styles.slideStatus} aria-live="polite">
      <span>{String(selectedIndex + 1).padStart(2, "0")}</span>
      <span aria-hidden="true"> / </span>
      {String(testimonials.length).padStart(2, "0")}
    </span>
  );
}

export default function ReviewCarousel() {
  return (
    <Carousel
      className={styles.carousel}
      opts={{ loop: true, align: "start", slidesToScroll: 1 }}
      aria-label="Renter reviews"
    >
      <CarouselContent
        viewportClassName={styles.viewport}
        className={styles.track}
      >
        {testimonials.map((review, index) => (
          <CarouselItem
            className={styles.slide}
            key={review.name}
            aria-label={`${index + 1} of ${testimonials.length}`}
          >
            <article className={styles.reviewCard}>
              <span className={styles.heartBadge} aria-hidden="true">
                <HeartIcon />
              </span>

              <div className={styles.reviewer}>
                <span className={styles.reviewerAvatar} aria-hidden="true">
                  {review.initials}
                </span>
                <span className={styles.reviewerDetails}>
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </span>
              </div>

              <blockquote className={styles.quote}>
                “{review.quote}”
              </blockquote>

              <div className={styles.ratingRow}>
                <span className={styles.reviewCount}>No reviews have been published yet.</span>
              </div>
            </article>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className={styles.carouselControls}>
        <CarouselPrevious className={styles.carouselButton} />
        <SlideStatus />
        <CarouselNext className={styles.carouselButton} />
      </div>
      <p className={styles.carouselHint}>
        Use the arrows to explore renter stories one at a time
      </p>
    </Carousel>
  );
}
