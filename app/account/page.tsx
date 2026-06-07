"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

interface Buyer {
  _id: string;
  businessName: string;
  contactName: string;
  profileImage?: string;
  email: string;
  phone: string;
  buyerTier: "retailer" | "distributor" | "premium";
  status: "pending" | "approved" | "suspended";
  address: Address;
  savedAddresses: Address[];
  createdAt: string;
}

const TIER_STYLES: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  retailer: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    label: "Retailer",
  },
  distributor: {
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    label: "Distributor",
  },
  premium: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "Premium" },
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs mb-2"
      style={{
        color: "var(--foreground-subtle)",
        fontFamily: "var(--font-dm-mono)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ contactName: "", phone: "" });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    fetch("/api/account")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.error) {
          router.push("/login");
          return;
        }
        setBuyer(d.buyer);
        setForm({ contactName: d.buyer.contactName, phone: d.buyer.phone });
        setLoading(false);
      });
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setBuyer(data.buyer);
      setSuccess("Profile updated successfully");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingAvatar(true)
  setError("")
  try {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/account/upload-avatar", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Upload failed"); return }
    setBuyer(data.buyer)
  } catch {
    setError("Upload failed")
  } finally {
    setUploadingAvatar(false)
    e.target.value = ""
  }
}

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setSuccess("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen px-5 md:px-8 py-12"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!buyer) return null;

  const tier = TIER_STYLES[buyer.buyerTier] || TIER_STYLES.retailer;

  return (
    <div
      className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="section-label mb-2">Your account</div>
            <h1
              className="text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              Account
            </h1>
          </div>
          <Link href="/orders" className="btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            Orders
          </Link>
        </div>

        {/* Account card */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-accent)",
            boxShadow: "0 0 30px rgba(34,197,94,0.05)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative shrink-0 group">
              {buyer.profileImage ? (
                <img
                  src={buyer.profileImage}
                  alt={buyer.businessName}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-black text-xl font-bold"
                  style={{
                    background: "var(--brand-green)",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {buyer.businessName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                {uploadingAvatar ? (
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                      stroke="#fff"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="13"
                      r="4"
                      stroke="#fff"
                      strokeWidth="1.75"
                    />
                  </svg>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-lg"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {buyer.businessName}
                </p>
                <span
                  className="badge"
                  style={{ background: tier.bg, color: tier.color }}
                >
                  {tier.label}
                </span>
                <span
                  className="badge"
                  style={{
                    background:
                      buyer.status === "approved"
                        ? "var(--success-bg)"
                        : "var(--warning-bg)",
                    color:
                      buyer.status === "approved"
                        ? "var(--success)"
                        : "var(--warning)",
                  }}
                >
                  {buyer.status}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--foreground-subtle)",
                  fontFamily: "var(--font-dm-mono)",
                  marginTop: "4px",
                }}
              >
                {buyer.email} · Member since{" "}
                {new Date(buyer.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Address */}
          <div
            className="mt-5 pt-5 grid sm:grid-cols-2 gap-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div>
              <p className="section-label mb-1.5">Business address</p>
              <address
                className="not-italic text-sm"
                style={{
                  color: "var(--foreground-muted)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                <p>{buyer.address.street}</p>
                <p>
                  {buyer.address.city}, {buyer.address.state}
                </p>
                {buyer.address.postalCode && <p>{buyer.address.postalCode}</p>}
                <p>{buyer.address.country}</p>
              </address>
            </div>
            <div>
              <p className="section-label mb-1.5">Contact</p>
              <p
                className="text-sm"
                style={{
                  color: "var(--foreground-muted)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                {buyer.contactName}
                <br />
                {buyer.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {(["profile", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
              className="flex-1 py-2 rounded-lg text-sm capitalize transition-all"
              style={{
                background:
                  tab === t ? "var(--surface-elevated)" : "transparent",
                color:
                  tab === t ? "var(--foreground)" : "var(--foreground-subtle)",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: tab === t ? 500 : 400,
                border:
                  tab === t
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
              }}
            >
              {t === "profile" ? "Edit profile" : "Change password"}
            </button>
          ))}
        </div>

        {/* Profile form */}
        {tab === "profile" && (
          <form
            onSubmit={handleProfileSave}
            className="space-y-5 p-6 rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <FieldLabel>Contact name</FieldLabel>
              <input
                value={form.contactName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactName: e.target.value }))
                }
                className="input-base"
                required
              />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="input-base"
                required
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  background: "var(--success-bg)",
                  color: "var(--success)",
                  border: "1px solid rgba(74,222,128,0.15)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {success}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {/* Password form */}
        {tab === "password" && (
          <form
            onSubmit={handlePasswordChange}
            className="space-y-5 p-6 rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <FieldLabel>Current password</FieldLabel>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                className="input-base"
                required
              />
            </div>
            <div>
              <FieldLabel>New password</FieldLabel>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                className="input-base"
                required
              />
            </div>
            <div>
              <FieldLabel>Confirm new password</FieldLabel>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                className="input-base"
                required
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{
                  background: "var(--success-bg)",
                  color: "var(--success)",
                  border: "1px solid rgba(74,222,128,0.15)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {success}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
