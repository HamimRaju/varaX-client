"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/app/components/reveal";
import ReviewCarousel from "@/app/components/review-carousel";
import { usePlatform } from "@/app/lib/platform-context";
import styles from "./home.module.css";

const categories = [
  {
    name: "Construction Equipment",
    image: "/category-thumbnails/construction.png",
    value: "construction",
  },
  {
    name: "Photography Equipment",
    image: "/category-thumbnails/photography.png",
    value: "photography",
  },
  {
    name: "Vehicles & Transportation",
    image: "/category-thumbnails/vehicles.png",
    value: "vehicles",
  },
  {
    name: "Agriculture Equipment",
    image: "/category-thumbnails/agriculture.png",
    value: "agriculture",
  },
  {
    name: "Electronics",
    image: "/category-thumbnails/electronics.png",
    value: "electronics",
  },
  {
    name: "Event Equipment",
    image: "/category-thumbnails/event.png",
    value: "event",
  },
] as const;

const benefits = [
  {
    title: "Affordable Prices",
    description: "Get the best rates",
    kind: "bolt",
  },
  {
    title: "Local Owners",
    description: "Browse owner-listed equipment",
    kind: "shield",
  },
  {
    title: "Flexible Rental Period",
    description: "Daily, Weekly & Monthly",
    kind: "calendar",
  },
  {
    title: "Secure Payments",
    description: "Powered by Stripe",
    kind: "payment",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Find the right equipment",
    description: "Browse trusted local listings by category, location, rental period, and price.",
  },
  {
    number: "02",
    title: "Choose your rental dates",
    description: "Check availability, share your delivery details, and send a booking request.",
  },
  {
    number: "03",
    title: "Get to work",
    description: "Coordinate with the owner and get the equipment where your project needs it.",
  },
];

type BenefitKind = (typeof benefits)[number]["kind"];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m8 5.8 6.2 4.2L8 14.2V5.8Z" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.8" cy="8.8" r="5.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.7 12.7 3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FieldIcon({ kind }: { kind: "location" | "category" | "calendar" }) {
  if (kind === "location") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M19 10.1c0 5-7 10.4-7 10.4S5 15.1 5 10.1a7 7 0 1 1 14 0Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (kind === "category") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.5" y="4.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13.5" y="4.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <rect x="4.5" y="13.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13.5" y="13.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m9 14 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BenefitIcon({ kind }: { kind: BenefitKind }) {
  if (kind === "bolt") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m13.5 2.8-9 11h6l-.5 7.4 9.5-12h-6.2l.2-6.4Z" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 19 6v5.2c0 4.7-3 7.9-7 9.8-4-1.9-7-5.1-7-9.8V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9 11.5 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m9 14 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h16m-12 5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CategoryField() {
  return (
    <label className={styles.searchField}>
      <span className={styles.fieldIcon}>
        <FieldIcon kind="category" />
      </span>
      <span className={styles.fieldCopy}>
        <span className={styles.fieldLabel}>Category</span>
        <select aria-label="Choose equipment category" name="category" defaultValue="">
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.name}
            </option>
          ))}
        </select>
      </span>
      <span className={styles.fieldChevron} aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

