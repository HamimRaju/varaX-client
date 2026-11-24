"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Category, Equipment, RentalType } from "@/app/(site)/equipment/equipment-data";
import { authClient } from "@/app/lib/auth-client";
import {
  api,
  clearAccessToken,
  getErrorMessage,
  type ApiAvailability,
  type ApiBooking,
  type ApiEquipment,
  type ApiPaymentStatus,
  type ApiPagination,
  type ApiUser,
} from "@/app/lib/api";

export type PlatformRole = "customer" | "owner" | "admin";
export type ListingStatus = "Pending" | "Approved" | "Rejected";
export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Active"
  | "Completed"
  | "Cancelled"
  | "Rejected";
export type PaymentStatus = "Paid" | "Unpaid" | "Refunded" | "Failed";

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  createdAt?: string;
  image?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
};

export type PlatformEquipment = Omit<Equipment, "id"> & {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerImage?: string;
  status: ListingStatus;
  quantity: number;
  condition: string;
  brand: string;
  model: string;
  description: string;
  terms: string;
  createdAt: string;
};

export type RentalBooking = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  customerName: string;
  customerEmail: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  startDate: string;
  endDate: string;
  bookingDate: string;
  quantity: number;
  rentalDuration?: number;
  equipmentCategory?: string;
  equipmentLocation?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  contact: string;
  address: string;
  notes: string;
  rentalType?: string;
};

export type NewEquipment = Pick<
  PlatformEquipment,
  | "name"
  | "category"
  | "categoryLabel"
  | "image"
  | "price"
  | "location"
  | "rentals"
  | "quantity"
  | "condition"
  | "brand"
  | "model"
  | "description"
  | "terms"
>;

export type NewBooking = {
  equipmentId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  contact: string;
  address: string;
  notes: string;
};

export type DashboardPageKey = "equipment" | "bookings" | "users" | "favorites";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

export type PlatformContextValue = {
  ready: boolean;
  roleDataLoading: boolean;
  user: PlatformUser | null;
  users: PlatformUser[];
  listings: PlatformEquipment[];
  featuredEquipment: PlatformEquipment[];
  favorites: string[];
  favoriteListings: PlatformEquipment[];
  bookings: RentalBooking[];
  toasts: Toast[];
  loadError: string;
  overview: Record<string, unknown>;
  analytics: Record<string, unknown>;
  dashboardPages: Partial<Record<DashboardPageKey, ApiPagination>>;
  refresh: () => Promise<void>;
  loadEquipment: (id: string) => Promise<PlatformEquipment>;
  loadDashboardPage: (kind: DashboardPageKey, page: number) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Pick<Partial<PlatformUser>, "name" | "image" | "phone" | "address">,
  ) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addEquipment: (input: NewEquipment) => Promise<PlatformEquipment>;
  updateEquipment: (
    id: string,
    updates: Partial<PlatformEquipment>,
  ) => Promise<void>;
  removeEquipment: (id: string) => Promise<void>;
  setListingStatus: (id: string, status: ListingStatus) => Promise<void>;
  createBooking: (input: NewBooking) => Promise<RentalBooking>;
  setBookingStatus: (
    id: string,
    status: Exclude<BookingStatus, "Pending" | "Cancelled">,
    reason?: string,
  ) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  checkAvailability: (
    equipmentId: string,
    startDate: string,
    endDate: string,
    quantity: number,
    signal?: AbortSignal,
  ) => Promise<ApiAvailability>;
  getPaymentStatus: (bookingId: string) => Promise<ApiPaymentStatus>;
  completePayment: (
    bookingId: string,
  ) => Promise<{ redirectUrl: string | null; status: string }>;
  setUserRole: (id: string, role: PlatformRole) => Promise<void>;
  setUserStatus: (id: string, isActive: boolean) => Promise<void>;
  notify: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

const CATEGORY_SLUGS: Record<string, Category> = {
  "Construction Equipment": "construction",
  "Photography Equipment": "photography",
  "Vehicles & Transportation": "vehicles",
  "Agriculture Equipment": "agriculture",
  Electronics: "electronics",
  "Event Equipment": "event",
};

