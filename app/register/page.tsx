"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface FormData {
  businessName: string
  contactName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

const initial: FormData = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  street: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
}

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
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initial)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const isAdmin = form.email.toLowerCase().endsWith("@outerskinx.com")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const body = isAdmin
        ? { email: form.email, password: form.password }
        : {
            businessName: form.businessName,
            contactName: form.contactName,
            email: form.email,
            phone: form.phone,
            password: form.password,
            address: {
              street: form.street,
              city: form.city,
              state: form.state,
              country: form.country,
              postalCode: form.postalCode,
            },
          }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); return }
      if (data.role === "admin") { router.push("/admin"); return }
      router.push("/pending-approval")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const STEPS = isAdmin ? 1 : 3
  const stepLabels = ["Account", "Business", "Address"]

  return (
    <main
      className="flex-1 flex items-center justify-center px-5 py-16 relative"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 70%), var(--background)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 30%, black, transparent)",
        }}
      />

      <div className="w-full max-w-md relative animate-fadeUp">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--brand-green)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M8 4.5L16 12L8 19.5" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "-0.03em",
              }}
            >
              Outer<span style={{ color: "var(--brand-green)" }}>Skin</span>X
            </span>
          </Link>

          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
          >
            {isAdmin ? "Create admin account" : "Apply for access"}
          </h1>
          <p style={{ color: "var(--foreground-muted)", fontWeight: 300, fontSize: "0.875rem" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--brand-green)", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Step indicators — buyers only */}
        {!isAdmin && (
          <div className="flex items-center gap-2 mb-8">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1
              const active = step === stepNum
              const done = step > stepNum
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: done
                          ? "var(--brand-green)"
                          : active
                          ? "var(--brand-green-subtle)"
                          : "var(--surface-raised)",
                        border: active
                          ? "1px solid var(--brand-green)"
                          : done
                          ? "1px solid var(--brand-green)"
                          : "1px solid var(--border)",
                        color: done ? "#000" : active ? "var(--brand-green)" : "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.6rem",
                      }}
                    >
                      {done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span
                      className="text-xs hidden sm:block"
                      style={{
                        color: active ? "var(--foreground-muted)" : "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS - 1 && (
                    <div
                      className="flex-1 h-px"
                      style={{ background: done ? "var(--brand-green-border)" : "var(--border)" }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Admin — simple */}
          {isAdmin && (
            <>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="input-base"
                />
                <p
                  className="mt-2 text-xs flex items-center gap-1.5"
                  style={{ color: "var(--success)", fontFamily: "var(--font-dm-mono)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  OuterSkinX team account detected
                </p>
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className="input-base" />
              </div>
              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="input-base" />
              </div>
            </>
          )}

          {/* Buyer — step 1: email + password */}
          {!isAdmin && step === 1 && (
            <>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@business.com"
                  className="input-base"
                />
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className="input-base" />
              </div>
              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="input-base" />
              </div>
              <button
                type="button"
                className="btn-primary w-full justify-center"
                style={{ padding: "12px 24px" }}
                onClick={() => {
                  if (!form.email || !form.password || !form.confirmPassword) {
                    setError("Please fill in all fields")
                    return
                  }
                  if (form.password !== form.confirmPassword) {
                    setError("Passwords do not match")
                    return
                  }
                  if (form.password.length < 8) {
                    setError("Password must be at least 8 characters")
                    return
                  }
                  setError("")
                  setStep(2)
                }}
              >
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </>
          )}

          {/* Step 2: business details */}
          {!isAdmin && step === 2 && (
            <>
              <div>
                <FieldLabel>Business name</FieldLabel>
                <input name="businessName" value={form.businessName} onChange={handleChange} required className="input-base" placeholder="Acme Retail Ltd." />
              </div>
              <div>
                <FieldLabel>Contact name</FieldLabel>
                <input name="contactName" value={form.contactName} onChange={handleChange} required className="input-base" placeholder="Your full name" />
              </div>
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className="input-base" placeholder="+234 800 000 0000" />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1 justify-center"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1 justify-center"
                  onClick={() => {
                    if (!form.businessName || !form.contactName || !form.phone) {
                      setError("Please fill in all fields")
                      return
                    }
                    setError("")
                    setStep(3)
                  }}
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* Step 3: address */}
          {!isAdmin && step === 3 && (
            <>
              <div>
                <FieldLabel>Street address</FieldLabel>
                <input name="street" value={form.street} onChange={handleChange} required className="input-base" placeholder="123 Market Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input name="city" value={form.city} onChange={handleChange} required className="input-base" />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <input name="state" value={form.state} onChange={handleChange} required className="input-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <input name="country" value={form.country} onChange={handleChange} required className="input-base" />
                </div>
                <div>
                  <FieldLabel>Postal code</FieldLabel>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} className="input-base" />
                </div>
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{
                    background: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid rgba(248,113,113,0.15)",
                    fontWeight: 300,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-ghost flex-1 justify-center" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 justify-center"
                  style={{ padding: "12px 24px" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit application
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Admin error + submit */}
          {isAdmin && (
            <>
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{
                    background: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid rgba(248,113,113,0.15)",
                    fontWeight: 300,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
                style={{ padding: "12px 24px" }}
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </>
          )}

          {/* Non-step errors */}
          {!isAdmin && step < 3 && error && (
            <p
              className="text-sm px-4 py-3 rounded-xl flex items-center gap-2"
              style={{
                background: "var(--danger-bg)",
                color: "var(--danger)",
                border: "1px solid rgba(248,113,113,0.15)",
                fontWeight: 300,
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}