export default function Home() {
  const { featuredEquipment, ready } = usePlatform();
  const featuredItems = featuredEquipment.slice(0, 6);

  return (
    <main className={styles.homePage}>
      <div className={styles.pageContainer}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroImage} aria-hidden="true">
            <Image
              src="/varax-home-hero.png"
              alt=""
              fill
              sizes="(max-width: 700px) 100vw, 62vw"
              loading="eager"
              fetchPriority="high"
              className={styles.heroPhoto}
            />
          </div>
          <div className={styles.heroScrim} aria-hidden="true" />

          <Reveal className={styles.heroContent}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Bangladesh&apos;s Trusted Rental Platform
            </p>
            <h1 id="hero-title">
              Rent Smart.
              <br />
              <span>Work Better.</span>
            </h1>
            <p className={styles.heroDescription}>
              Find and rent the best equipment for your project, event or business — anytime,
              anywhere in Bangladesh.
            </p>
            <div className={styles.heroActions}>
              <Link href="/equipment" className={styles.exploreButton}>
                Explore Equipment
                <ArrowIcon />
              </Link>
              <details className={styles.demo}>
                <summary className={styles.demoButton}>
                  <span className={styles.playButton}>
                    <PlayIcon />
                  </span>
                  Watch Demo
                </summary>
                <div className={styles.demoPopover}>
                  <strong>Rent in three simple steps</strong>
                  <span>Choose equipment, select your dates, and book directly with a verified owner.</span>
                </div>
              </details>
            </div>
          </Reveal>
        </section>

        <form className={styles.equipmentSearch} action="/equipment" method="get">
          <label className={styles.searchField}>
            <span className={styles.fieldIcon}>
              <FieldIcon kind="location" />
            </span>
            <span className={styles.fieldCopy}>
              <span className={styles.fieldLabel}>Location</span>
              <input
                aria-label="Rental location"
                type="text"
                name="location"
                placeholder="Dhaka, Bangladesh"
                defaultValue="Dhaka, Bangladesh"
              />
            </span>
          </label>

          <CategoryField />

          <label className={styles.searchField}>
            <span className={styles.fieldIcon}>
              <FieldIcon kind="calendar" />
            </span>
            <span className={styles.fieldCopy}>
              <span className={styles.fieldLabel}>Rental Period</span>
              <input aria-label="Rental start date" type="date" name="startDate" />
            </span>
            <span className={styles.fieldChevron} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>

          <button type="submit" className={styles.searchButton}>
            <SearchIcon />
            Search Equipment
          </button>
        </form>

        <section className={styles.featured} aria-labelledby="featured-title">
          <Reveal className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>READY WHEN YOU ARE</span>
              <h2 id="featured-title">Featured equipment</h2>
              <p>Popular picks from trusted equipment owners across Bangladesh.</p>
            </div>
            <Link className={styles.sectionLink} href="/equipment">
              Browse all equipment <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
          <div className={styles.featuredGrid}>
            {featuredItems.length ? featuredItems.map((item, index) => (
              <Reveal className={styles.featuredCard} delay={index * 0.045} key={item.id}>
                <Link className={styles.featuredImage} href={`/equipment/${item.id}`}>
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 30vw" unoptimized />
                  <span className={styles.featuredCategory}>{item.categoryLabel}</span>
                </Link>
                <div className={styles.featuredCopy}>
                  <div>
                    <h3><Link href={`/equipment/${item.id}`}>{item.name}</Link></h3>
                    <p>{item.location}</p>
                  </div>
                  <p className={styles.featuredPrice}>
                    <strong>৳{item.price.toLocaleString("en-BD")}</strong>
                    <span>/ {item.rentals[0]?.toLowerCase() ?? "rental period"}</span>
                  </p>
                </div>
              </Reveal>
            )) : (
              <p className={styles.featuredEmpty} aria-live="polite">
                {ready ? "No approved equipment is listed yet." : "Loading approved equipment…"}
              </p>
            )}
          </div>
        </section>

        <section className={styles.categoriesSection} aria-labelledby="categories-title">
          <Reveal className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>EXPLORE BY CATEGORY</span>
              <h2 id="categories-title">What are you looking for?</h2>
              <p>Find the right tools and equipment for the work ahead.</p>
            </div>
          </Reveal>
          <div className={styles.categories} aria-label="Popular equipment categories">
            {categories.map((category) => (
              <Reveal className={styles.categoryReveal} key={category.value}>
                <Link className={styles.categoryCard} href={`/equipment?category=${category.value}`}>
                  <span className={styles.categoryArt}>
                    <Image src={category.image} alt="" width={165} height={88} className={styles.categoryPhoto} />
                  </span>
                  <span className={styles.categoryName}>{category.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={styles.whySection} id="about" aria-labelledby="why-title">
          <Reveal className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>A BETTER WAY TO RENT</span>
              <h2 id="why-title">Work smarter with VaraX</h2>
              <p>Everything you need to rent with confidence, from discovery to delivery.</p>
            </div>
          </Reveal>
          <div className={styles.benefits} aria-label="Why rent with VaraX">
          {benefits.map((benefit) => (
            <div className={styles.benefit} key={benefit.title}>
              <span className={styles.benefitIcon}>
                <BenefitIcon kind={benefit.kind} />
              </span>
              <span className={styles.benefitCopy}>
                <strong>{benefit.title}</strong>
                <span>{benefit.description}</span>
              </span>
            </div>
          ))}
          </div>
        </section>

        <section className={styles.howSection} id="how-it-works" aria-labelledby="how-title">
          <Reveal className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>SIMPLE FROM START TO FINISH</span>
              <h2 id="how-title">How it works</h2>
              <p>Get the equipment you need without the cost of owning it.</p>
            </div>
            <Link className={styles.sectionLink} href="/equipment">
              Start exploring <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <Reveal className={styles.stepCard} delay={index * 0.08} key={step.number}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={styles.reviewsSection} aria-labelledby="reviews-title">
          <Reveal className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>CUSTOMER FEEDBACK</span>
              <h2 id="reviews-title">Hear from VaraX renters</h2>
              <p>Verified reviews will appear here after customers complete rentals.</p>
            </div>
          </Reveal>
          <ReviewCarousel />
        </section>

        <Reveal className={styles.ownerCta} delay={0.04}>
          <div>
            <span className={styles.sectionEyebrow}>HAVE EQUIPMENT TO SHARE?</span>
            <h2>Turn idle equipment into your next opportunity.</h2>
            <p>Connect with local teams and put your equipment to work with VaraX.</p>
          </div>
          <Link className={styles.ctaButton} href="/register?accountType=owner">Join as an owner <span aria-hidden="true">→</span></Link>
        </Reveal>
      </div>
    </main>
  );
}
