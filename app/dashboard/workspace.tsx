"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { categories, rentalTypes, type Category, type RentalType } from "@/app/(site)/equipment/equipment-data";
import {
  useDemoPlatform,
  type BookingStatus,
  type ListingStatus,
  type PlatformEquipment,
  type PlatformRole,
} from "@/app/lib/demo-platform";
import { getErrorMessage } from "@/app/lib/api";
import styles from "./workspace.module.css";

const money = (value: number) => `৳${value.toLocaleString("en-BD")}`;
const todayDateString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const roleNames: Record<PlatformRole, string> = {
  customer: "Customer",
  owner: "Equipment owner",
  admin: "Administrator",
};

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
    { label: "Equipment rentals", section: "rentals", icon: "▤" },
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

function EquipmentEdit({ item, onSave }: { item: PlatformEquipment; onSave: (updates: Partial<PlatformEquipment>) => void }) {
  return (
    <details className={styles.editDetails}>
      <summary className={styles.tableAction}>Update</summary>
      <form
        className={styles.inlineEdit}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            price: Number(data.get("price")),
            quantity: Number(data.get("quantity")),
            location: String(data.get("location")),
            available: Number(data.get("quantity")) > 0,
          });
        }}
      >
        <label>Daily price <input name="price" type="number" min="1" defaultValue={item.price} required /></label>
        <label>Quantity <input name="quantity" type="number" min="0" defaultValue={item.quantity} required /></label>
        <label>Location <input name="location" defaultValue={item.location} required /></label>
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
    favorites,
    bookings,
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
  } = useDemoPlatform();
  const activeSection = section[0] ?? "overview";
  const [menuOpen, setMenuOpen] = useState(false);
  const roleBase = `/dashboard/${role}`;
  const navItems = navigation[role];
  const activeLabel = navItems.find((item) => item.section === activeSection)?.label ?? "Overview";

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?callbackURL=${encodeURIComponent(`${roleBase}${section.length ? `/${section.join("/")}` : ""}`)}`);
    }
  }, [ready, roleBase, router, section, user]);

  const ownedEquipment = useMemo(
    () => listings.filter((item) => item.ownerId === user?.id || item.ownerName === user?.name),
    [listings, user],
  );
  const customerBookings = bookings.filter(
    (booking) => booking.customerEmail === user?.email || booking.customerName === user?.name,
  );
  const ownerBookings = bookings.filter(
    (booking) => booking.ownerId === user?.id || booking.ownerName === user?.name,
  );
  const completedPaidBookings = bookings.filter(
    (booking) => booking.paymentStatus === "Paid" && booking.bookingStatus === "Completed",
  );
  const ownerRevenue = ownerBookings
    .filter((booking) => booking.paymentStatus === "Paid")
    .reduce((sum, booking) => sum + booking.totalAmount, 0);
  const totalRevenue = completedPaidBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

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
        <Link className={styles.profileButton} href="/profile">Edit profile</Link>
      </div>
    );
  }

  function renderOverview() {
    const ownListingCount = role === "owner" ? ownedEquipment.length : listings.length;
    const roleBookings = role === "customer" ? customerBookings : role === "owner" ? ownerBookings : bookings;
    const spend = customerBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const metrics = role === "customer"
      ? [
          { label: "Total rentals", value: String(customerBookings.length), detail: "Your booking history", icon: "▤", tone: "green" as const },
          { label: "Saved favorites", value: String(favorites.length), detail: "Equipment on your shortlist", icon: "♡", tone: "gold" as const },
          { label: "Rental spend", value: money(spend), detail: "Across your demo bookings", icon: "৳", tone: "blue" as const },
        ]
      : role === "owner"
        ? [
            { label: "Listed equipment", value: String(ownListingCount), detail: "Your equipment listings", icon: "▣", tone: "green" as const },
            { label: "Completed rentals", value: String(ownerBookings.filter((booking) => booking.bookingStatus === "Completed").length), detail: `${ownerBookings.length} bookings in total`, icon: "▤", tone: "gold" as const },
            { label: "Total earnings", value: money(ownerRevenue), detail: "From paid demo bookings", icon: "৳", tone: "blue" as const },
          ]
        : [
            { label: "Total users", value: String(users.length), detail: "Registered demo accounts", icon: "♧", tone: "green" as const },
            { label: "Total equipment", value: String(listings.length), detail: `${listings.filter((item) => item.status === "Pending").length} awaiting review`, icon: "▣", tone: "gold" as const },
            { label: "Completed revenue", value: money(totalRevenue), detail: `${completedPaidBookings.length} completed paid rentals`, icon: "৳", tone: "blue" as const },
          ];
    const recentBookings = [...roleBookings].sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)).slice(0, 4);

    return (
      <>
        <div className={styles.metricGrid}>
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
        {role === "admin" ? (
          <section className={styles.analyticsCard}>
            <div className={styles.cardHeading}><div><h2>Platform overview</h2><p>Demo booking activity by month</p></div><span className={styles.liveBadge}>LIVE PREVIEW</span></div>
            <div className={styles.analyticsTotals}>
              <div><span>All bookings</span><strong>{bookings.length}</strong></div>
              <div><span>Pending approvals</span><strong>{listings.filter((item) => item.status === "Pending").length}</strong></div>
              <div><span>Completed rentals</span><strong>{bookings.filter((booking) => booking.bookingStatus === "Completed").length}</strong></div>
              <div><span>Total paid revenue</span><strong>{money(bookings.filter((booking) => booking.paymentStatus === "Paid").reduce((sum, booking) => sum + booking.totalAmount, 0))}</strong></div>
            </div>
            <MonthlyBars bookings={bookings} />
          </section>
        ) : role === "owner" ? (
          <section className={styles.analyticsCard}>
            <div className={styles.cardHeading}><div><h2>Earnings overview</h2><p>Paid rentals for your equipment</p></div><span className={styles.liveBadge}>DEMO DATA</span></div>
            <MonthlyBars bookings={ownerBookings} revenue />
          </section>
        ) : null}
        <section className={styles.dataCard}>
          <div className={styles.cardHeading}>
            <div><h2>{role === "admin" ? "Recent platform rentals" : role === "owner" ? "Recent equipment rentals" : "Recent rentals"}</h2><p>Your latest activity, saved in this browser.</p></div>
            <Link className={styles.tableAction} href={`${roleBase}/rentals`}>View all <span aria-hidden="true">→</span></Link>
          </div>
          <BookingTable
            rows={recentBookings}
            admin={role === "admin"}
            showCustomer={role !== "customer"}
            canManage={role !== "customer"}
            onStatusChange={(id, bookingStatus) => updateBooking(id, { bookingStatus })}
            onPaymentChange={(id, paymentStatus) => updateBooking(id, { paymentStatus })}
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
        <BookingTable
          rows={rows}
          admin={role === "admin"}
          showCustomer={role !== "customer"}
          canManage={role !== "customer"}
          onStatusChange={(id, bookingStatus) => updateBooking(id, { bookingStatus })}
          onPaymentChange={(id, paymentStatus) => updateBooking(id, { paymentStatus })}
        />
      </section>
    );
  }

  function renderFavorites() {
    const savedEquipment = listings.filter((item) => favorites.includes(item.id));
    return (
      <section className={styles.dataCard}>
        <div className={styles.cardHeading}><div><h2>My favorites</h2><p>Equipment you have saved to compare and book later.</p></div></div>
        {savedEquipment.length ? (
          <div className={styles.tableScroll}>
            <table className={styles.dataTable}>
              <thead><tr><th>Equipment</th><th>Category</th><th>Rental price</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>{savedEquipment.map((item) => (
                <tr key={item.id}>
                  <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={item.image} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{item.name}</strong><small>{item.location}</small></span></div></td>
                  <td>{item.categoryLabel}</td>
                  <td>{money(item.price)} / day</td>
                  <td><StatusPill>{item.available ? "Available" : "Unavailable"}</StatusPill></td>
                  <td><div className={styles.actionStack}><Link className={styles.tableAction} href={`/equipment/${item.id}`}>View details</Link><button className={styles.tableActionDanger} type="button" onClick={() => { toggleFavorite(item.id); notify("Removed from favorites."); }}>Remove</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No favorites yet" detail="Save equipment from the catalog to keep it here." action={<Link className={styles.smallPrimary} href="/equipment">Browse equipment</Link>} />
        )}
      </section>
    );
  }

  function renderEquipmentTable(items: PlatformEquipment[], admin = false) {
    if (!items.length) {
      return <EmptyState title="No equipment found" detail={admin ? "New owner submissions will appear here for review." : "Add your first equipment listing to get started."} action={!admin ? <Link className={styles.smallPrimary} href={`${roleBase}/add-equipment`}>Add equipment</Link> : undefined} />;
    }
    return (
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead><tr><th>Equipment</th><th>Category</th><th>Rental price</th><th>Quantity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={item.image} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{item.name}</strong><small>{item.location}</small></span></div></td>
                <td>{item.categoryLabel}</td>
                <td>{money(item.price)} / day</td>
                <td>{item.quantity}</td>
                <td><StatusPill>{item.status}</StatusPill></td>
                <td>
                  <div className={styles.actionStack}>
                    {admin ? (
                      <>
                        <button className={styles.tableAction} type="button" onClick={() => { setListingStatus(item.id, "Approved"); notify(`${item.name} approved.`); }}>Approve</button>
                        <button className={styles.tableActionDanger} type="button" onClick={() => { setListingStatus(item.id, "Rejected"); notify(`${item.name} rejected.`, "info"); }}>Reject</button>
                      </>
                    ) : null}
                    <EquipmentEdit item={item} onSave={(updates) => { updateEquipment(item.id, updates); notify("Equipment details updated."); }} />
                    <Link className={styles.tableAction} href={`/equipment/${item.id}`}>Details</Link>
                    <button className={styles.tableActionDanger} type="button" onClick={() => {
                      if (window.confirm(`Remove ${item.name} from your listings?`)) {
                        removeEquipment(item.id);
                        notify("Equipment listing removed.", "info");
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
        <div className={styles.cardHeading}><div><h2>All users</h2><p>Role changes will be available through authorized admin tools.</p></div><span className={styles.liveBadge}>FRONTEND PREVIEW</span></div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registration date</th><th>Account</th></tr></thead>
            <tbody>{users.map((member) => (
              <tr key={member.id}>
                <td><strong>{member.name}</strong></td><td>{member.email}</td>
                <td>
                  {roleNames[member.role]}
                </td>
                <td>{member.createdAt ?? "—"}</td>
                <td><StatusPill>Active</StatusPill></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderAddEquipment() {
    return (
      <AddEquipmentForm
        onCreate={(data) => {
          const listing = addEquipment(data);
          notify(`${listing.name} was submitted for admin review.`, "success");
          router.push(`${roleBase}/equipment`);
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
            {role === "owner" ? <Link className={styles.smallPrimary} href={`${roleBase}/add-equipment`}>+ Add equipment</Link> : null}
          </div>
          {renderEquipmentTable(items, role === "admin")}
        </section>
      );
    }
    if (activeSection === "profile") {
      return (
        <section className={styles.dataCard}>
          <div className={styles.cardHeading}><div><h2>Profile settings</h2><p>Update your name, contact details, and address.</p></div></div>
          {renderProfileShortcut()}
          <Link className={styles.smallPrimary} href="/profile">Edit profile details</Link>
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
              const href = item.section === "overview" ? roleBase : `${roleBase}/${item.section}`;
              return (
                <Link className={`${styles.navItem} ${activeSection === item.section ? styles.navActive : ""}`} href={href} key={item.section} aria-current={activeSection === item.section ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                  {item.section === "equipment" && role === "admin" && listings.some((listing) => listing.status === "Pending") ? <i>{listings.filter((listing) => listing.status === "Pending").length}</i> : null}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarBottom}>
            <div className={styles.demoCaption}><strong>Demo workspace</strong><span>Changes are saved in this browser only.</span></div>
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
            <Link className={styles.topProfile} href="/profile">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Link>
          </header>
          {renderContent()}
          <footer className={styles.workspaceFooter}><span>© 2026 VaraX</span><span>Frontend demo · Changes stay in this browser</span></footer>
        </div>
      </div>
    </main>
  );
}

function BookingTable({
  rows,
  admin,
  showCustomer,
  canManage,
  onStatusChange,
  onPaymentChange,
}: {
  rows: ReturnType<typeof useDemoPlatform>["bookings"];
  admin: boolean;
  showCustomer: boolean;
  canManage: boolean;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onPaymentChange: (id: string, status: PaymentStatus) => void;
}) {
  if (!rows.length) return <EmptyState title="No rentals yet" detail="Bookings will appear here after you reserve equipment." action={<Link className={styles.smallPrimary} href="/equipment">Explore equipment</Link>} />;
  return (
    <div className={styles.tableScroll}>
      <table className={styles.dataTable}>
        <thead><tr><th>Equipment & renter</th><th>Rental dates</th><th>Booking date</th><th>Amount</th><th>Payment</th><th>Booking</th>{admin ? <th>Owner</th> : null}</tr></thead>
        <tbody>{rows.map((booking) => (
          <tr key={booking.id}>
            <td><div className={styles.equipmentCell}><div className={styles.tableImage}><Image src={booking.equipmentImage} alt="" fill sizes="3rem" unoptimized /></div><span><strong>{booking.equipmentName}</strong><small>{showCustomer ? booking.customerName : booking.id}</small></span></div></td>
            <td>{booking.startDate}<small className={styles.dateSubline}>to {booking.endDate}</small></td>
            <td>{booking.bookingDate}</td>
            <td><strong>{money(booking.totalAmount)}</strong><small className={styles.dateSubline}>{booking.quantity} unit{booking.quantity === 1 ? "" : "s"}</small></td>
            <td>
              {admin ? (
                <select aria-label={`Update payment for booking ${booking.id}`} value={booking.paymentStatus} onChange={(event) => onPaymentChange(booking.id, event.target.value as PaymentStatus)}>
                  {(["Unpaid", "Paid", "Refunded"] as PaymentStatus[]).map((status) => <option key={status}>{status}</option>)}
                </select>
              ) : <StatusPill>{booking.paymentStatus}</StatusPill>}
            </td>
            <td>
              {canManage ? (
                <select aria-label={`Update booking ${booking.id}`} value={booking.bookingStatus} onChange={(event) => onStatusChange(booking.id, event.target.value as BookingStatus)}>
                  {(["Pending", "Confirmed", "Active", "Completed", "Cancelled"] as BookingStatus[]).map((status) => <option key={status}>{status}</option>)}
                </select>
              ) : <StatusPill>{booking.bookingStatus}</StatusPill>}
            </td>
            {admin ? <td>{booking.ownerName}</td> : null}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function MonthlyBars({ bookings, revenue = false }: { bookings: ReturnType<typeof useDemoPlatform>["bookings"]; revenue?: boolean }) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const value = bookings
      .filter((booking) => booking.bookingDate.startsWith(key) && (!revenue || booking.paymentStatus === "Paid"))
      .reduce((sum, booking) => sum + (revenue ? booking.totalAmount : 1), 0);
    return { label: date.toLocaleDateString("en", { month: "short" }), value };
  });
  const max = Math.max(1, ...months.map((month) => month.value));
  return (
    <div className={styles.chartArea} role="img" aria-label={revenue ? "Monthly paid rental earnings" : "Monthly booking activity"}>
      {months.map((month) => (
        <div className={styles.chartColumn} key={month.label}>
          <span className={styles.chartValue}>{revenue ? (month.value ? `${Math.round(month.value / 1000)}k` : "0") : month.value}</span>
          <div className={styles.chartTrack}><span style={{ height: `${Math.max(month.value ? 12 : 4, (month.value / max) * 100)}%` }} /></div>
          <small>{month.label}</small>
        </div>
      ))}
    </div>
  );
}

function AddEquipmentForm({ onCreate }: { onCreate: (input: Parameters<ReturnType<typeof useDemoPlatform>["addEquipment"]>[0]) => void }) {
  const [selectedRentals, setSelectedRentals] = useState<RentalType[]>(["Daily"]);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  function toggleRental(type: RentalType) {
    setSelectedRentals((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (imageError) return;
    if (!selectedRentals.length) {
      setMessage("Choose at least one rental period.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const category = String(data.get("category")) as Category;
    const categoryLabel = categories.find((item) => item.value === category)?.label ?? category;
    onCreate({
      name: String(data.get("name")),
      description: String(data.get("description")),
      category,
      categoryLabel: `${categoryLabel} Equipment`,
      location: String(data.get("location")),
      price: Number(data.get("price")),
      rentals: selectedRentals,
      quantity: Number(data.get("quantity")),
      condition: String(data.get("condition")),
      brand: String(data.get("brand")),
      model: String(data.get("model")),
      image: imagePreview || String(data.get("image")) || "/equipment/camera.jpg",
      terms: String(data.get("terms")),
    });
  }

  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeading}><div><h2>Add equipment</h2><p>Your listing will be marked pending until it is reviewed.</p></div><StatusPill>Pending</StatusPill></div>
      <form className={styles.equipmentForm} onSubmit={submit}>
        <label>Equipment name<input name="name" placeholder="e.g. Canon EOS R6" required maxLength={90} /></label>
        <label>Category<select name="category" defaultValue="construction">{categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label>Location<input name="location" placeholder="Area, city" required /></label>
        <label>Rental price (৳)<input name="price" type="number" min="1" required placeholder="2500" /></label>
        <label>Available quantity<input name="quantity" type="number" min="1" required defaultValue="1" /></label>
        <label>Condition<input name="condition" placeholder="Excellent, well maintained" required /></label>
        <label>Brand<input name="brand" placeholder="Brand" required /></label>
        <label>Model<input name="model" placeholder="Model or year" required /></label>
        <label className={styles.formWide}>Equipment image URL<input name="image" type="text" defaultValue="/equipment/camera.jpg" placeholder="https://… or /equipment/camera.jpg" /></label>
        <label className={styles.formWide}>Or choose an image for this browser preview<input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
            setImageError("Choose an image under 2 MB.");
            setImagePreview("");
            return;
          }
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
        <fieldset className={styles.rentalTypes}><legend>Rental periods</legend>{rentalTypes.map((type) => <label key={type}><input type="checkbox" checked={selectedRentals.includes(type)} onChange={() => toggleRental(type)} />{type}</label>)}</fieldset>
        <label className={styles.formWide}>Description<textarea name="description" rows={4} maxLength={1000} required placeholder="Describe the equipment, its condition, and what it is suitable for." /></label>
        <label className={styles.formWide}>Rental terms and conditions<textarea name="terms" rows={3} maxLength={700} required placeholder="Add pickup, deposit, and return conditions." /></label>
        {message ? <p className={styles.formError} role="alert">{message}</p> : null}
        <div className={styles.formFooter}><span>New listings are submitted with <strong>Pending</strong> status.</span><button className={styles.smallPrimary} type="submit">Submit for review <span aria-hidden="true">→</span></button></div>
      </form>
    </section>
  );
}
