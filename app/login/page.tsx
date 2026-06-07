"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/catalogue";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      if (data.status === "pending") {
        router.push("/pending-approval");
        return;
      }
      if (data.status === "suspended") {
        router.push("/suspended");
        return;
      }
      if (data.role === "admin") {
        router.push("/admin");
        return;
      }
      router.push(next);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex-1 flex items-center justify-center px-5 py-16 relative"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%), var(--background)",
      }}
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 50% 30%, black, transparent)",
        }}
      />

      <div className="w-full max-w-sm relative animate-fadeUp">
        {/* Logo mark */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "var(--brand-green)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 4.5L16 12L8 19.5"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              color: "var(--foreground-muted)",
              fontWeight: 300,
              fontSize: "0.875rem",
            }}
          >
            No account?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--brand-green)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Apply for wholesale access
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "var(--foreground-subtle)",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@business.com"
              className="input-base"
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "var(--foreground-subtle)",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-base pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs transition-colors"
                style={{
                  color: "var(--foreground-subtle)",
                  fontFamily: "var(--font-dm-mono)",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--foreground-muted)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--foreground-subtle)")
                }
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Error */}
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
            style={{ padding: "12px 24px" }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="32"
                    strokeDashoffset="12"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div
            className="flex-1 h-px"
            style={{ background: "var(--border)" }}
          />
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--foreground-subtle)",
              fontFamily: "var(--font-dm-mono)",
              letterSpacing: "0.08em",
            }}
          >
            NEW HERE?
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "var(--border)" }}
          />
        </div>

        <Link
          href="/register"
          className="btn-ghost w-full justify-center"
          style={{ padding: "12px 24px" }}
        >
          Apply for wholesale access
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
