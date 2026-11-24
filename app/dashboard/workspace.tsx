"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { categories, rentalTypes, type Category, type RentalType } from "@/app/(site)/equipment/equipment-data";
import {
  usePlatform,
  type DashboardPageKey,
  type BookingStatus,
  type PlatformEquipment,
  type PlatformRole,
} from "@/app/lib/platform-context";
import { api, getErrorMessage, type ApiPagination } from "@/app/lib/api";
import styles from "./workspace.module.css";

const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;
const dateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
};
const roleNames: Record<PlatformRole, string> = {
  customer: "Customer",
  owner: "Owner",
  admin: "Admin",
};

function dashboardSectionHref(role: PlatformRole, section: string) {
  if (role === "admin") {
    if (section === "users") return "/dashboard/all-users";
    if (section === "equipment") return "/dashboard/all-equipment";
    if (section === "rentals") return "/dashboard/all-rentals";
  }
  if (role === "owner") {
    if (section === "overview") return "/dashboard/owner";
    if (section === "add-equipment") return "/dashboard/add-equipment";
    if (section === "equipment") return "/dashboard/my-equipment";
    if (section === "rentals") return "/dashboard/my-equipment-rental";
    if (section === "profile") return "/dashboard/profile";
  }
  if (role === "customer") {
    if (section === "rentals") return "/dashboard/my-rentals";
    if (section === "favorites") return "/dashboard/favorites";
    if (section === "profile") return "/dashboard/profile";
  }
  if (section === "profile") return "/dashboard/profile";
  return section === "overview" ? `/dashboard/${role}` : `/dashboard/${role}/${section}`;
}

const navigation: Record<PlatformRole, { label: string; section: string; icon: string }[]> = {
  customer: [
    { label: "Overview", section: "overview", icon: "◫" },
    { label: "My rentals", section: "rentals", icon: "▤" },
    { label: "Favorites", section: "favorites", icon: "♡" },
    { label: "My profile", section: "profile", icon: "◉" },
  ],
  owner: [
    { label: "Overview", section: "overview", icon: "◫" },
    { label: "Add equipment", section: "add-equipment", icon: "+" },
    { label: "My equipment", section: "equipment", icon: "▣" },
    { label: "My Equipment Rental", section: "rentals", icon: "▤" },
    { label: "My profile", section: "profile", icon: "◉" },
  ],
  admin: [
    { label: "Overview", section: "overview", icon: "◫" },
    { label: "All users", section: "users", icon: "♧" },
    { label: "All equipment", section: "equipment", icon: "▣" },
    { label: "All rentals", section: "rentals", icon: "▤" },
    { label: "My profile", section: "profile", icon: "◉" },
  ],
};

function StatusPill({ children }: { children: string }) {
  const key = children.toLowerCase().replace(/\s+/g, "-");
  return <span className={`${styles.statusPill} ${styles[`status_${key}`] ?? ""}`}>{children}</span>;
}

