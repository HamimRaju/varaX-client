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
    name: "Nusrat Jahan",
    role: "Photography renter",
    location: "Dhaka",
    rating: "5.0",
    quote:
      "Found a camera kit for a weekend shoot in minutes. Clear pricing and a helpful owner made the whole process easy.",
    initials: "NJ",
  },
  {
    name: "Imran Hossain",
    role: "Farm owner",
    location: "Gazipur",
    rating: "5.0",
    quote:
      "We rented a tractor for harvest season instead of buying one. It was a practical, affordable option for our farm.",
    initials: "IH",
  },
  {
    name: "Sadia Rahman",
    role: "Event organizer",
    location: "Chattogram",
    rating: "4.9",
    quote:
      "The flexible rental dates helped us organize our event without paying for equipment we only needed for a day.",
    initials: "SR",
  },
  {
    name: "Tanvir Ahmed",
    role: "Small business owner",
    location: "Dhaka",
    rating: "5.0",
    quote:
      "Booking verified equipment from local owners feels straightforward. I can compare options before making a decision.",
    initials: "TA",
  },
  {
    name: "Ayesha Karim",
    role: "Production coordinator",
    location: "Sylhet",
    rating: "5.0",
    quote:
      "We found the lighting and sound gear we needed for our launch, and everything was ready right on schedule.",
    initials: "AK",
  },
  {
    name: "Rakibul Islam",
    role: "Independent contractor",
    location: "Rajshahi",
    rating: "4.9",
    quote:
      "Renting tools for each job keeps our costs manageable. The whole process was simple from search to pickup.",
    initials: "RI",
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
                <span
                  className={styles.ratingStars}
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  <span aria-hidden="true">★★★★★</span>
                </span>
                <strong>{review.rating}</strong>
                <span className={styles.reviewCount}>
                  {review.location}, Bangladesh
                </span>
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