const CATEGORY_LABELS: Record<Category, string> = {
  construction: "Construction Equipment",
  photography: "Photography Equipment",
  vehicles: "Vehicles & Transportation",
  agriculture: "Agriculture Equipment",
  electronics: "Electronics",
  event: "Event Equipment",
};

function normalizeRole(role: unknown): PlatformRole {
  return role === "owner" || role === "admin" ? role : "customer";
}

function toCategorySlug(category: string | undefined): Category {
  if (category && CATEGORY_SLUGS[category]) return CATEGORY_SLUGS[category];
  const key = category?.toLowerCase();
  if (key && key in CATEGORY_LABELS) return key as Category;
  return "construction";
}

function toRentalType(value: string | undefined): RentalType {
  const normalized = value?.toLowerCase();
  if (normalized === "weekly") return "Weekly";
  if (normalized === "monthly") return "Monthly";
  return "Daily";
}

function toListingStatus(value: string | undefined): ListingStatus {
  const normalized = value?.toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "rejected") return "Rejected";
  return "Approved";
}

function toBookingStatus(value: string | undefined): BookingStatus {
  switch (value) {
    case "confirmed":
      return "Confirmed";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

function toPaymentStatus(value: string | undefined): PaymentStatus {
  if (value === "paid") return "Paid";
  if (value === "refunded") return "Refunded";
  if (value === "failed") return "Failed";
  return "Unpaid";
}

function dateOnly(value: string | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function idOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return typeof id === "string" ? id : "";
  }
  return "";
}

function nameOf(value: unknown): string {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
}

function emailOf(value: unknown): string | undefined {
  if (value && typeof value === "object" && "email" in value) {
    const email = (value as { email?: unknown }).email;
    return typeof email === "string" && email ? email : undefined;
  }
  return undefined;
}

function imageOf(value: unknown): string | undefined {
  if (value && typeof value === "object" && "image" in value) {
    const image = (value as { image?: unknown }).image;
    return typeof image === "string" && image ? image : undefined;
  }
  return undefined;
}

export function mapEquipment(
  raw: ApiEquipment,
  fallback?: { ownerId?: string; ownerName?: string },
): PlatformEquipment {
  const category = toCategorySlug(raw.category);
  const quantity = Number(raw.availableQuantity) || 0;
  const ownerEmail = emailOf(raw.ownerId);

  return {
    id: raw._id,
    name: raw.name,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    image: raw.image || "/varax-home-hero.png",
    imageAlt: raw.name,
    price: Number(raw.price) || 0,
    location: raw.location,
    rentals: [toRentalType(raw.rentalType)],
    available: quantity > 0,
    ownerId:
      idOf(raw.ownerId) || fallback?.ownerId || "",
    ownerName:
      raw.ownerName ||
      nameOf(raw.ownerId) ||
      fallback?.ownerName ||
      "VaraX verified owner",
    ...(ownerEmail ? { ownerEmail } : {}),
    ...(raw.ownerImage || imageOf(raw.ownerId)
      ? { ownerImage: raw.ownerImage ?? imageOf(raw.ownerId) }
      : {}),
    status: toListingStatus(raw.status),
    quantity,
    condition: raw.condition || "Not specified",
    brand: raw.brand || "Not specified",
    model: raw.model || "Not specified",
    description: raw.description || "",
    terms:
      raw.terms ||
      "Contact the owner to confirm the rental terms.",
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function mapBooking(
  raw: ApiBooking,
  fallback: {
    user?: PlatformUser | null;
    listing?: PlatformEquipment;
    ownerName?: string;
  } = {},
): RentalBooking {
  const equipment =
    raw.equipment ??
    (raw.equipmentId && typeof raw.equipmentId === "object"
      ? raw.equipmentId
      : null);
  const customer =
    raw.customer ??
    (raw.customerId && typeof raw.customerId === "object"
      ? raw.customerId
      : null);
  const owner =
    raw.owner ??
    (raw.ownerId && typeof raw.ownerId === "object" ? raw.ownerId : null);
  const listing = fallback.listing;
  const ownBooking =
    fallback.user &&
    (idOf(raw.customerId) === fallback.user.id ||
      (customer ? customer.email === fallback.user.email : false));

  return {
    id: raw._id,
    equipmentId: equipment?._id ?? idOf(raw.equipmentId) ?? listing?.id ?? "",
    equipmentName: equipment?.name || listing?.name || "Equipment",
    equipmentImage:
      equipment?.image || listing?.image || "/varax-home-hero.png",
    equipmentCategory: equipment?.category || "",
    equipmentLocation: equipment?.location || "",
    customerName:
      customer?.name || (ownBooking ? fallback.user?.name : "") || "Customer",
    customerEmail:
      customer?.email || (ownBooking ? fallback.user?.email : "") || "",
    ownerId: owner?._id || idOf(raw.ownerId) || listing?.ownerId || "",
    ownerName:
      owner?.name ||
      listing?.ownerName ||
      fallback.ownerName ||
      "VaraX verified owner",
    ownerEmail: owner?.email || "",
    startDate: dateOnly(raw.startDate),
    endDate: dateOnly(raw.endDate),
    bookingDate: dateOnly(raw.createdAt),
    quantity: Number(raw.quantity) || 1,
    totalAmount: Number(raw.totalAmount ?? raw.amount) || 0,
    ...(typeof raw.rentalDuration === "number"
      ? { rentalDuration: raw.rentalDuration }
      : {}),
    paymentStatus: toPaymentStatus(raw.paymentStatus),
    bookingStatus: toBookingStatus(raw.bookingStatus ?? raw.status),
    contact: raw.contactNumber || "",
    address: raw.deliveryAddress || "",
    notes: raw.notes || raw.additionalNotes || "",
    rentalType: raw.rentalType,
  };
}

function mapUser(raw: ApiUser): PlatformUser {
  return {
    id: raw._id ?? raw.id ?? "",
    name: raw.name,
    email: raw.email,
    role: normalizeRole(raw.role),
    ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
    ...(raw.image ? { image: raw.image } : {}),
    ...(raw.phone ? { phone: raw.phone } : {}),
    ...(raw.address ? { address: raw.address } : {}),
    ...(typeof raw.isActive === "boolean" ? { isActive: raw.isActive } : {}),
  };
}

function absoluteImageUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("data:")) {
    throw new Error(
      "Browser file previews cannot be stored by the server. Use a hosted image URL.",
    );
  }
  if (trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`;
  }
  throw new Error("Enter an image URL beginning with http:// or https://.");
}

function equipmentPayload(input: Partial<NewEquipment>) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) {
    payload.description = input.description.trim();
  }
  if (input.category !== undefined) payload.category = input.category;
  if (input.location !== undefined) payload.location = input.location.trim();
  if (input.price !== undefined) payload.price = input.price;
  if (input.quantity !== undefined) payload.availableQuantity = input.quantity;
  if (input.condition !== undefined) payload.condition = input.condition.trim();
  if (input.brand !== undefined) payload.brand = input.brand.trim();
  if (input.model !== undefined) payload.model = input.model.trim();
  if (input.terms !== undefined) payload.terms = input.terms.trim();
  if (input.image !== undefined) payload.image = absoluteImageUrl(input.image);
  if (input.rentals !== undefined && input.rentals.length > 0) {
    payload.rentalType = input.rentals[0].toLowerCase();
  }

  return payload;
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const pathname = usePathname();
  const needsPublicEquipment =
    pathname === "/" ||
    pathname === "/equipment" ||
    pathname.startsWith("/equipment/");
  const [publicListings, setPublicListings] = useState<PlatformEquipment[]>([]);
  const [detailListings, setDetailListings] = useState<PlatformEquipment[]>([]);
  const [roleListings, setRoleListings] = useState<PlatformEquipment[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<PlatformEquipment[]>([]);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [publicReady, setPublicReady] = useState(false);
  const [roleDataLoading, setRoleDataLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileOverride, setProfileOverride] = useState<{
    userId: string;
    values: Partial<PlatformUser>;
  } | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown>>({});
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [dashboardPages, setDashboardPages] = useState<
    Partial<Record<DashboardPageKey, ApiPagination>>
  >({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const publicRequest = useRef(0);
  const roleRequest = useRef(0);

  const sessionUser = authSession?.user;
  const role = normalizeRole(sessionUser?.role);
  const userId = sessionUser?.id;
  const sessionUserName = sessionUser?.name;
  const sessionUserEmail = sessionUser?.email;
  const sessionUserImage = sessionUser?.image;
  const sessionUserPhone = sessionUser?.phone;
  const sessionUserAddress = sessionUser?.address;

  const sessionPlatformUser = useMemo<PlatformUser | null>(() => {
    if (!userId || !sessionUserName || !sessionUserEmail) return null;
    return {
      id: userId,
      name: sessionUserName,
      email: sessionUserEmail,
      role,
      ...(sessionUserImage ? { image: sessionUserImage } : {}),
      ...(sessionUserPhone ? { phone: sessionUserPhone } : {}),
      ...(sessionUserAddress ? { address: sessionUserAddress } : {}),
    };
  }, [
    role,
    sessionUserAddress,
    sessionUserEmail,
    sessionUserImage,
    sessionUserName,
    sessionUserPhone,
    userId,
  ]);

  const user = useMemo<PlatformUser | null>(() => {
    if (!sessionPlatformUser) return null;
    return {
      ...sessionPlatformUser,
      ...(profileOverride?.userId === sessionPlatformUser.id
        ? profileOverride.values
        : {}),
    };
  }, [profileOverride, sessionPlatformUser]);

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    },
    [],
  );

  const loadPublic = useCallback(async () => {
    const requestId = ++publicRequest.current;
    try {
      const result = await api.listEquipment({ limit: 6, sort: "newest" });
      if (requestId !== publicRequest.current) return;
      setPublicListings(result.data.map((item) => mapEquipment(item)));
      setLoadError("");
    } catch (error) {
      if (requestId !== publicRequest.current) return;
      setLoadError(getErrorMessage(error, "Equipment could not be loaded."));
    } finally {
      if (requestId === publicRequest.current) setPublicReady(true);
    }
  }, []);

  const loadRoleData = useCallback(async () => {
    const requestId = ++roleRequest.current;

    if (authPending) {
      setRoleDataLoading(false);
      return;
    }

    if (!userId) {
      setDetailListings([]);
      setRoleListings([]);
      setFavorites([]);
      setFavoriteListings([]);
      setBookings([]);
      setUsers([]);
      setOverview({});
      setAnalytics({});
      setDashboardPages({});
      setProfileOverride(null);
      setRoleDataLoading(false);
      return;
    }

    const dashboardRoute = pathname.startsWith("/dashboard");
    const needFavorites =
      dashboardRoute ||
      pathname === "/favorites" ||
      pathname.startsWith("/equipment");
    const needBookings =
      dashboardRoute ||
      pathname === "/payment" ||
      pathname === "/payment-success" ||
      pathname === "/payment-cancel";
    const needProfile = dashboardRoute || pathname === "/profile";
    if (!needFavorites && !needBookings && !needProfile) {
      setRoleDataLoading(false);
      return;
    }

    setRoleDataLoading(true);
    try {
      if (role === "customer") {
        const [favoriteResult, bookingResult, overviewResult, profileResult] = await Promise.all([
          needFavorites ? api.listFavorites() : null,
          needBookings ? api.listMyBookings() : null,
          dashboardRoute ? api.getCustomerOverview() : null,
          needProfile ? api.getProfile("customer") : null,
        ]);
        if (requestId !== roleRequest.current) return;
        if (favoriteResult) {
          setFavorites(
            favoriteResult.data.map((favorite) => idOf(favorite.equipmentId)),
          );
          setFavoriteListings(favoriteResult.data.map((favorite) => mapEquipment(favorite.equipmentId)));
          if (favoriteResult.pagination) {
            setDashboardPages((current) => ({
              ...current,
              favorites: favoriteResult.pagination,
            }));
          }
        }
        if (bookingResult) {
          setBookings(bookingResult.data.map((booking) =>
            mapBooking(booking, { user: sessionPlatformUser }),
          ));
          if (bookingResult.pagination) {
            setDashboardPages((current) => ({
              ...current,
              bookings: bookingResult.pagination,
            }));
          }
        }
        if (overviewResult) {
          setOverview(overviewResult.data);
          setAnalytics({});
        }
        if (profileResult) {
          setProfileOverride({
            userId,
            values: {
              name: profileResult.data.name,
              image: profileResult.data.image ?? undefined,
              phone: profileResult.data.phone ?? undefined,
              address: profileResult.data.address ?? undefined,
            },
          });
        }
      } else if (role === "owner") {
        if (dashboardRoute) {
          const [equipmentResult, bookingResult, overviewResult, analyticsResult, profileResult] = await Promise.all([
            api.listOwnerDashboardEquipment(),
            api.listOwnerBookings(),
            api.getOwnerOverview(),
            api.getOwnerAnalytics(),
            api.getProfile("owner"),
          ]);
          if (requestId !== roleRequest.current) return;
          setRoleListings(equipmentResult.data.map((item) => mapEquipment(item, {
            ownerId: userId,
            ownerName: sessionPlatformUser?.name ?? "VaraX owner",
          })));
          setBookings(bookingResult.data.map((booking) =>
            mapBooking(booking, { user: sessionPlatformUser }),
          ));
          setDashboardPages((current) => ({
            ...current,
            ...(equipmentResult.pagination ? { equipment: equipmentResult.pagination } : {}),
            ...(bookingResult.pagination ? { bookings: bookingResult.pagination } : {}),
          }));
          setOverview(overviewResult.data);
          setAnalytics(analyticsResult.data);
          setProfileOverride({
            userId,
            values: {
              name: profileResult.data.name,
              image: profileResult.data.image ?? undefined,
              phone: profileResult.data.phone ?? undefined,
              address: profileResult.data.address ?? undefined,
            },
          });
        } else if (needProfile) {
          const profileResult = await api.getProfile("owner");
          if (requestId !== roleRequest.current) return;
          setProfileOverride({
            userId,
            values: {
              name: profileResult.data.name,
              image: profileResult.data.image ?? undefined,
              phone: profileResult.data.phone ?? undefined,
              address: profileResult.data.address ?? undefined,
            },
          });
        }
      } else {
        if (!dashboardRoute && !needProfile) {
          setRoleDataLoading(false);
          return;
        }
        const [
          equipmentResult,
          bookingResult,
          userResult,
          overviewResult,
          analyticsResult,
          bookingAnalyticsResult,
          revenueAnalyticsResult,
          profileResult,
        ] = dashboardRoute
          ? await Promise.all([
              api.listAdminEquipment(),
              api.listAdminBookings(),
              api.listAdminUsers(),
              api.getAdminOverview(),
              api.getAdminAnalytics(),
              api.getAdminBookingAnalytics(),
              api.getAdminRevenueAnalytics(),
              api.getProfile("admin"),
            ])
          : [
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              await api.getProfile("admin"),
            ];
        if (requestId !== roleRequest.current) return;
        if (dashboardRoute && equipmentResult && bookingResult && userResult && overviewResult && analyticsResult && bookingAnalyticsResult && revenueAnalyticsResult) {
          setRoleListings(equipmentResult.data.map((item) => mapEquipment(item)));
          setBookings(bookingResult.data.map((booking) =>
            mapBooking(booking, { user: sessionPlatformUser }),
          ));
          setUsers(userResult.data.map(mapUser));
          setDashboardPages((current) => ({
            ...current,
            ...(equipmentResult.pagination ? { equipment: equipmentResult.pagination } : {}),
            ...(bookingResult.pagination ? { bookings: bookingResult.pagination } : {}),
            ...(userResult.pagination ? { users: userResult.pagination } : {}),
          }));
          setOverview(overviewResult.data);
          setAnalytics({
            ...analyticsResult.data,
            ...bookingAnalyticsResult.data,
            revenueSeries: revenueAnalyticsResult.data.results ?? [],
          });
        }
        setProfileOverride({
          userId,
          values: {
            name: profileResult?.data.name,
            image: profileResult?.data.image ?? undefined,
            phone: profileResult?.data.phone ?? undefined,
            address: profileResult?.data.address ?? undefined,
          },
        });
      }
      setLoadError("");
    } catch (error) {
      if (requestId !== roleRequest.current) return;
      setLoadError(getErrorMessage(error, "Your workspace could not be loaded."));
      setOverview({});
      setAnalytics({});
    } finally {
      if (requestId === roleRequest.current) setRoleDataLoading(false);
    }
  }, [authPending, pathname, role, sessionPlatformUser, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (needsPublicEquipment) {
        void loadPublic();
      } else {
        setPublicReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPublic, needsPublicEquipment]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoleData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoleData]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPublic(), loadRoleData()]);
  }, [loadPublic, loadRoleData]);

  const signOut = useCallback(async () => {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error(result.error.message || "Sign out failed.");
    }
    clearAccessToken();
    setProfileOverride(null);
    setDetailListings([]);
    setRoleListings([]);
    setFavorites([]);
    setFavoriteListings([]);
    setBookings([]);
    setUsers([]);
    setDashboardPages({});
  }, []);

  const updateProfile = useCallback(
    async (
      updates: Pick<
        Partial<PlatformUser>,
        "name" | "image" | "phone" | "address"
      >,
    ) => {
      if (!user) throw new Error("Sign in to update your profile.");
      const result = await api.updateProfile(user.role, updates);
      setProfileOverride({
        userId: user.id,
        values: mapUser(result.data),
      });
    },
    [user],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user || user.role !== "customer") {
        throw new Error("Sign in with a customer account to save favorites.");
      }
      const wasFavorite = favorites.includes(id);
      setFavorites((current) =>
        wasFavorite
          ? current.filter((favoriteId) => favoriteId !== id)
          : [...current, id],
      );
      const targetListing = [...publicListings, ...detailListings, ...roleListings].find(
        (listing) => listing.id === id,
      );
      setFavoriteListings((current) => wasFavorite
        ? current.filter((listing) => listing.id !== id)
        : targetListing && !current.some((listing) => listing.id === id)
          ? [targetListing, ...current]
          : current);
      try {
        if (wasFavorite) {
          await api.removeFavorite(id);
        } else {
          await api.addFavorite(id);
        }
        setDashboardPages((current) => {
          const pagination = current.favorites;
          if (!pagination) return current;
          const totalItems = Math.max(
            0,
            pagination.totalItems + (wasFavorite ? -1 : 1),
          );
          return {
            ...current,
            favorites: {
              ...pagination,
              totalItems,
              totalPages: Math.ceil(totalItems / pagination.limit),
              hasNextPage: pagination.currentPage < Math.ceil(totalItems / pagination.limit),
              hasPrevPage: pagination.currentPage > 1,
            },
          };
        });
      } catch (error) {
        setFavorites((current) =>
          wasFavorite
            ? [...current, id]
            : current.filter((favoriteId) => favoriteId !== id),
        );
        setFavoriteListings((current) => wasFavorite
          ? targetListing && !current.some((listing) => listing.id === id)
            ? [targetListing, ...current]
            : current
          : current.filter((listing) => listing.id !== id));
        throw error;
      }
    },
    [favorites, publicListings, detailListings, roleListings, user],
  );

  const addEquipment = useCallback(
    async (input: NewEquipment) => {
      if (!user || user.role !== "owner") {
        throw new Error("Only equipment owners can add listings.");
      }
      const result = await api.createEquipment(
        equipmentPayload(input) as Parameters<typeof api.createEquipment>[0],
      );
      const listing = mapEquipment(result.data, {
        ownerId: user.id,
        ownerName: user.name,
      });
      setRoleListings((current) => [
        listing,
        ...current.filter((item) => item.id !== listing.id),
      ]);
      return listing;
    },
    [user],
  );

  const updateEquipment = useCallback(
    async (id: string, updates: Partial<PlatformEquipment>) => {
      const payload = equipmentPayload(updates) as Parameters<
        typeof api.updateEquipment
      >[1];
      const result =
        user?.role === "admin"
          ? await api.updateAdminEquipment(id, payload)
          : await api.updateEquipment(id, payload);
      const listing = mapEquipment(result.data, {
        ownerId: user?.id,
        ownerName: user?.name,
      });
      setRoleListings((current) =>
        current.map((item) => (item.id === id ? listing : item)),
      );
      setPublicListings((current) =>
        current.map((item) => (item.id === id ? listing : item)),
      );
    },
    [user],
  );

  const removeEquipment = useCallback(
    async (id: string) => {
      if (user?.role === "admin") {
        await api.deleteAdminEquipment(id);
      } else {
        await api.deleteEquipment(id);
      }
      setRoleListings((current) => current.filter((item) => item.id !== id));
      setPublicListings((current) => current.filter((item) => item.id !== id));
      setFavorites((current) =>
        current.filter((favoriteId) => favoriteId !== id),
      );
      setDashboardPages((current) => {
        const pagination = current.equipment;
        if (!pagination) return current;
        const totalItems = Math.max(0, pagination.totalItems - 1);
        const totalPages = Math.ceil(totalItems / pagination.limit);
        const currentPage = Math.min(
          pagination.currentPage,
          Math.max(1, totalPages),
        );
        return {
          ...current,
          equipment: {
            ...pagination,
            currentPage,
            totalItems,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
          },
        };
      });
    },
    [user],
  );

  const setListingStatus = useCallback(
    async (id: string, status: ListingStatus) => {
      if (status === "Pending") {
        throw new Error("New listings always start as pending.");
      }
      const result = await api.setEquipmentStatus(
        id,
        status === "Approved" ? "approved" : "rejected",
      );
      const listing = mapEquipment(result.data);
      setRoleListings((current) =>
        current.map((item) => (item.id === id ? listing : item)),
      );
      setPublicListings((current) =>
        current.map((item) => (item.id === id ? listing : item)),
      );
      if (status === "Approved") await loadPublic();
    },
    [loadPublic],
  );

  const setUserRole = useCallback(async (id: string, nextRole: PlatformRole) => {
    await api.setUserRole(id, nextRole);
    setUsers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, role: nextRole } : member,
      ),
    );
  }, []);

  const setUserStatus = useCallback(async (id: string, isActive: boolean) => {
    await api.setUserStatus(id, isActive);
    setUsers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, isActive } : member,
      ),
    );
  }, []);

  const createBooking = useCallback(
    async (input: NewBooking) => {
      if (!user || user.role !== "customer") {
        throw new Error("Sign in with a customer account before booking equipment.");
      }
      const listing = [...publicListings, ...detailListings, ...roleListings].find(
        (item) => item.id === input.equipmentId,
      );
      const result = await api.createBooking(
        {
          equipmentId: input.equipmentId,
          startDate: input.startDate,
          endDate: input.endDate,
          quantity: input.quantity,
          contactNumber: input.contact,
          deliveryAddress: input.address,
          ...(input.notes ? { notes: input.notes } : {}),
        },
        window.crypto.randomUUID(),
      );
      const booking = mapBooking(result.data, { user, listing });
      setBookings((current) => [
        booking,
        ...current.filter((item) => item.id !== booking.id),
      ]);
      return booking;
    },
    [publicListings, detailListings, roleListings, user],
  );

  const setBookingStatus = useCallback(
    async (
      id: string,
      status: Exclude<BookingStatus, "Pending" | "Cancelled">,
      reason?: string,
    ) => {
      await api.setBookingStatus(id, status.toLowerCase() as
        | "confirmed"
        | "rejected"
        | "active"
        | "completed", reason);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, bookingStatus: status } : booking,
        ),
      );
    },
    [],
  );

  const cancelBooking = useCallback(async (id: string, reason?: string) => {
    await api.cancelBooking(id, reason);
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? { ...booking, bookingStatus: "Cancelled" as const }
          : booking,
      ),
    );
  }, []);

  const checkAvailability = useCallback(
    async (
      equipmentId: string,
      startDate: string,
      endDate: string,
      quantity: number,
      signal?: AbortSignal,
    ) => {
      const result = await api.checkAvailability(
        equipmentId,
        startDate,
        endDate,
        quantity,
        signal,
      );
      return result.data;
    },
    [],
  );

  const getPaymentStatus = useCallback(async (bookingId: string) => {
    const result = await api.getPaymentStatus(bookingId);
    return result.data;
  }, []);

  const completePayment = useCallback(async (bookingId: string) => {
    const result = await api.createCheckoutSession(bookingId);
    return { redirectUrl: result.data.url, status: "pending" };
  }, []);

  const loadEquipment = useCallback(async (id: string) => {
    const result = await api.getEquipment(id, Boolean(user));
    const listing = mapEquipment(result.data);
    if (listing.status === "Approved") {
      setDetailListings((current) => [
        listing,
        ...current.filter((item) => item.id !== listing.id),
      ]);
    } else {
      setRoleListings((current) => [
        listing,
        ...current.filter((item) => item.id !== listing.id),
      ]);
    }
    return listing;
  }, [user]);

  const loadDashboardPage = useCallback(
    async (kind: DashboardPageKey, page: number) => {
      if (!user || !Number.isInteger(page) || page < 1) {
        throw new Error("A signed-in account and valid page are required.");
      }
      const params = { page, limit: 50 };

      if (user.role === "customer") {
        if (kind === "favorites") {
          const result = await api.listFavorites(params);
          setFavorites(result.data.map((favorite) => idOf(favorite.equipmentId)));
          setFavoriteListings(result.data.map((favorite) => mapEquipment(favorite.equipmentId)));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, favorites: result.pagination }));
          }
          return;
        }
        if (kind === "bookings") {
          const result = await api.listMyBookings(params);
          setBookings(result.data.map((booking) => mapBooking(booking, { user })));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, bookings: result.pagination }));
          }
          return;
        }
      }

      if (user.role === "owner") {
        if (kind === "equipment") {
          const result = await api.listOwnerDashboardEquipment(params);
          setRoleListings(result.data.map((item) => mapEquipment(item, {
            ownerId: user.id,
            ownerName: user.name,
          })));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, equipment: result.pagination }));
          }
          return;
        }
        if (kind === "bookings") {
          const result = await api.listOwnerBookings(params);
          setBookings(result.data.map((booking) => mapBooking(booking, { user })));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, bookings: result.pagination }));
          }
          return;
        }
      }

      if (user.role === "admin") {
        if (kind === "equipment") {
          const result = await api.listAdminEquipment(params);
          setRoleListings(result.data.map((item) => mapEquipment(item)));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, equipment: result.pagination }));
          }
          return;
        }
        if (kind === "bookings") {
          const result = await api.listAdminBookings(params);
          setBookings(result.data.map((booking) => mapBooking(booking, { user })));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, bookings: result.pagination }));
          }
          return;
        }
        if (kind === "users") {
          const result = await api.listAdminUsers(params);
          setUsers(result.data.map(mapUser));
          if (result.pagination) {
            setDashboardPages((current) => ({ ...current, users: result.pagination }));
          }
          return;
        }
      }

      throw new Error("That page is not available for your account role.");
    },
    [user],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const listings = useMemo(() => {
    if (!user) return publicListings;
    if (user.role === "admin") return roleListings;
    const merged = new Map([
      ...publicListings.map((item) => [item.id, item] as const),
      ...detailListings.map((item) => [item.id, item] as const),
    ]);
    if (user.role === "owner") {
      for (const item of roleListings) merged.set(item.id, item);
    }
    return [...merged.values()];
  }, [publicListings, detailListings, roleListings, user]);

  const ready = (!needsPublicEquipment || publicReady) && !authPending;

  const value = useMemo<PlatformContextValue>(
    () => ({
      ready,
      roleDataLoading,
      user,
      users,
      listings,
      featuredEquipment: publicListings,
      favorites,
      favoriteListings,
      bookings,
      toasts,
      loadError,
      overview,
      analytics,
      dashboardPages,
      refresh,
      loadEquipment,
      loadDashboardPage,
      signOut,
      updateProfile,
      toggleFavorite,
      addEquipment,
      updateEquipment,
      removeEquipment,
      setListingStatus,
      setUserRole,
      setUserStatus,
      createBooking,
      setBookingStatus,
      cancelBooking,
      checkAvailability,
      getPaymentStatus,
      completePayment,
      notify,
      dismissToast,
    }),
    [
      ready,
      roleDataLoading,
      user,
      users,
      listings,
      publicListings,
      favorites,
      favoriteListings,
      bookings,
      toasts,
      loadError,
      overview,
      analytics,
      dashboardPages,
      refresh,
      loadEquipment,
      loadDashboardPage,
      signOut,
      updateProfile,
      toggleFavorite,
      addEquipment,
      updateEquipment,
      removeEquipment,
      setListingStatus,
      setUserRole,
      setUserStatus,
      createBooking,
      setBookingStatus,
      cancelBooking,
      checkAvailability,
      getPaymentStatus,
      completePayment,
      notify,
      dismissToast,
    ],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id} role="status">
            <span>{toast.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used inside PlatformProvider.");
  }
  return context;
}
