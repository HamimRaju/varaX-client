import { getBackendAccessToken } from "@/app/lib/auth-client";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export type ApiPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  pagination?: ApiPagination;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  idempotencyKey?: string;
};

const TOKEN_LIFETIME_MS = 10 * 60 * 1000;
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(forceRefresh = false): Promise<string> {
  if (
    !forceRefresh &&
    cachedToken &&
    cachedToken.expiresAt > Date.now()
  ) {
    return cachedToken.value;
  }

  const token = await getBackendAccessToken();
  cachedToken = { value: token, expiresAt: Date.now() + TOKEN_LIFETIME_MS };
  return token;
}

export function clearAccessToken(): void {
  cachedToken = null;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, auth = false, signal, idempotencyKey } = options;

  async function send(forceToken: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    if (auth) headers.Authorization = `Bearer ${await accessToken(forceToken)}`;

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  }

  let response = await send(false);
  if (response.status === 401 && auth) {
    cachedToken = null;
    response = await send(true);
  }

  const payload = (await response.json().catch(() => null)) as
    | (ApiEnvelope<T> & { message?: string })
    | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || `The server rejected the request (${response.status}).`,
      response.status,
    );
  }

  return payload;
}

function queryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export type ApiEquipmentOwner = {
  _id: string;
  name?: string;
  email?: string;
  image?: string | null;
  role?: string;
  isActive?: boolean;
};

export type ApiEquipment = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  price: number;
  rentalType: string;
  availableQuantity: number;
  condition?: string;
  brand?: string;
  model?: string;
  image: string;
  terms?: string;
  ownerId?: string | ApiEquipmentOwner;
  ownerName?: string;
  ownerImage?: string | null;
  status?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiUserSummary = {
  _id: string;
  name?: string;
  email?: string;
  image?: string | null;
  role?: string;
};

export type ApiBooking = {
  _id: string;
  customerId?: string | ApiUserSummary;
  ownerId?: string | ApiUserSummary;
  equipmentId?: string | {
    _id: string;
    name?: string;
    image?: string;
    category?: string;
    location?: string;
  };
  customer?: ApiUserSummary | null;
  owner?: ApiUserSummary | null;
  equipment?: {
    _id: string;
    name?: string;
    image?: string;
    category?: string;
    location?: string;
  } | null;
  startDate: string;
  endDate: string;
  quantity: number;
  contactNumber?: string;
  deliveryAddress?: string;
  additionalNotes?: string;
  notes?: string;
  rentalType?: string;
  pricePerUnit?: number;
  rentalDuration?: number;
  subtotal?: number;
  totalAmount: number;
  bookingStatus?: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

export type ApiFavorite = {
  _id: string;
  createdAt?: string;
  equipmentId: ApiEquipment;
};

export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  image?: string | null;
  createdAt?: string;
  isActive?: boolean;
};

export type ApiAvailability = {
  availableQuantity: number;
  reservedQuantity: number;
  remainingQuantity: number;
  requestedQuantity: number;
  isAvailable: boolean;
};

export type ApiPaymentStatus = {
  bookingId: string;
  amount: number;
  amountMinorUnits?: number;
  currency: string;
  status: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  fulfillmentStatus?: string;
};

export type ApiCheckoutSession = {
  paymentId: string;
  sessionId: string;
  url: string;
  expiresAt?: string;
};

export type ApiBookingInput = {
  equipmentId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  contactNumber: string;
  deliveryAddress: string;
  notes?: string;
};

export type ApiEquipmentInput = {
  name: string;
  description: string;
  category: string;
  location: string;
  price: number;
  rentalType: string;
  availableQuantity: number;
  condition?: string;
  brand?: string;
  model?: string;
  image: string;
  terms?: string;
};

