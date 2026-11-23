"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlatform } from "@/app/lib/platform-context";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "All Equipment", href: "/equipment", hasMenu: true },
  { label: "About", href: "/#about" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Contact", href: "/#contact" },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M3 6h9l8 17 8-17h9L23 35h-7L3 6Z" fill="#16A085" />
        <path d="M20 23 28 6h9L23 35h-7l-3-6 7-6Z" fill="var(--text-primary)" />
      </svg>
    </span>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.8 19a6.2 6.2 0 0 1 12.4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.8 8.8c0 4.1-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.8a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemeIcon({ isDark }: { isDark: boolean }) {
  return isDark ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.8v2m0 14.4v2m9.2-9.2h-2M4.8 12h-2m15.7-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m13 0-1.4-1.4M6.9 6.9 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.1 15.1A8.3 8.3 0 0 1 8.9 3.9a8.5 8.5 0 1 0 11.2 11.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="navbar-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SiteNavbar() {
  const pathname = usePathname();
  const { user, signOut, notify } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let savedTheme: string | null = null;
      try {
        savedTheme = window.localStorage.getItem("varax-theme");
      } catch {
        // Theme switching should still work if browser storage is unavailable.
      }
      const dark = savedTheme === "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      setIsDark(dark);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    setIsDark(nextIsDark);
    try {
      window.localStorage.setItem("varax-theme", nextIsDark ? "dark" : "light");
    } catch {
      // Keep the selected theme for this page session when storage is blocked.
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      notify("You have been signed out.", "success");
    } catch {
      notify("We couldn’t sign you out. Please try again.", "error");
    } finally {
      closeMenu();
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className="site-navbar"
      data-active-route={pathname.startsWith("/equipment") ? "equipment" : undefined}
    >
      <div className="navbar-inner">
        <Link className="navbar-brand" href="/" aria-label="VaraX home" onClick={closeMenu}>
          <BrandMark />
          <span className="navbar-brand-name">
            Vara<span className="brand-x">X</span>
          </span>
        </Link>

        <nav
          className="navbar-links"
          id="main-navigation"
          aria-label="Main navigation"
          data-open={menuOpen}
        >
          {navigationLinks.map(({ label, href, hasMenu }) => (
            <Link
              className="navbar-link"
              href={href}
              key={label}
              aria-current={
                href === "/"
                  ? pathname === "/"
                    ? "page"
                    : undefined
                  : href.startsWith("/#")
                    ? undefined
                    : pathname === href || pathname.startsWith(`${href}/`)
                      ? "page"
                      : undefined
              }
              onClick={closeMenu}
            >
              {label}
              {hasMenu ? <ChevronDown /> : null}
            </Link>
          ))}
          <div className="navbar-mobile-auth">
            {user ? (
              <>
                <Link className="navbar-login" href={`/dashboard/${user.role}`} onClick={closeMenu}>Dashboard</Link>
                <button className="navbar-login" onClick={handleLogout} type="button">Log out</button>
              </>
            ) : (
              <>
                <Link className="navbar-login" href="/login" onClick={closeMenu}>Login</Link>
                <Link className="button button-primary navbar-register" href="/register" onClick={closeMenu}>Register</Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={searchOpen ? "Close equipment search" : "Search equipment"}
            aria-expanded={searchOpen}
            aria-controls={searchOpen ? "navbar-equipment-search" : undefined}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <SearchIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleTheme}
          >
            <ThemeIcon isDark={isDark} />
          </button>
          <Link
            className="icon-button"
            href="/favorites"
            aria-label="My favorites"
            aria-current={pathname === "/favorites" ? "page" : undefined}
          >
            <HeartIcon />
          </Link>
          {user ? (
            <>
              <Link className="icon-button" href="/profile" aria-label="My profile" aria-current={pathname === "/profile" ? "page" : undefined}>
                <UserIcon />
              </Link>
              <Link className="navbar-login" href={`/dashboard/${user.role}`}>Dashboard</Link>
              <button className="navbar-login" onClick={handleLogout} type="button">Log out</button>
            </>
          ) : (
            <>
              <Link className="icon-button" href="/profile" aria-label="My profile" aria-current={pathname === "/profile" ? "page" : undefined}>
                <UserIcon />
              </Link>
              <Link className="navbar-login" href="/login">
                <UserIcon />
                Login
              </Link>
              <Link className="button button-primary navbar-register" href="/register">Register</Link>
            </>
          )}
          <button
            className="icon-button navbar-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon isOpen={menuOpen} />
          </button>
        </div>

        {searchOpen ? (
          <form className="navbar-search" id="navbar-equipment-search" action="/equipment" role="search">
            <label className="sr-only" htmlFor="navbar-search-input">
              Search equipment
            </label>
            <input
              id="navbar-search-input"
              name="q"
              type="search"
              placeholder="Search equipment..."
            />
            <button className="button button-primary" type="submit">
              Search
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
