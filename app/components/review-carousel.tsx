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

const feedbackTopics = [
  {
    name: "Booking experience",
    message: "Verified renter feedback about the booking experience will appear here after a completed rental.",
    number: "01",
  },
  {
    name: "Equipment quality",
    message: "Verified renter feedback about equipment quality will appear here after a completed rental.",
    number: "02",
  },
  {
    name: "Owner communication",
    message: "Verified renter feedback about owner communication will appear here after a completed rental.",
    number: "03",
  },
  {
    name: "Pickup and delivery",
    message: "Verified renter feedback about pickup and delivery will appear here after a completed rental.",
    number: "04",
  },
  {
    name: "Overall experience",
    message: "Verified renter feedback about the overall experience will appear here after a completed rental.",
    number: "05",
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
      {String(feedbackTopics.length).padStart(2, "0")}
    </span>
  );
}

export default function ReviewCarousel() {
  return (
    <Carousel
      className={styles.carousel}
      opts={{ loop: true, align: "start", slidesToScroll: 1, duration: 35 }}
      aria-label="Renter reviews"
    >
      <CarouselContent
        viewportClassName={styles.viewport}
        className={styles.track}
      >
        {feedbackTopics.map((topic, index) => (
          <CarouselItem
            className={styles.slide}
            key={topic.name}
            aria-label={`${index + 1} of ${feedbackTopics.length}`}
          >
            <article className={styles.reviewCard}>
              <span className={styles.heartBadge} aria-hidden="true">
                <HeartIcon />
              </span>

              <div className={styles.reviewer}>
                <span className={styles.reviewerAvatar} aria-hidden="true">
                  {topic.number}
                </span>
                <span className={styles.reviewerDetails}>
                  <strong>{topic.name}</strong>
                  <span>Feedback topic</span>
                </span>
              </div>

              <p className={styles.quote}>{topic.message}</p>

              <div className={styles.ratingRow}>
                <span className={styles.reviewCount}>Awaiting verified feedback</span>
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
        Reviews will appear here after customers complete rentals
      </p>
    </Carousel>
  );
}
