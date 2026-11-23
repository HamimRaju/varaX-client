"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { usePlatform } from "@/app/lib/platform-context";
import styles from "./profile.module.css";

function ProfilePortrait() {
  return (
    <span className={styles.portrait} aria-hidden="true">
      <svg viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="48" fill="#DCE6E7" />
        <path d="M22 86c2.8-15 12.2-23 26-23s23.2 8 26 23" fill="#31485B" />
        <path d="M36 60h24v14c-3 5-7 8-12 8s-9-3-12-8V60Z" fill="#D39A79" />
        <path d="M30 39c0-15 7.5-24 18-24s18 9 18 24v9c0 13-8 22-18 22s-18-9-18-22v-9Z" fill="#E6B99C" />
        <path d="M29 40c-2-15 4-28 19-28 14 0 20 11 19 27-4-2-7-6-8-11-7 5-17 8-30 8v4Z" fill="#263442" />
        <path d="M38 44h5m10 0h5" stroke="#49382F" strokeLinecap="round" strokeWidth="2" />
        <path d="M43 56c3 2 7 2 10 0" stroke="#9A5E54" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { ready, user, updateProfile: saveProfile, notify } = usePlatform();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?callbackURL=%2Fprofile");
      return;
    }
  }, [ready, router, user]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await saveProfile({
        name: name ?? user.name,
        phone: phone ?? user.phone ?? "",
        address: address ?? user.address ?? "",
        image: image ?? user.image ?? "",
      });
      setSaved(true);
      notify("Your profile has been updated.", "success");
    } catch {
      setSaveError("Your profile could not be updated. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) {
    return <main className={styles.profilePage}><p>Loading your profile…</p></main>;
  }
  const profileName = name ?? user.name;
  const profileEmail = user.email;
  const profilePhone = phone ?? user.phone ?? "";
  const profileAddress = address ?? user.address ?? "";
  const profileImage = image ?? user.image ?? "";

  return (
    <main className={styles.profilePage}>
      <div className={styles.profileShell}>
        <div className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>ACCOUNT SETTINGS</span>
            <h1>My Profile</h1>
            <p>Manage your VaraX account information.</p>
          </div>
          <Link className={styles.backLink} href={`/dashboard/${user.role}`}>
            My dashboard <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <section className={styles.profileCard} aria-labelledby="profile-title">
          <div className={styles.identity}>
            {profileImage ? (
              <Image className={styles.profilePhoto} src={profileImage} alt="" width={80} height={80} unoptimized />
            ) : (
              <ProfilePortrait />
            )}
            <div className={styles.identityCopy}>
              <h2 id="profile-title">{profileName}</h2>
              <p>{profileEmail}</p>
              <span className={styles.memberBadge}>
                <span /> VaraX member
              </span>
            </div>
          </div>

          <div className={styles.sectionLabel}>
            <div>
              <h3>Personal information</h3>
              <p>Keep your contact details up to date.</p>
            </div>
            <span className={styles.lockIcon} aria-label="Your information is private">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="4.5" y="8.5" width="11" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 8.5V6a3 3 0 0 1 6 0v2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          </div>

          <form className={styles.profileForm} onSubmit={updateProfile}>
            <label className={styles.field}>
              <span>Full Name</span>
              <input
                autoComplete="name"
                value={profileName}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Email Address</span>
              <input
                autoComplete="email"
                type="email"
                value={profileEmail}
                readOnly
                required
              />
              <small>Email changes are managed through your sign-in provider.</small>
            </label>
            <label className={styles.field}>
              <span>Phone Number</span>
              <input
                autoComplete="tel"
                type="tel"
                value={profilePhone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setSaved(false);
                }}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Address</span>
              <input
                autoComplete="street-address"
                value={profileAddress}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setSaved(false);
                }}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Profile Photo URL</span>
              <input
                type="url"
                autoComplete="url"
                placeholder="https://example.com/photo.jpg"
                value={profileImage}
                onChange={(event) => {
                  setImage(event.target.value);
                  setSaved(false);
                }}
              />
            </label>

            <div className={styles.formActions}>
              {saveError ? (
                <p className={styles.savedMessage} role="alert">{saveError}</p>
              ) : saved ? (
                <p className={styles.savedMessage} role="status">
                  Your profile changes have been saved.
                </p>
              ) : (
                <span className={styles.privacyNote}>Your details are only shared when you book.</span>
              )}
              <button className={styles.updateButton} disabled={saving} type="submit">
                {saving ? "Saving…" : saved ? "Profile Updated" : "Update Profile"}
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m4 10 4 4 8-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                </svg>
              </button>
            </div>
          </form>
        </section>

        <p className={styles.accountNote}>
          Need to change your password? <Link href="/login">Manage sign-in settings</Link>
        </p>
      </div>
    </main>
  );
}
