"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/brands", label: "Brands" },
  { href: "/catalogue/bulk-order", label: "Bulk Order" },
  { href: "/orders", label: "Orders" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<{
    role: string;
    email: string;
    status?: string;
    profileImage?: string;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    function readCart() {
      const cart = JSON.parse(localStorage.getItem("osx_cart") || "[]");
      setCartCount(
        cart.reduce((s: number, i: { qty: number }) => s + i.qty, 0),
      );
    }
    readCart();
    window.addEventListener("storage", readCart);
    const interval = setInterval(readCart, 1000);
    return () => {
      window.removeEventListener("storage", readCart);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setSession(d.session || null);
        setSessionLoading(false);
      })
      .catch(() => setSessionLoading(false));
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/");
  }

  const isAdmin = session?.role === "admin";
  const isBuyer = session?.role === "buyer";

  if (isAdmin && pathname.startsWith("/admin")) return null;

  if (
    ["/login", "/register", "/pending-approval", "/suspended"].some((path) =>
      pathname.startsWith(path),
    )
  )
    return null;
  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="relative top-0 z-50 flex justify-center px-4 pt-3"
        style={{ background: "transparent" }}
      >
        <div
          className="w-full max-w-5xl transition-all duration-300 rounded-2xl"
          style={{
            background: scrolled
              ? "rgba(240,253,244,0.97)"
              : "rgba(240,253,244,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            boxShadow: scrolled
              ? "0 4px 24px rgba(34,197,94,0.08), 0 1px 0 rgba(255,255,255,0.8) inset"
              : "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="px-5 md:px-6">
            <div className="flex items-center justify-between h-[58px]">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <img
                  src="/logo.jpg"
                  alt="OuterSkinX"
                  className="h-12 mt-4 w-auto rounded-lg object-contain"
                />
              </Link>

              {/* Desktop nav — centered pill */}
              <nav
                className="hidden md:flex items-center gap-0.5 px-2 py-1 rounded-xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {NAV_LINKS.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-1.5 rounded-lg text-sm transition-all duration-200"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: active ? 500 : 400,
                        color: active
                          ? "var(--brand-green)"
                          : "var(--foreground-muted)",
                        background: active
                          ? "var(--background)"
                          : "transparent",
                        boxShadow: active
                          ? "0 1px 4px rgba(0,0,0,0.06)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          e.currentTarget.style.color = "var(--foreground)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          e.currentTarget.style.color =
                            "var(--foreground-muted)";
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                {/* Cart */}
                {(isBuyer || !session) && (
                  <Link
                    href="/cart"
                    className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
                    style={{
                      color: "var(--foreground-muted)",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--brand-green)";
                      e.currentTarget.style.color = "var(--brand-green)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--foreground-muted)";
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full font-bold"
                        style={{
                          background: "var(--brand-green)",
                          color: "#fff",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.52rem",
                        }}
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Auth — desktop */}
                {sessionLoading ? (
                  <div className="hidden md:block w-24 h-8 rounded-lg skeleton" />
                ) : session ? (
                  <div className="hidden md:flex items-center gap-1.5">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                      style={{
                        border: "1px solid var(--border)",
                        color: "var(--foreground-muted)",
                        fontFamily: "var(--font-dm-mono)",
                        background: "var(--surface)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-strong)";
                        e.currentTarget.style.color = "var(--foreground)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--foreground-muted)";
                      }}
                    >
                      {session.profileImage ? (
                        <img
                          src={session.profileImage}
                          alt={session.email}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                          style={{
                            background: "var(--brand-green)",
                            color: "#fff",
                            fontFamily: "var(--font-syne)",
                            fontSize: "0.6rem",
                          }}
                        >
                          {session.email.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {session.email.split("@")[0]}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                      style={{
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--danger)";
                        e.currentTarget.style.background = "var(--danger-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          "var(--foreground-subtle)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--foreground-muted)",
                      fontFamily: "var(--font-dm-sans)",
                      background: "var(--surface)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--brand-green)";
                      e.currentTarget.style.color = "var(--brand-green)";
                      e.currentTarget.style.background =
                        "var(--brand-green-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--foreground-muted)";
                      e.currentTarget.style.background = "var(--surface)";
                    }}
                  >
                    Sign in
                  </Link>
                )}

                {/* Mobile hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                  style={{
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                  aria-label="Open menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 12h18M3 6h18M3 18h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar overlay ──────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar panel ────────────────────────────── */}
      <div
        className="fixed top-0 right-0 h-full z-[70] md:hidden flex flex-col transition-all duration-300"
        style={{
          width: "280px",
          background: "var(--background)",
          borderLeft: "1px solid var(--border)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: sidebarOpen ? "-8px 0 40px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="OuterSkinX"
              className="h-12 mt-4 w-auto rounded-lg object-contain"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{
              color: "var(--foreground-subtle)",
              background: "var(--surface)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--foreground)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--foreground-subtle)")
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p
            className="px-3 mb-3"
            style={{
              fontSize: "0.65rem",
              color: "var(--foreground-subtle)",
              fontFamily: "var(--font-dm-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Navigation
          </p>
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all"
                style={{
                  color: active
                    ? "var(--brand-green)"
                    : "var(--foreground-muted)",
                  background: active
                    ? "var(--brand-green-subtle)"
                    : "transparent",
                  fontWeight: active ? 500 : 400,
                  fontFamily: "var(--font-dm-sans)",
                  border: active
                    ? "1px solid var(--brand-green-border)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--surface)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--foreground-muted)";
                  }
                }}
              >
                {link.label}
                {active && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 4.5L16 12L8 19.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — auth */}
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {sessionLoading ? (
            <div className="h-12 skeleton rounded-xl" />
          ) : session ? (
            <div className="space-y-2">
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    background: "var(--brand-green)",
                    color: "#fff",
                    fontFamily: "var(--font-syne)",
                    fontSize: "0.75rem",
                  }}
                >
                  {session.email.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {session.email.split("@")[0]}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{
                      color: "var(--foreground-subtle)",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {session.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  color: "var(--danger)",
                  background: "var(--danger-bg)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="btn-primary w-full justify-center">
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-ghost w-full justify-center"
              >
                Apply for access
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
