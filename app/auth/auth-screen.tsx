"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { authClient } from "@/app/lib/auth-client";
import { usePlatform } from "@/app/lib/platform-context";
import { api, getErrorMessage } from "@/app/lib/api";
import styles from "./auth.module.css";

type PlatformRole = "customer" | "owner" | "admin";

function getPlatformRole(role: unknown): PlatformRole {
  return role === "owner" || role === "admin" ? role : "customer";
}

function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const details = error as { code?: unknown; message?: unknown };
    const code = typeof details.code === "string" ? details.code.toUpperCase() : "";
    const message =
      typeof details.message === "string" ? details.message.toLowerCase() : "";

    if (
      code.includes("INVALID_EMAIL_OR_PASSWORD") ||
      message.includes("invalid email or password") ||
      message.includes("invalid credentials")
    ) {
      return "The email or password is incorrect.";
    }

    if (
      code.includes("USER_ALREADY_EXISTS") ||
      message.includes("already exists") ||
      message.includes("already registered")
    ) {
      return "An account with this email already exists. Please sign in.";
    }

    if (code.includes("SOCIAL") || message.includes("provider")) {
      return "Google sign-in is unavailable. Try email and password instead.";
    }
  }

  return fallback;
}

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M3 6h9l8 17 8-17h9L23 35h-7L3 6Z" fill="#16A085" />
        <path d="M20 23 28 6h9L23 35h-7l-3-6 7-6Z" fill="#102D36" />
      </svg>
    </span>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3 21 21M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.1 0 8.5 4.5 9.5 6.2a1.5 1.5 0 0 1 0 1.6 14.6 14.6 0 0 1-3.1 3.7M6.2 6.2a14.4 14.4 0 0 0-3.7 5 1.5 1.5 0 0 0 0 1.6C3.5 14.5 6.9 19 12 19c.8 0 1.6-.1 2.3-.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AuthScreen({
  mode,
  accountType = "customer",
}: {
  mode: "login" | "register";
  accountType?: "customer" | "owner";
}) {
  const router = useRouter();
  const { notify } = usePlatform();
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [signInMessage, setSignInMessage] = useState("");
  const [signUpMessage, setSignUpMessage] = useState("");
  const [signInPending, setSignInPending] = useState(false);
  const [signUpPending, setSignUpPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const signInLock = useRef(false);
  const signUpLock = useRef(false);
  const googleLock = useRef(false);

  function getCallbackURL() {
    const callbackURL = new URLSearchParams(window.location.search).get("callbackURL");
    if (!callbackURL?.startsWith("/") || callbackURL.startsWith("//")) return "/";

    try {
      const target = new URL(callbackURL, window.location.origin);
      return target.origin === window.location.origin
        ? `${target.pathname}${target.search}${target.hash}`
        : "/";
    } catch {
      return "/";
    }
  }

  function getSuccessURL(role: PlatformRole) {
    const callbackURL = getCallbackURL();
    const isDashboardCallback = /^\/dashboard(?:\/|[?#]|$)/.test(callbackURL);

    if (role === "customer") {
      return callbackURL === "/" || isDashboardCallback
        ? "/"
        : callbackURL;
    }

    return callbackURL === "/" ? `/dashboard/${role}` : callbackURL;
  }

  async function handleGoogleSignIn() {
    if (googleLock.current) return;
    googleLock.current = true;
    setGooglePending(true);
    setSignInMessage("");
    setSignUpMessage("");

    try {
      const requestedCallbackURL = getCallbackURL();
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL:
          requestedCallbackURL === "/"
            ? mode === "register"
              ? "/"
              : "/dashboard"
            : requestedCallbackURL,
      });
      if (result.error) throw result.error;
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        "Google sign-in is unavailable. Try email and password instead.",
      );
      if (mode === "login") setSignInMessage(message);
      else setSignUpMessage(message);
    } finally {
      googleLock.current = false;
      setGooglePending(false);
    }
  }

  function handleAvatarFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose an image file to upload.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(typeof reader.result === "string" ? reader.result : null);
      setAvatarFile(file);
      setAvatarError("");
    };
    reader.onerror = () => setAvatarError("That image could not be opened. Try another.");
    reader.readAsDataURL(file);
  }

  function handleAvatarDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    handleAvatarFile(event.dataTransfer.files[0]);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signInLock.current) return;
    signInLock.current = true;
    setSignInMessage("");
    setSignInPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("login-email")),
        password: String(formData.get("login-password")),
      });
      if (result.error) throw result.error;
      const role = getPlatformRole(result.data?.user?.role);
      notify("Welcome back to VaraX.", "success");
      router.replace(
        role === "customer" ? "/" : `/dashboard/${role}`,
      );
    } catch (error) {
      setSignInMessage(
        getAuthErrorMessage(
          error,
          "We couldn’t sign you in. Please try again.",
        ),
      );
    } finally {
      signInLock.current = false;
      setSignInPending(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signUpLock.current) return;
    signUpLock.current = true;
    setSignUpMessage("");
    setSignUpPending(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("register-password"));
    const requestedRole = accountType === "owner" ? "owner" : "customer";
    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      password.length < 6 ||
      password.length > 128
    ) {
      setSignUpMessage("Use 6–128 characters, including one uppercase and one lowercase letter.");
      signUpLock.current = false;
      setSignUpPending(false);
      return;
    }
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      setSignUpMessage("Enter a valid photo URL beginning with http:// or https://.");
      signUpLock.current = false;
      setSignUpPending(false);
      return;
    }
    try {
      const result = await authClient.signUp.email({
        name: String(formData.get("full-name")),
        email: String(formData.get("register-email")),
        password,
        role: requestedRole,
        phone: String(formData.get("register-phone")).trim(),
        ...(avatarUrl ? { image: avatarUrl } : {}),
      });
      if (result.error) throw result.error;
      const role = getPlatformRole(result.data?.user?.role ?? requestedRole);
      let imageUploadMessage = "";
      if (avatarFile) {
        try {
          const image = await api.uploadImage(avatarFile);
          await api.updateProfile(role, { image });
        } catch (error) {
          imageUploadMessage = ` Your account was created, but the profile photo could not be saved: ${getErrorMessage(error)}`;
        }
      }
      notify(
        imageUploadMessage
          ? `Your VaraX account is ready.${imageUploadMessage}`
          : role === "owner"
            ? "Your VaraX owner account is ready."
            : "Your VaraX account is ready.",
        imageUploadMessage ? "info" : "success",
      );
      router.replace(getSuccessURL(role));
    } catch (error) {
      setSignUpMessage(
        getAuthErrorMessage(
          error,
          "We couldn’t create your account. Please try again.",
        ),
      );
    } finally {
      signUpLock.current = false;
      setSignUpPending(false);
    }
  }

  return (
    <main className={`auth-page ${styles.authPage}`}>
      <div className={styles.authShell}>
        <div className={styles.pageEyebrow}>
          <span className={styles.eyebrowDot} />
          VaraX account access
        </div>

        <div className={styles.authGrid}>
          {mode === "login" ? (
            <section className={styles.authCard} id="sign-in" aria-labelledby="sign-in-title">
            <div className={styles.cardHeader}>
              <BrandMark />
              <h1 id="sign-in-title">Welcome back!</h1>
              <p>Sign in to your account</p>
            </div>

            <form className={styles.authForm} onSubmit={handleSignIn}>
              <label className={styles.field}>
                <span>Email Address</span>
                <input
                  autoComplete="email"
                  name="login-email"
                  placeholder="Enter your email"
                  required
                  type="email"
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <span className={styles.passwordInput}>
                  <input
                    autoComplete="current-password"
                    name="login-password"
                    placeholder="Enter your password"
                    required
                    type={showSignInPassword ? "text" : "password"}
                  />
                  <button
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    className={styles.passwordToggle}
                    onClick={() => setShowSignInPassword((visible) => !visible)}
                    type="button"
                  >
                    <EyeIcon visible={showSignInPassword} />
                  </button>
                </span>
              </label>

              {signInMessage ? (
                <p className={styles.formMessage} aria-live="polite" role="status">
                  {signInMessage}
                </p>
              ) : null}

              <button className={styles.submitButton} disabled={signInPending || googlePending} type="submit">
                {signInPending ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className={styles.alternativeSignIn}>
              <span>or continue with</span>
              <button
                className={styles.googleButton}
                disabled={signInPending || googlePending}
                type="button"
                onClick={() => void handleGoogleSignIn()}
              >
                <span className={styles.googleMark} aria-hidden="true">G</span>
                {googlePending ? "Connecting to Google…" : "Continue with Google"}
              </button>
            </div>

            <p className={styles.cardFooter}>
              Don&apos;t have an account? <Link href="/register">Register</Link>
            </p>
            </section>
          ) : null}

          {mode === "register" ? (
            <section
              className={`${styles.authCard} ${styles.registerCard}`}
              id="create-account"
              aria-labelledby="create-account-title"
            >
            <div className={styles.cardHeader}>
              <BrandMark />
              <h2 id="create-account-title">
                {accountType === "owner" ? "Create Owner Account" : "Create Account"}
              </h2>
              <p>
                {accountType === "owner"
                  ? "Join VaraX as an equipment owner"
                  : "Join VaraX today"}
              </p>
            </div>

            <form className={styles.authForm} onSubmit={handleSignUp}>
              <div className={styles.uploadField}>
                <span className={styles.fieldLabel}>Upload Photo <span>(optional)</span></span>
                <label
                  className={styles.uploadDropzone}
                  htmlFor="profile-photo"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleAvatarDrop}
                >
                  {avatar ? (
                    <Image
                      className={styles.avatarPreview}
                      src={avatar}
                      alt="Profile photo preview"
                      width={42}
                      height={42}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.uploadIcon}>
                      <UploadIcon />
                    </span>
                  )}
                  <span>
                    <strong>{avatar ? "Change photo" : "Click to upload"}</strong>
                    {" "}or drag and drop
                    <small>PNG, JPG or WEBP · up to 2 MB</small>
                  </span>
                  <input
                    accept="image/*"
                    className={styles.fileInput}
                    id="profile-photo"
                    onChange={(event) => handleAvatarFile(event.target.files?.[0])}
                    type="file"
                  />
                </label>
                {avatarError ? <p className={styles.fieldError}>{avatarError}</p> : null}
              </div>

              <label className={styles.field}>
                <span>Photo URL <span>(optional)</span></span>
                <input
                  autoComplete="url"
                  name="photo-url"
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    setAvatarFile(null);
                    setAvatar(null);
                  }}
                  placeholder="https://example.com/photo.jpg"
                  type="url"
                  value={avatarUrl}
                />
              </label>

              <label className={styles.field}>
                <span>Full Name</span>
                <input
                  autoComplete="name"
                  name="full-name"
                  placeholder="Enter your name"
                  required
                  type="text"
                />
              </label>

              <label className={styles.field}>
                <span>Email Address</span>
                <input
                  autoComplete="email"
                  name="register-email"
                  placeholder="Enter your email"
                  required
                  type="email"
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <span className={styles.passwordInput}>
                  <input
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    name="register-password"
                    placeholder="Create a password"
                    pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    required
                    type={showSignUpPassword ? "text" : "password"}
                    title="Use at least 6 characters, including one uppercase and one lowercase letter."
                  />
                  <button
                    aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    className={styles.passwordToggle}
                    onClick={() => setShowSignUpPassword((visible) => !visible)}
                    type="button"
                  >
                    <EyeIcon visible={showSignUpPassword} />
                  </button>
                </span>
              </label>

              <p className={styles.fieldLabel}>
                {accountType === "owner"
                  ? "This registration creates an owner account. New equipment listings are submitted for review."
                  : "New accounts start as customers. Admin access is assigned by VaraX."}
              </p>

              {signUpMessage ? (
                <p className={styles.formMessage} aria-live="polite" role="status">
                  {signUpMessage}
                </p>
              ) : null}

              <button className={styles.submitButton} disabled={signUpPending || googlePending} type="submit">
                {signUpPending ? "Creating account…" : "Register"}
              </button>
            </form>

            {accountType === "owner" ? (
              <p className={styles.fieldLabel}>
                Use email and password for owner registration. Google registration creates a customer account.
              </p>
            ) : (
              <div className={styles.alternativeSignIn}>
                <span>or register with</span>
                <button
                  className={styles.googleButton}
                  disabled={signUpPending || googlePending}
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                >
                  <span className={styles.googleMark} aria-hidden="true">G</span>
                  {googlePending ? "Connecting to Google…" : "Continue with Google"}
                </button>
              </div>
            )}

            <p className={styles.cardFooter}>
              Already have an account? <Link href="/login">Sign In</Link>
            </p>
            </section>
          ) : null}
        </div>

        <p className={styles.bottomNote}>
          A better way to get the equipment you need.
        </p>
      </div>
    </main>
  );
}
