"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType, EmblaPluginType } from "embla-carousel";
import { Button } from "./button";
import styles from "./carousel.module.css";

type EmblaApi = ReturnType<typeof useEmblaCarousel>[1];

type CarouselContextValue = {
  api: EmblaApi;
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  orientation: "horizontal" | "vertical";
  selectedIndex: number;
  scrollPrev: () => void;
  scrollNext: () => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("Carousel components must be used inside <Carousel>.");
  }

  return context;
}

type CarouselProps = HTMLAttributes<HTMLDivElement> & {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
};

function Carousel({
  children,
  className,
  opts,
  orientation = "horizontal",
  plugins,
  ...props
}: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const updateSelectedIndex = useCallback((emblaApi: NonNullable<EmblaApi>) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;

    api.on("select", updateSelectedIndex);
    api.on("reInit", updateSelectedIndex);

    return () => {
      api.off("select", updateSelectedIndex);
      api.off("reInit", updateSelectedIndex);
    };
  }, [api, updateSelectedIndex]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (orientation === "horizontal") {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        scrollNext();
      }
    },
    [orientation, scrollNext, scrollPrev],
  );

  return (
    <CarouselContext.Provider
      value={{
        api,
        carouselRef,
        orientation,
        selectedIndex,
        scrollPrev,
        scrollNext,
      }}
    >
      <div
        className={[styles.carousel, className].filter(Boolean).join(" ")}
        onKeyDownCapture={handleKeyDown}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

type CarouselContentProps = HTMLAttributes<HTMLDivElement> & {
  viewportClassName?: string;
};

function CarouselContent({
  children,
  className,
  viewportClassName,
  ...props
}: CarouselContentProps) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      className={[styles.viewport, viewportClassName].filter(Boolean).join(" ")}
      ref={carouselRef}
      data-orientation={orientation}
    >
      <div
        className={[styles.content, className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

type CarouselItemProps = HTMLAttributes<HTMLDivElement>;

function CarouselItem({ className, ...props }: CarouselItemProps) {
  const { orientation } = useCarousel();

  return (
    <div
      className={[styles.item, className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      role="group"
      aria-roledescription="slide"
      {...props}
    />
  );
}

function ArrowIcon({
  direction,
}: {
  direction: "left" | "right" | "up" | "down";
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === "left" ? (
        <path
          d="m14.5 5-7 7 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : direction === "right" ? (
        <path
          d="m9.5 5 7 7-7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : direction === "up" ? (
        <path
          d="m5 14.5 7-7 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="m5 9.5 7 7 7-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

type CarouselControlProps = {
  className?: string;
};

function CarouselPrevious({ className }: CarouselControlProps) {
  const { api, orientation, scrollPrev } = useCarousel();

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      type="button"
      aria-label="Show previous review"
      disabled={!api?.canScrollPrev()}
      onClick={scrollPrev}
    >
      <ArrowIcon direction={orientation === "horizontal" ? "left" : "up"} />
    </Button>
  );
}

function CarouselNext({ className }: CarouselControlProps) {
  const { api, orientation, scrollNext } = useCarousel();

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      type="button"
      aria-label="Show next review"
      disabled={!api?.canScrollNext()}
      onClick={scrollNext}
    >
      <ArrowIcon direction={orientation === "horizontal" ? "right" : "down"} />
    </Button>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
};
