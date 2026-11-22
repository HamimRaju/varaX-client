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
  startDate: string;
  endDate: string;
  bookingDate: string;
  quantity: number;
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

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

type DemoPlatformValue = {
  ready: boolean;
  user: PlatformUser | null;
  users: PlatformUser[];
  listings: PlatformEquipment[];
  favorites: string[];
  bookings: RentalBooking[];
  toasts: Toast[];
  loadError: string;
  refresh: () => Promise<void>;
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

const DemoPlatformContext = createContext<DemoPlatformValue | null>(null);

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
  if (value === "pending") return "Pending";
  if (value === "rejected") return "Rejected";
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

function emailOf(value: unknown): string {
  if (value && typeof value === "object" && "email" in value) {
    const email = (value as { email?: unknown }).email;
    return typeof email === "string" ? email : "";
  }
  return "";
}

function imageOf(value: unknown): string | undefined {
  if (value && typeof value === "object" && "image" in value) {
    const image = (value as { image?: unknown }).image;
    return typeof image === "string" && image ? image : undefined;
  }
  return undefined;
}

function mapEquipment(
  raw: ApiEquipment,
  fallback?: { ownerId?: string; ownerName?: string },
): PlatformEquipment {
  const category = toCategorySlug(raw.category);
  const quantity = Number(raw.availableQuantity) || 0;

  return {
    id: raw._id,
    name: raw.name,
    category,
    categoryLabel: raw.category || CATEGORY_LABELS[category],
    image: raw.image || "/equipment/camera.jpg",
    imageAlt: raw.name,
    price: Number(raw.price) || 0,
    rating: 4.8,
    reviews: 0,
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
    ...(raw.ownerImage || imageOf(raw.ownerId)
      ? { ownerImage: raw.ownerImage ?? imageOf(raw.ownerId) }
      : {}),
    status: toListingStatus(raw.status),
    quantity,
    condition: raw.condition || "Well maintained",
    brand: raw.brand || "—",
    model: raw.model || "—",
    description: raw.description || "",
    terms:
      raw.terms ||
      "Return the equipment in the same condition it was received.",
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
      equipment?.image || listing?.image || "/equipment/camera.jpg",
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
    startDate: dateOnly(raw.startDate),
    endDate: dateOnly(raw.endDate),
    bookingDate: dateOnly(raw.createdAt),
    quantity: Number(raw.quantity) || 1,
    totalAmount: Number(raw.totalAmount) || 0,
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
    id: raw._id,
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

export function DemoPlatformProvider({ children }: { children: ReactNode }) {
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const [publicListings, setPublicListings] = useState<PlatformEquipment[]>([]);
  const [roleListings, setRoleListings] = useState<PlatformEquipment[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [publicReady, setPublicReady] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileOverride, setProfileOverride] = useState<Partial<PlatformUser>>(
    {},
  );
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

  const user = useMemo<PlatformUser | null>(() => {
    if (!userId || !sessionUserName || !sessionUserEmail) return null;
    return {
      id: userId,
      name: sessionUserName,
      email: sessionUserEmail,
      role,
      ...(sessionUserImage ? { image: sessionUserImage } : {}),
      ...(sessionUserPhone ? { phone: sessionUserPhone } : {}),
      ...(sessionUserAddress ? { address: sessionUserAddress } : {}),
      ...profileOverride,
    };
  }, [
    profileOverride,
    role,
    sessionUserAddress,
    sessionUserEmail,
    sessionUserImage,
    sessionUserName,
    sessionUserPhone,
    userId,
  ]);

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
      const result = await api.listEquipment({ limit: 50, sort: "newest" });
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

    if (authPending) return;

    if (!userId) {
      setRoleListings([]);
      setFavorites([]);
      setBookings([]);
      setUsers([]);
      setRoleReady(true);
      return;
    }

    setRoleReady(false);
    try {
      if (role === "customer") {
        const [favoriteResult, bookingResult] = await Promise.all([
          api.listFavorites(),
          api.listMyBookings(),
        ]);
        if (requestId !== roleRequest.current) return;
        setFavorites(
          favoriteResult.data.map((favorite) => idOf(favorite.equipmentId)),
        );
        setBookings(
          bookingResult.data.map((booking) =>
            mapBooking(booking, { user }),
          ),
        );
        setRoleListings([]);
        setUsers([]);
      } else if (role === "owner") {
        const [equipmentResult, bookingResult] = await Promise.all([
          api.listMyEquipment(),
          api.listOwnerBookings(),
        ]);
        if (requestId !== roleRequest.current) return;
        setRoleListings(
          equipmentResult.data.map((item) =>
            mapEquipment(item, {
              ownerId: userId,
              ownerName: sessionUser?.name ?? "VaraX owner",
            }),
          ),
        );
        setBookings(
          bookingResult.data.map((booking) =>
            mapBooking(booking, { user }),
          ),
        );
        setFavorites([]);
        setUsers([]);
      } else {
        const [equipmentResult, bookingResult, userResult] = await Promise.all([
          api.listAdminEquipment(),
          api.listAdminBookings(),
          api.listAdminUsers(),
        ]);
        if (requestId !== roleRequest.current) return;
        setRoleListings(
          equipmentResult.data.map((item) => mapEquipment(item)),
        );
        setBookings(
          bookingResult.data.map((booking) =>
            mapBooking(booking, { user }),
          ),
        );
        setUsers(userResult.data.map(mapUser));
        setFavorites([]);
      }
      setLoadError("");
    } catch (error) {
      if (requestId !== roleRequest.current) return;
      setLoadError(getErrorMessage(error, "Your workspace could not be loaded."));
    } finally {
      if (requestId === roleRequest.current) setRoleReady(true);
    }
  }, [authPending, role, sessionUser?.name, userId, user]);

  useEffect(() => {
    void loadPublic();
  }, [loadPublic]);

  useEffect(() => {
    void loadRoleData();
  }, [loadRoleData]);

  useEffect(() => {
    setProfileOverride({});
  }, [userId]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPublic(), loadRoleData()]);
  }, [loadPublic, loadRoleData]);

  const signOut = useCallback(async () => {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error(result.error.message || "Sign out failed.");
    }
    clearAccessToken();
    setProfileOverride({});
    setRoleListings([]);
    setFavorites([]);
    setBookings([]);
    setUsers([]);
  }, []);

  const updateProfile = useCallback(
    async (
      updates: Pick<
        Partial<PlatformUser>,
        "name" | "image" | "phone" | "address"
      >,
    ) => {
      const result = await authClient.updateUser({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.image ? { image: updates.image } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.address !== undefined ? { address: updates.address } : {}),
      });
      if (result.error) {
        throw new Error(result.error.message || "Profile update failed.");
      }
      setProfileOverride((current) => ({ ...current, ...updates }));
    },
    [],
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
      try {
        if (wasFavorite) {
          await api.removeFavorite(id);
        } else {
          await api.addFavorite(id);
        }
      } catch (error) {
        setFavorites((current) =>
          wasFavorite
            ? [...current, id]
            : current.filter((favoriteId) => favoriteId !== id),
        );
        throw error;
      }
    },
    [favorites, user],
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
    },
    [],
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
      if (!user) throw new Error("Sign in before booking equipment.");
      const listing = listings.find((item) => item.id === input.equipmentId);
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
    [listings, user],
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
    if ((process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "demo") === "stripe") {
      const result = await api.createCheckoutSession(bookingId);
      return { redirectUrl: result.data.url, status: "pending" };
    }

    const result = await api.completeDemoPayment(bookingId);
    const status = result.data.status;
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId
          ? { ...booking, paymentStatus: toPaymentStatus(status) }
          : booking,
      ),
    );
    return { redirectUrl: null, status };
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const listings = useMemo(() => {
    if (!user) return publicListings;
    if (user.role === "admin") return roleListings;
    if (user.role === "owner") {
      const merged = new Map(publicListings.map((item) => [item.id, item]));
      for (const item of roleListings) merged.set(item.id, item);
      return [...merged.values()];
    }
    return publicListings;
  }, [publicListings, roleListings, user]);

  const ready = publicReady && !authPending && roleReady;

  const value = useMemo<DemoPlatformValue>(
    () => ({
      ready,
      user,
      users,
      listings,
      favorites,
      bookings,
      toasts,
      loadError,
      refresh,
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
      user,
      users,
      listings,
      favorites,
      bookings,
      toasts,
      loadError,
      refresh,
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
    <DemoPlatformContext.Provider value={value}>
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
    </DemoPlatformContext.Provider>
  );
}

export function useDemoPlatform() {
  const context = useContext(DemoPlatformContext);
  if (!context) {
    throw new Error("useDemoPlatform must be used inside DemoPlatformProvider.");
  }
  return context;
}
