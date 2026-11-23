export const categories = [
  { label: "Construction", value: "construction" },
  { label: "Photography", value: "photography" },
  { label: "Vehicles", value: "vehicles" },
  { label: "Agriculture", value: "agriculture" },
  { label: "Electronics", value: "electronics" },
  { label: "Event", value: "event" },
] as const;

export const rentalTypes = ["Daily", "Weekly", "Monthly"] as const;

export type Category = (typeof categories)[number]["value"];
export type RentalType = (typeof rentalTypes)[number];

/** Display shape for equipment returned by the API; no bundled listing fixtures. */
export type Equipment = {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  image: string;
  imageAlt: string;
  price: number;
  rating?: number;
  reviews?: number;
  location: string;
  rentals: RentalType[];
  available: boolean;
};