export const api = {
  async listEquipment(
    params: {
      search?: string;
      category?: string;
      location?: string;
      rentalType?: string;
      minPrice?: number;
      maxPrice?: number;
      availability?: boolean;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return request<ApiEquipment[]>(
      `/api/equipment${queryString({ ...params, limit: params.limit ?? 50 })}`,
    );
  },

  async getEquipment(id: string) {
    return request<ApiEquipment>(`/api/equipment/${encodeURIComponent(id)}`, {
      auth: true,
    });
  },

  async listMyEquipment() {
    return request<ApiEquipment[]>("/api/equipment/my-equipment", {
      auth: true,
    });
  },

  async createEquipment(input: ApiEquipmentInput) {
    return request<ApiEquipment>("/api/equipment", {
      method: "POST",
      auth: true,
      body: input,
    });
  },

  async updateEquipment(id: string, input: Partial<ApiEquipmentInput>) {
    return request<ApiEquipment>(`/api/equipment/${encodeURIComponent(id)}`, {
      method: "PATCH",
      auth: true,
      body: input,
    });
  },

  async deleteEquipment(id: string) {
    return request<ApiEquipment>(`/api/equipment/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  async listAdminEquipment() {
    return request<ApiEquipment[]>("/api/admin/equipment?limit=50", {
      auth: true,
    });
  },

  async updateAdminEquipment(id: string, input: Partial<ApiEquipmentInput>) {
    return request<ApiEquipment>(
      `/api/admin/equipment/${encodeURIComponent(id)}`,
      { method: "PATCH", auth: true, body: input },
    );
  },

  async deleteAdminEquipment(id: string) {
    return request<ApiEquipment>(
      `/api/admin/equipment/${encodeURIComponent(id)}`,
      { method: "DELETE", auth: true },
    );
  },

  async setEquipmentStatus(id: string, status: "approved" | "rejected") {
    return request<ApiEquipment>(
      `/api/admin/equipment/${encodeURIComponent(id)}/status`,
      { method: "PATCH", auth: true, body: { status } },
    );
  },

  async listFavorites() {
    return request<ApiFavorite[]>("/api/favorites?limit=50", { auth: true });
  },

  async addFavorite(equipmentId: string) {
    return request<{ equipmentId: string; createdAt?: string }>(
      `/api/favorites/${encodeURIComponent(equipmentId)}`,
      { method: "POST", auth: true },
    );
  },

  async removeFavorite(equipmentId: string) {
    return request<{ equipmentId: string }>(
      `/api/favorites/${encodeURIComponent(equipmentId)}`,
      { method: "DELETE", auth: true },
    );
  },

  async listMyBookings() {
    return request<ApiBooking[]>("/api/bookings/my-bookings?limit=50", {
      auth: true,
    });
  },

  async listOwnerBookings() {
    return request<ApiBooking[]>("/api/bookings/owner/requests?limit=50", {
      auth: true,
    });
  },

  async listAdminBookings() {
    return request<ApiBooking[]>("/api/admin/bookings?limit=50", {
      auth: true,
    });
  },

  async createBooking(input: ApiBookingInput, idempotencyKey?: string) {
    return request<ApiBooking>("/api/bookings", {
      method: "POST",
      auth: true,
      body: input,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });
  },

  async setBookingStatus(
    id: string,
    status: "confirmed" | "rejected" | "active" | "completed",
    reason?: string,
  ) {
    return request<ApiBooking>(
      `/api/bookings/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        auth: true,
        body: reason ? { status, reason } : { status },
      },
    );
  },

  async cancelBooking(id: string, reason?: string) {
    return request<ApiBooking>(
      `/api/bookings/${encodeURIComponent(id)}/cancel`,
      {
        method: "PATCH",
        auth: true,
        body: reason ? { reason } : {},
      },
    );
  },

  async checkAvailability(
    equipmentId: string,
    startDate: string,
    endDate: string,
    quantity: number,
    signal?: AbortSignal,
  ) {
    return request<ApiAvailability>(
      `/api/equipment/${encodeURIComponent(equipmentId)}/availability${queryString({
        startDate,
        endDate,
        quantity,
      })}`,
      { signal },
    );
  },

  async getPaymentStatus(bookingId: string) {
    return request<ApiPaymentStatus>(
      `/api/payments/${encodeURIComponent(bookingId)}/status`,
      { auth: true },
    );
  },

  async createCheckoutSession(bookingId: string) {
    return request<ApiCheckoutSession>("/api/payments/create-checkout-session", {
      method: "POST",
      auth: true,
      body: { bookingId },
    });
  },

  async completeDemoPayment(bookingId: string) {
    return request<ApiPaymentStatus>("/api/payments/demo-complete", {
      method: "POST",
      auth: true,
      body: { bookingId },
    });
  },

  async listAdminUsers() {
    return request<ApiUser[]>("/api/admin/users?limit=50", { auth: true });
  },

  async setUserRole(id: string, role: "customer" | "owner" | "admin") {
    return request<ApiUser>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      auth: true,
      body: { role },
    });
  },

  async setUserStatus(id: string, isActive: boolean) {
    return request<ApiUser>(
      `/api/admin/users/${encodeURIComponent(id)}/status`,
      { method: "PATCH", auth: true, body: { isActive } },
    );
  },
};