function MetricCard({ label, value, detail, icon, tone = "green" }: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: "green" | "gold" | "blue" | "purple";
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`metric_${tone}`]}`}>
      <span className={styles.metricIcon} aria-hidden="true">{icon}</span>
      <span className={styles.metricLabel}>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden="true">⌕</span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

function ListPager({
  pagination,
  disabled = false,
  onPage,
}: {
  pagination?: ApiPagination;
  disabled?: boolean;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages < 2) return null;
  return (
    <nav className={styles.listPagination} aria-label="List pages">
      <button
        className={styles.tableAction}
        type="button"
        disabled={disabled || !pagination.hasPrevPage}
        onClick={() => onPage(pagination.currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} records
      </span>
      <button
        className={styles.tableAction}
        type="button"
        disabled={disabled || !pagination.hasNextPage}
        onClick={() => onPage(pagination.currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}

function EquipmentEdit({ item, onSave }: { item: PlatformEquipment; onSave: (updates: Partial<PlatformEquipment>) => void }) {
  return (
    <details className={styles.editDetails}>
      <summary className={styles.tableAction}>Update</summary>
      <form
        className={styles.inlineEdit}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const category = String(data.get("category")) as Category;
          const categoryName = categories.find((option) => option.value === category)?.label ?? category;
          onSave({
            name: String(data.get("name")),
            description: String(data.get("description")),
            category,
            categoryLabel: `${categoryName} Equipment`,
            price: Number(data.get("price")),
            quantity: Number(data.get("quantity")),
            location: String(data.get("location")),
            rentals: [String(data.get("rentalType")) as RentalType],
            condition: String(data.get("condition")),
            brand: String(data.get("brand")),
            model: String(data.get("model")),
            image: String(data.get("image")),
            terms: String(data.get("terms")),
          });
        }}
      >
        <label>Equipment name <input name="name" maxLength={90} defaultValue={item.name} required /></label>
        <label>Category
          <select name="category" defaultValue={item.category}>
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </label>
        <label>Rental price ({item.rentals[0]?.toLowerCase() ?? "period"}) <input name="price" type="number" min="1" defaultValue={item.price} required /></label>
        <label>Available quantity <input name="quantity" type="number" min="0" defaultValue={item.quantity} required /></label>
        <label>Rental type
          <select name="rentalType" defaultValue={item.rentals[0] ?? "Daily"}>
            {rentalTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label>Location <input name="location" maxLength={160} defaultValue={item.location} required /></label>
        <label>Condition <input name="condition" maxLength={120} defaultValue={item.condition} required /></label>
        <label>Brand <input name="brand" maxLength={100} defaultValue={item.brand} required /></label>
        <label>Model <input name="model" maxLength={100} defaultValue={item.model} required /></label>
        <label>Image URL <input name="image" type="url" maxLength={2048} defaultValue={item.image} required /></label>
        <label>Description <textarea name="description" maxLength={1000} defaultValue={item.description} required /></label>
        <label>Rental terms <textarea name="terms" maxLength={2000} defaultValue={item.terms} required /></label>
        <button className={styles.smallPrimary} type="submit">Save changes</button>
      </form>
    </details>
  );
}

export default function DashboardWorkspace({
  role,
  section,
}: {
  role: PlatformRole;
  section: string[];
}) {
  const router = useRouter();
  const {
    ready,
    user,
    users,
    listings,
    favoriteListings,
    bookings,
    overview,
    analytics,
    dashboardPages,
    loadDashboardPage,
    loadError,
    refresh,
    toggleFavorite,
    addEquipment,
    updateEquipment,
    removeEquipment,
    setListingStatus,
    setUserRole,
    setUserStatus,
    setBookingStatus,
    cancelBooking,
    signOut,
    notify,
  } = usePlatform();
  const activeSection = section[0] ?? "overview";
  const [menuOpen, setMenuOpen] = useState(false);
  const roleBase = `/dashboard/${role}`;
  const navItems = navigation[role];
  const activeLabel = navItems.find((item) => item.section === activeSection)?.label ?? "Overview";
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?callbackURL=${encodeURIComponent(`${roleBase}${section.length ? `/${section.join("/")}` : ""}`)}`);
    }
  }, [ready, roleBase, router, section, user]);

  const ownedEquipment = listings.filter((item) => item.ownerId === user?.id);
  const customerBookings = role === "customer" ? bookings : [];
  const ownerBookings = role === "owner" ? bookings : [];
  const total = (key: string) => Number(overview[key] ?? 0);

  if (!ready || !user) {
    return <main className={styles.entryPage}><p>Loading your workspace…</p></main>;
  }

  if (user.role !== role) {
    return (
      <main className={styles.entryPage}>
        <section className={styles.accessCard}>
          <span className={styles.workspaceEyebrow}>ROLE PREVIEW</span>
          <h1>This is the {roleNames[role].toLowerCase()} workspace</h1>
          <p>You are currently signed in as a {roleNames[user.role].toLowerCase()}. Open the workspace assigned to your account.</p>
          <Link className={styles.primaryAction} href={`/dashboard/${user.role}`}>Open my workspace <span aria-hidden="true">→</span></Link>
        </section>
      </main>
    );
  }

  const workspaceUser = user;

  async function changeListPage(kind: DashboardPageKey, page: number) {
    if (pageLoading) return;
    setPageLoading(true);
    try {
      await loadDashboardPage(kind, page);
    } catch (error) {
      notify(getErrorMessage(error, "This page could not be loaded."), "error");
    } finally {
      setPageLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      notify("You have been signed out.", "success");
      router.push("/");
    } catch {
      notify("We couldn’t sign you out. Please try again.", "error");
    }
  }

  function renderProfileShortcut() {
    return (
      <div className={styles.profileShortcut}>
        <div className={styles.avatar}>{workspaceUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
         <div><strong>{workspaceUser.name}</strong><span>{roleNames[role]} · VaraX workspace</span></div>
        <Link className={styles.profileButton} href="/dashboard/profile">Edit profile</Link>
      </div>
    );
  }

  function renderOverview() {
    const roleBookings = role === "customer" ? customerBookings : role === "owner" ? ownerBookings : bookings;
    const metrics = role === "customer"
      ? [
          { label: "Total rentals", value: String(total("totalBookings")), detail: "Your booking history", icon: "▤", tone: "green" as const },
          { label: "Saved favorites", value: String(total("totalFavorites")), detail: "Equipment on your shortlist", icon: "♡", tone: "gold" as const },
          { label: "Rental spend", value: money(total("totalSpent")), detail: "Paid rental total", icon: "৳", tone: "blue" as const },
        ]
      : role === "owner"
        ? [
            { label: "Listed equipment", value: String(total("totalEquipment")), detail: "Your active equipment listings", icon: "▣", tone: "green" as const },
            { label: "Completed rentals", value: String(total("completedRentals")), detail: `${total("totalRentalRequests")} rental requests`, icon: "▤", tone: "gold" as const },
            { label: "Total earnings", value: money(total("totalEarnings")), detail: "Gross paid earnings (BDT)", icon: "৳", tone: "blue" as const },
          ]
        : [
            { label: "Total users", value: String(total("totalUsers")), detail: `${total("totalCustomers")} customers · ${total("totalOwners")} owners`, icon: "♧", tone: "green" as const },
            { label: "Total equipment", value: String(total("totalEquipment")), detail: `${total("pendingEquipment")} awaiting review`, icon: "▣", tone: "gold" as const },
            { label: "Platform revenue", value: money(total("totalRevenue")), detail: `${total("totalPaidBookings")} paid bookings`, icon: "৳", tone: "blue" as const },
          ];
    const recentBookings = roleBookings.slice(0, 4);

    return (
      <>
        <div className={styles.metricGrid}>
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
        {role === "owner" ? (
          <section className={styles.dataCard}>
            <div className={styles.cardHeading}>
              <div>
                <h2>Owner workspace</h2>
                <p>Manage your listings, rental requests, and owner profile.</p>
              </div>
            </div>
            <nav className={styles.ownerQuickLinks} aria-label="Owner dashboard shortcuts">
              <Link className={styles.ownerQuickLink} href="/dashboard/add-equipment">
                <span aria-hidden="true">＋</span>
                <span>Add Equipment</span>
              </Link>
              <Link className={styles.ownerQuickLink} href="/dashboard/my-equipment">
                <span aria-hidden="true">▣</span>
                <span>My Equipment</span>
              </Link>
              <Link className={styles.ownerQuickLink} href="/dashboard/my-equipment-rental">
                <span aria-hidden="true">▤</span>
                <span>My Equipment Rental</span>
              </Link>
              <Link className={styles.ownerQuickLink} href="/dashboard/profile">
                <span aria-hidden="true">◉</span>
                <span>My Profile</span>
              </Link>
            </nav>
          </section>
        ) : null}
        {loadError ? (
          <div className={styles.emptyState} role="alert">
            <p>{loadError}</p>
            <button className={styles.smallPrimary} type="button" onClick={() => void refresh()}>Retry loading</button>
          </div>
        ) : null}
        {role === "admin" ? (
          <section className={styles.analyticsCard}>
            <div className={styles.cardHeading}><div><h2>Platform overview</h2><p>Monthly booking activity from the platform database</p></div><span className={styles.liveBadge}>LIVE DATA</span></div>
            <div className={styles.analyticsTotals}>
              <div><span>All bookings</span><strong>{total("totalBookings")}</strong></div>
              <div><span>Pending approvals</span><strong>{total("pendingEquipment")}</strong></div>
              <div><span>Completed rentals</span><strong>{total("completedRentals")}</strong></div>
              <div><span>Total paid revenue</span><strong>{money(total("totalRevenue"))}</strong></div>
            </div>
            <MonthlyBars
              data={Array.isArray(analytics.bookingsByMonth)
                ? (analytics.bookingsByMonth as Array<{ month: string; bookingCount: number }>).map((row) => ({ month: row.month, value: row.bookingCount }))
                : []}
            />
          </section>
        ) : role === "owner" ? (
          <section className={styles.analyticsCard}>
            <div className={styles.cardHeading}><div><h2>Earnings overview</h2><p>Monthly paid earnings for your equipment</p></div><span className={styles.liveBadge}>LIVE DATA</span></div>
            <MonthlyBars
              revenue
              data={Array.isArray(analytics.monthlyRevenue)
                ? (analytics.monthlyRevenue as Array<{ month: string; revenue: number }>).map((row) => ({ month: row.month, value: row.revenue }))
                : []}
            />
          </section>
        ) : null}
        <section className={styles.dataCard}>
          <div className={styles.cardHeading}>
            <div><h2>{role === "admin" ? "Recent platform rentals" : role === "owner" ? "Recent equipment rentals" : "Recent rentals"}</h2><p>Latest rental activity from your VaraX account.</p></div>
            <Link className={styles.tableAction} href={dashboardSectionHref(role, "rentals")}>View all <span aria-hidden="true">→</span></Link>
          </div>
          <BookingTable
            rows={recentBookings}
            showCustomer={role !== "customer"}
            role={role}
            onStatusChange={(id, bookingStatus, reason) => void setBookingStatus(id, bookingStatus, reason).catch((error) => notify(getErrorMessage(error), "error"))}
            onCancel={(id) => void cancelBooking(id).catch((error) => notify(getErrorMessage(error), "error"))}
          />
        </section>
        {renderProfileShortcut()}
      </>
    );
  }

  function renderRentals() {
    const rows = role === "customer" ? customerBookings : role === "owner" ? ownerBookings : bookings;
    return (
      <section className={styles.dataCard}>
        <div className={styles.cardHeading}><div><h2>{role === "customer" ? "My rentals" : role === "owner" ? "Equipment rentals" : "All rentals"}</h2><p>Rental dates, amounts, payment and booking status.</p></div></div>
        {role === "owner" ? (
          <OwnerRentalTable
            rows={rows}
            onStatusChange={(id, bookingStatus, reason) => void setBookingStatus(id, bookingStatus, reason).catch((error) => notify(getErrorMessage(error), "error"))}
          />
        ) : (
          <BookingTable
            rows={rows}
            showCustomer={false}
            role={role}
            onStatusChange={(id, bookingStatus, reason) => void setBookingStatus(id, bookingStatus, reason).catch((error) => notify(getErrorMessage(error), "error"))}
            onCancel={(id) => void cancelBooking(id).catch((error) => notify(getErrorMessage(error), "error"))}
          />
        )}
        <ListPager
          pagination={dashboardPages.bookings}
          disabled={pageLoading}
          onPage={(page) => void changeListPage("bookings", page)}
        />
      </section>
    );
  }

  function renderFavorites() {
    const savedEquipment = favoriteListings;
    return (
      <section className={styles.dataCard}>
        <div className={styles.cardHeading}><div><h2>My favorites</h2><p>Equipment you have saved to compare and book later.</p></div></div>
        {savedEquipment.length ? (
          <>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
              <thead><tr><th>Equipment</th><th>Category</th><th>Rental price</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>{savedEquipment.map((item) => (
                <tr key={item.id}>
                  <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={item.image} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{item.name}</strong><small>{item.location}</small></span></div></td>
                  <td>{item.categoryLabel}</td>
                  <td>{money(item.price)} / {item.rentals[0]?.toLowerCase() ?? "rental period"}</td>
                  <td><StatusPill>{item.available ? "Available" : "Unavailable"}</StatusPill></td>
                  <td><div className={styles.actionStack}><Link className={styles.tableAction} href={`/equipment/${item.id}`}>View details</Link><button className={styles.tableActionDanger} type="button" onClick={() => { void toggleFavorite(item.id).then(() => notify("Removed from favorites.")).catch((error) => notify(getErrorMessage(error), "error")); }}>Remove</button></div></td>
                </tr>
              ))}</tbody>
              </table>
            </div>
            <ListPager
              pagination={dashboardPages.favorites}
              disabled={pageLoading}
              onPage={(page) => void changeListPage("favorites", page)}
            />
          </>
        ) : (
          <EmptyState title="No favorites yet" detail="Save equipment from the catalog to keep it here." action={<Link className={styles.smallPrimary} href="/equipment">Browse equipment</Link>} />
        )}
      </section>
    );
  }

  function renderEquipmentTable(items: PlatformEquipment[], admin = false) {
    if (!items.length) {
      return <EmptyState title="No equipment found" detail={admin ? "New owner submissions will appear here for review." : "Add your first equipment listing to get started."} action={!admin ? <Link className={styles.smallPrimary} href={dashboardSectionHref(role, "add-equipment")}>Add equipment</Link> : undefined} />;
    }
    return (
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {admin ? <th>Owner information</th> : null}
              <th>Equipment name</th>
              <th>Category</th>
              <th>Rental price</th>
              <th>Available quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {admin ? (
                  <td>
                    <strong>{item.ownerName}</strong>
                    <small className={styles.dateSubline}>{item.ownerEmail || "Owner email unavailable"}</small>
                  </td>
                ) : null}
                <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={item.image} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{item.name}</strong><small>{item.location}</small></span></div></td>
                <td>{item.categoryLabel}</td>
                <td>{money(item.price)} / {item.rentals[0]?.toLowerCase() ?? "rental period"}</td>
                <td>{item.quantity}</td>
                <td><StatusPill>{item.status}</StatusPill></td>
                <td>
                  <div className={styles.actionStack}>
                    {admin ? (
                      <>
                        {item.status !== "Approved" ? <button className={styles.tableAction} type="button" onClick={() => { void setListingStatus(item.id, "Approved").then(() => notify(`${item.name} approved.`)).catch((error) => notify(getErrorMessage(error), "error")); }}>Approve</button> : null}
                        {item.status !== "Rejected" ? <button className={styles.tableActionDanger} type="button" onClick={() => { void setListingStatus(item.id, "Rejected").then(() => notify(`${item.name} rejected.`, "info")).catch((error) => notify(getErrorMessage(error), "error")); }}>Reject</button> : null}
                      </>
                    ) : null}
                    <EquipmentEdit item={item} onSave={(updates) => { void updateEquipment(item.id, updates).then(() => notify("Equipment details updated.")).catch((error) => notify(getErrorMessage(error), "error")); }} />
                    <Link className={styles.tableAction} href={`/equipment/${item.id}`}>View details</Link>
                    <button className={styles.tableActionDanger} type="button" onClick={() => {
                      if (window.confirm(`Remove ${item.name} from your listings?`)) {
                        void removeEquipment(item.id).then(() => notify("Equipment listing removed.", "info")).catch((error) => notify(getErrorMessage(error), "error"));
                      }
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderUsers() {
    return (
      <section className={styles.dataCard}>
        <div className={styles.cardHeading}><div><h2>All users</h2><p>Manage account roles and access.</p></div><span className={styles.liveBadge}>LIVE DATA</span></div>
        {loadError ? <p className={styles.formError} role="alert">{loadError}</p> : null}
        {users.length ? <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registration Date</th><th>Manage Users</th></tr></thead>
            <tbody>{users.map((member) => (
              <tr key={member.id}>
                <td><strong>{member.name}</strong></td><td>{member.email}</td>
                <td>
                  <select
                    aria-label={`Change role for ${member.name}`}
                    value={member.role}
                    disabled={member.id === user?.id}
                    onChange={(event) => {
                      const nextRole = event.target.value as PlatformRole;
                      void setUserRole(member.id, nextRole)
                        .then(() => notify(`${member.name}'s role was updated.`))
                        .catch((error) => notify(getErrorMessage(error), "error"));
                    }}
                  >
                    {(["customer", "owner", "admin"] as PlatformRole[]).map((nextRole) => (
                      <option key={nextRole} value={nextRole}>{roleNames[nextRole]}</option>
                    ))}
                  </select>
                </td>
                <td>{dateLabel(member.createdAt)}</td>
                <td>
                  <button
                    className={member.isActive === false ? styles.tableAction : styles.tableActionDanger}
                    type="button"
                    disabled={member.id === user?.id}
                    onClick={() => {
                      const nextActive = member.isActive === false;
                      if (!nextActive && !window.confirm(`Deactivate ${member.name}'s account?`)) return;
                      void setUserStatus(member.id, nextActive)
                        .then(() => notify(`Account ${nextActive ? "activated" : "deactivated"}.`))
                        .catch((error) => notify(getErrorMessage(error), "error"));
                    }}
                  >
                    {member.isActive === false ? "Reactivate" : "Deactivate"}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div> : loadError ? null : <EmptyState title="No users found" detail="Registered VaraX accounts will appear here." />}
        <ListPager
          pagination={dashboardPages.users}
          disabled={pageLoading}
          onPage={(page) => void changeListPage("users", page)}
        />
      </section>
    );
  }

  function renderAddEquipment() {
    return (
      <AddEquipmentForm
        onCreate={async (data) => {
          const listing = await addEquipment(data);
          notify(`${listing.name} was submitted for admin review.`, "success");
          router.push(dashboardSectionHref("owner", "equipment"));
        }}
      />
    );
  }

  function renderContent() {
    if (!navItems.some((item) => item.section === activeSection)) {
      return <EmptyState title="This dashboard page is not available" detail="Choose a section from the dashboard menu." action={<Link className={styles.smallPrimary} href={roleBase}>Dashboard overview</Link>} />;
    }
    if (activeSection === "overview") return renderOverview();
    if (activeSection === "rentals") return renderRentals();
    if (activeSection === "favorites") return renderFavorites();
    if (activeSection === "users") return renderUsers();
    if (activeSection === "add-equipment") return renderAddEquipment();
    if (activeSection === "equipment") {
    const items = role === "admin" ? listings : ownedEquipment;
      return (
        <section className={styles.dataCard}>
          <div className={styles.cardHeading}>
            <div><h2>{role === "admin" ? "All equipment" : "My equipment"}</h2><p>{role === "admin" ? "Approve, reject, edit, or remove owner submissions." : "Update your listing details and track approval status."}</p></div>
            {role === "owner" ? <Link className={styles.smallPrimary} href={dashboardSectionHref(role, "add-equipment")}>+ Add equipment</Link> : null}
            {role === "admin" ? <button className={styles.tableAction} type="button" onClick={() => void refresh()}>Refresh listings</button> : null}
          </div>
          {renderEquipmentTable(items, role === "admin")}
          <ListPager
            pagination={dashboardPages.equipment}
            disabled={pageLoading}
            onPage={(page) => void changeListPage("equipment", page)}
          />
        </section>
      );
    }
    if (activeSection === "profile") {
      return (
        <section className={styles.dataCard}>
          <div className={styles.cardHeading}><div><h2>Profile settings</h2><p>Update your name, contact details, and address.</p></div></div>
          {renderProfileShortcut()}
          <Link className={styles.smallPrimary} href="/dashboard/profile">Edit profile details</Link>
        </section>
      );
    }
    return renderOverview();
  }

  return (
    <main className={styles.workspacePage}>
      <div className={styles.workspaceShell}>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
          <Link className={styles.brand} href="/" aria-label="VaraX home">
            <span className={styles.brandMark}>V</span><span>Vara<span>X</span></span>
          </Link>
          <div className={styles.sidebarLabel}>WORKSPACE</div>
          <nav className={styles.navList} aria-label={`${roleNames[role]} dashboard`}>
            {navItems.map((item) => {
              const href = dashboardSectionHref(role, item.section);
              return (
                <Link className={`${styles.navItem} ${activeSection === item.section ? styles.navActive : ""}`} href={href} key={item.section} aria-current={activeSection === item.section ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                  {item.section === "equipment" && role === "admin" && listings.some((listing) => listing.status === "Pending") ? <i>{listings.filter((listing) => listing.status === "Pending").length}</i> : null}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarBottom}>
            <div className={styles.workspaceNote}><strong>Live workspace</strong><span>Your account data syncs with VaraX.</span></div>
            <Link className={styles.viewSite} href="/">← View marketplace</Link>
            <button className={styles.logoutButton} type="button" onClick={handleLogout}>↪ <span>Log out</span></button>
            <div className={styles.sidebarUser}>
              <span className={styles.avatar}>{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <span><strong>{user.name}</strong><small>{roleNames[role]}</small></span>
            </div>
          </div>
        </aside>
        <div className={styles.workspaceMain}>
          <header className={styles.workspaceTopbar}>
            <button className={styles.menuToggle} type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>☰ <span>Menu</span></button>
            <div><p className={styles.breadcrumb}>Workspace <span>/</span> {activeLabel}</p><h1>{activeLabel}</h1><p className={styles.welcomeCopy}>Welcome back, {user.name.split(" ")[0]}.</p></div>
            <Link className={styles.topProfile} href="/dashboard/profile">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Link>
          </header>
          {renderContent()}
          <footer className={styles.workspaceFooter}><span>© 2026 VaraX</span><span>Connected to your VaraX account</span></footer>
        </div>
      </div>
    </main>
  );
}

function BookingTable({
  rows,
  showCustomer,
  role,
  onStatusChange,
  onCancel,
}: {
  rows: ReturnType<typeof usePlatform>["bookings"];
  showCustomer: boolean;
  role: PlatformRole;
  onStatusChange: (id: string, status: Exclude<BookingStatus, "Pending" | "Cancelled">, reason?: string) => void;
  onCancel: (id: string) => void;
}) {
  if (!rows.length) {
    return role === "admin"
      ? <EmptyState title="No rentals found" detail="Platform bookings will appear here as customers reserve equipment." />
      : <EmptyState title="No rentals yet" detail="Bookings will appear here after you reserve equipment." action={<Link className={styles.smallPrimary} href="/equipment">Explore equipment</Link>} />;
  }
  if (role === "admin") {
    return (
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Customer Information</th>
              <th>Owner Information</th>
              <th>Equipment Name</th>
              <th>Rental Duration</th>
              <th>Booking Amount</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.customerName}</strong>
                  <small className={styles.dateSubline}>
                    {booking.customerEmail || "Email unavailable"}
                  </small>
                </td>
                <td>
                  <strong>{booking.ownerName}</strong>
                  <small className={styles.dateSubline}>
                    {booking.ownerEmail || "Email unavailable"}
                  </small>
                </td>
                <td>{booking.equipmentName}</td>
                <td>
                  <strong>{booking.startDate} – {booking.endDate}</strong>
                  {booking.rentalDuration ? (
                    <small className={styles.dateSubline}>
                      {booking.rentalDuration} {booking.rentalType?.toLowerCase() ?? "period"}
                      {booking.rentalDuration === 1 ? "" : "s"}
                    </small>
                  ) : null}
                </td>
                <td><strong>{money(booking.totalAmount)}</strong></td>
                <td><StatusPill>{booking.paymentStatus}</StatusPill></td>
                <td><StatusPill>{booking.bookingStatus}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (role === "customer") {
    return (
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Rental Start Date</th>
              <th>Rental End Date</th>
              <th>Booking Date</th>
              <th>Total Amount</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id}>
                <td><Link href={`/equipment/${booking.equipmentId}`}>{booking.equipmentName}</Link></td>
                <td>{booking.startDate}</td>
                <td>{booking.endDate}</td>
                <td>{booking.bookingDate}</td>
                <td><strong>{money(booking.totalAmount)}</strong></td>
                <td><StatusPill>{booking.paymentStatus}</StatusPill></td>
                <td>
                  <div className={styles.actionStack}>
                    <StatusPill>{booking.bookingStatus}</StatusPill>
                    {(booking.bookingStatus === "Pending" ||
                      (booking.bookingStatus === "Confirmed" &&
                        booking.startDate > new Date().toISOString().slice(0, 10))) ? (
                      <button
                        className={styles.tableActionDanger}
                        type="button"
                        onClick={() => {
                          if (window.confirm("Cancel this rental booking?")) onCancel(booking.id);
                        }}
                      >
                        Cancel booking
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
        <thead><tr><th>Equipment & renter</th><th>Rental dates</th><th>Booking date</th><th>Amount</th><th>Payment</th><th>Booking</th></tr></thead>
        <tbody>{rows.map((booking) => (
          <tr key={booking.id}>
            <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={booking.equipmentImage} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{booking.equipmentName}</strong><small>{showCustomer ? booking.customerName : booking.id}</small></span></div></td>
            <td>{booking.startDate}<small className={styles.dateSubline}>to {booking.endDate}</small></td>
            <td>{booking.bookingDate}</td>
            <td><strong>{money(booking.totalAmount)}</strong><small className={styles.dateSubline}>{booking.quantity} unit{booking.quantity === 1 ? "" : "s"}</small></td>
            <td><StatusPill>{booking.paymentStatus}</StatusPill></td>
            <td>
              {role === "owner" ? (
                <OwnerBookingStatus booking={booking} onStatusChange={onStatusChange} />
              ) : (
                <StatusPill>{booking.bookingStatus}</StatusPill>
              )}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function OwnerRentalTable({
  rows,
  onStatusChange,
}: {
  rows: ReturnType<typeof usePlatform>["bookings"];
  onStatusChange: (id: string, status: Exclude<BookingStatus, "Pending" | "Cancelled">, reason?: string) => void;
}) {
  if (!rows.length) {
    return <EmptyState title="No equipment rentals yet" detail="Bookings for your equipment will appear here." />;
  }

  return (
    <div className={styles.tableScroll}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Customer information</th>
            <th>Equipment information</th>
            <th>Rental duration</th>
            <th>Required quantity</th>
            <th>Booking amount</th>
            <th>Payment status</th>
            <th>Booking status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((booking) => {
            const duration = booking.rentalDuration
              ? `${booking.rentalDuration} ${booking.rentalType ?? "billing"} period${booking.rentalDuration === 1 ? "" : "s"}`
              : `${booking.startDate} – ${booking.endDate}`;
            return (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.customerName}</strong>
                  <small className={styles.dateSubline}>{booking.contact || booking.customerEmail || "Customer"}</small>
                </td>
                <td>
                  <div className={styles.equipmentCell}>
                    <div className={styles.tableImage}>
                      <Image src={booking.equipmentImage} alt="" fill sizes="3rem" unoptimized />
                    </div>
                    <span>
                      <strong>{booking.equipmentName}</strong>
                      <small>{booking.equipmentCategory || booking.equipmentLocation || "Equipment"}</small>
                    </span>
                  </div>
                </td>
                <td>
                  {duration}
                  <small className={styles.dateSubline}>{booking.startDate} – {booking.endDate}</small>
                </td>
                <td>{booking.quantity}</td>
                <td><strong>{money(booking.totalAmount)}</strong></td>
                <td><StatusPill>{booking.paymentStatus}</StatusPill></td>
                <td><OwnerBookingStatus booking={booking} onStatusChange={onStatusChange} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OwnerBookingStatus({
  booking,
  onStatusChange,
}: {
  booking: ReturnType<typeof usePlatform>["bookings"][number];
  onStatusChange: (id: string, status: Exclude<BookingStatus, "Pending" | "Cancelled">, reason?: string) => void;
}) {
  const current = booking.bookingStatus;
  const options: BookingStatus[] = [current];
  if (current === "Pending") {
    options.push(booking.paymentStatus === "Paid" ? "Confirmed" : "Rejected");
  } else if (current === "Confirmed") {
    options.push("Active");
  } else if (current === "Active") {
    options.push("Completed");
  }

  return (
    <select
      aria-label={`Update booking ${booking.id}`}
      value={current}
      onChange={(event) => {
        const status = event.target.value as BookingStatus;
        if (status === current || status === "Pending" || status === "Cancelled") return;
        const reason = status === "Rejected"
          ? window.prompt("Why are you rejecting this booking?")
          : undefined;
        if (status === "Rejected" && !reason?.trim()) return;
        onStatusChange(
          booking.id,
          status as Exclude<BookingStatus, "Pending" | "Cancelled">,
          reason ?? undefined,
        );
      }}
    >
      {options.map((status) => <option key={status} value={status}>{status}</option>)}
    </select>
  );
}

function MonthlyBars({ data, revenue = false }: { data: Array<{ month: string; value: number }>; revenue?: boolean }) {
  const months = data.slice(-6).map((item) => ({
    label: new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString("en", { month: "short" }),
    value: item.value,
  }));
  const max = Math.max(1, ...months.map((month) => month.value));
  return (
    <div className={styles.chartArea} role="img" aria-label={revenue ? "Monthly paid rental earnings" : "Monthly booking activity"}>
      {months.map((month) => (
        <div className={styles.chartColumn} key={month.label}>
          <span className={styles.chartValue}>{revenue ? money(month.value) : month.value}</span>
          <div className={styles.chartTrack}><span style={{ height: `${Math.max(month.value ? 12 : 4, (month.value / max) * 100)}%` }} /></div>
          <small>{month.label}</small>
        </div>
      ))}
    </div>
  );
}

function AddEquipmentForm({ onCreate }: { onCreate: (input: Parameters<ReturnType<typeof usePlatform>["addEquipment"]>[0]) => Promise<unknown> }) {
  const { user } = usePlatform();
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (imageError || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      let image = String(data.get("image") ?? "").trim();
      if (imageFile) image = await api.uploadImage(imageFile);
      if (!/^https?:\/\//i.test(image)) {
        throw new Error("Provide a hosted image URL or upload an image.");
      }
      const category = String(data.get("category")) as Category;
      const categoryLabel = categories.find((item) => item.value === category)?.label ?? category;
      await onCreate({
        name: String(data.get("name")),
        description: String(data.get("description")),
        category,
        categoryLabel: `${categoryLabel} Equipment`,
        location: String(data.get("location")),
        price: Number(data.get("price")),
        rentals: [String(data.get("rentalType")) as RentalType],
        quantity: Number(data.get("quantity")),
        condition: String(data.get("condition")),
        brand: String(data.get("brand")),
        model: String(data.get("model")),
        image,
        terms: String(data.get("terms")),
      });
    } catch (error) {
      setMessage(getErrorMessage(error, "The equipment could not be submitted."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeading}><div><h2>Add equipment</h2><p>Your signed-in owner account is attached automatically; new listings stay pending until review.</p></div><StatusPill>Pending</StatusPill></div>
      <form className={styles.equipmentForm} onSubmit={submit}>
        <div className={`${styles.formWide} ${styles.ownerInfo}`}>
          <div>
            <strong>Owner information</strong>
            <span>{user?.name ?? "Signed-in owner"}</span>
          </div>
          <span>{user?.email ?? "Attached to your account"}</span>
        </div>
        <label>Equipment name<input name="name" placeholder="e.g. Canon EOS R6" required maxLength={90} /></label>
        <label>Category<select name="category" defaultValue="construction">{categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label>Location<input name="location" maxLength={160} placeholder="Area, city" required /></label>
        <label>Rental price (৳)<input name="price" type="number" min="0.01" step="0.01" required placeholder="2500" /></label>
        <label>Available quantity<input name="quantity" type="number" min="1" required defaultValue="1" /></label>
        <label>Equipment condition<input name="condition" maxLength={120} placeholder="Excellent, well maintained" required /></label>
        <label>Brand<input name="brand" maxLength={100} placeholder="Brand" required /></label>
        <label>Model<input name="model" maxLength={100} placeholder="Model or year" required /></label>
        <label>Rental type<select name="rentalType" defaultValue="Daily">{rentalTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label className={styles.formWide}>Equipment image<input name="image" type="url" placeholder="Paste an image URL or upload below" /></label>
        <label className={styles.formWide}>Upload equipment image (PNG, JPEG, WEBP, or GIF; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            setImageError("Choose an image under 5 MB.");
            setImagePreview("");
            setImageFile(null);
            return;
          }
          setImageFile(file);
          const reader = new FileReader();
          reader.onload = () => {
            setImagePreview(typeof reader.result === "string" ? reader.result : "");
            setImageError("");
          };
          reader.onerror = () => setImageError("Could not read that image.");
          reader.readAsDataURL(file);
        }} /></label>
        {imagePreview ? <div className={styles.imagePreview}><Image src={imagePreview} alt="Equipment preview" width={100} height={80} unoptimized /></div> : null}
        {imageError ? <p className={styles.formError} role="alert">{imageError}</p> : null}
        <label className={styles.formWide}>Description<textarea name="description" rows={4} maxLength={1000} required placeholder="Describe the equipment, its condition, and what it is suitable for." /></label>
        <label className={styles.formWide}>Rental terms and conditions<textarea name="terms" rows={3} maxLength={700} required placeholder="Add pickup, deposit, and return conditions." /></label>
        {message ? <p className={styles.formError} role="alert">{message}</p> : null}
        <div className={styles.formFooter}><span>New listings are submitted with <strong>Pending</strong> status.</span><button className={styles.smallPrimary} type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit for review"} <span aria-hidden="true">→</span></button></div>
      </form>
    </section>
  );
}
