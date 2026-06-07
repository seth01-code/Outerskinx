"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Package,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Loader2,
  Menu,
  ChevronRight,
} from "lucide-react"

const NAV = [
  { href: "/admin",          label: "Overview", icon: LayoutGrid },
  { href: "/admin/buyers",   label: "Buyers",   icon: Users },
  { href: "/admin/orders",   label: "Orders",   icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands",   label: "Brands",   icon: Star },
]

const COLLAPSED_W = 64
const EXPANDED_W  = 220

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [checking,   setChecking]   = useState(true)
  const [session,    setSession]    = useState<{ email: string; role: string } | null>(null)
  const [expanded,   setExpanded]   = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [tooltip,    setTooltip]    = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.session || d.session.role !== "admin") {
          router.push("/login")
        } else {
          setSession(d.session)
          setChecking(false)
        }
      })
      .catch(() => router.push("/login"))
  }, [router])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  async function handleLogout() {
    setSigningOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="section-label animate-pulse">Verifying access...</p>
      </div>
    )
  }

  /* ── Shared sidebar content ─────────────────────────────── */
  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    const isExpanded = isMobile ? true : expanded

    return (
      <aside
        style={{
          width:    isExpanded ? EXPANDED_W : COLLAPSED_W,
          minWidth: isExpanded ? EXPANDED_W : COLLAPSED_W,
          height: "100vh",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          position: isMobile ? "relative" : "sticky",
          top: 0,
          flexShrink: 0,
          zIndex: 30,
        }}
      >

        {/* ── Header ──────────────────────────────────────── */}
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "space-between" : "center",
            padding: isExpanded ? "0 10px 0 16px" : "0",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            transition: "padding 0.22s ease",
          }}
        >
          {/* Logo — only when expanded */}
          {isExpanded && (
            <Link href="/" className="flex items-center gap-1.5 min-w-0">
             <img src="/logo.jpg" alt="OuterSkinX" className="w-full h-10 rounded-lg object-cover" />
            </Link>
          )}

          {/* Collapse / expand toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={() => setExpanded((p) => !p)}
              title={expanded ? "Collapse sidebar" : "Expand sidebar"}
              style={{
                width: 30, height: 30,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-raised)",
                color: "var(--foreground-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--brand-green)"
                e.currentTarget.style.borderColor = "var(--brand-green-border)"
                e.currentTarget.style.background = "var(--brand-green-subtle)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--foreground-subtle)"
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.background = "var(--surface-raised)"
              }}
            >
              {expanded
                ? <PanelLeftClose size={14} strokeWidth={1.75} />
                : <PanelLeftOpen  size={14} strokeWidth={1.75} />
              }
            </button>
          )}
        </div>

        {/* Admin badge — expanded only */}
        {isExpanded && (
          <div style={{ padding: "10px 12px 4px" }}>
            <span
              style={{
                fontSize: "0.58rem",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.1em",
                color: "var(--warning)",
                background: "var(--warning-bg)",
                border: "1px solid rgba(217,119,6,0.2)",
                padding: "3px 8px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              ADMIN PANEL
            </span>
          </div>
        )}

        {/* ── Nav links ────────────────────────────────────── */}
        <nav
          style={{
            flex: 1,
            padding: "8px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {NAV.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <div
                key={item.href}
                style={{ position: "relative" }}
                onMouseEnter={() => !isExpanded && setTooltip(item.label)}
                onMouseLeave={() => setTooltip(null)}
              >
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: isExpanded ? "9px 12px" : "9px 0",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    borderRadius: 10,
                    color: active ? "var(--foreground)" : "var(--foreground-subtle)",
                    background: active ? "var(--surface-raised)" : "transparent",
                    fontWeight: active ? 500 : 400,
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--surface-raised)"
                      e.currentTarget.style.color = "var(--foreground-muted)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "var(--foreground-subtle)"
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0, top: "20%",
                        height: "60%", width: 3,
                        borderRadius: 999,
                        background: "var(--brand-green)",
                        boxShadow: "0 0 8px var(--brand-green-glow)",
                      }}
                    />
                  )}
                  <span style={{ color: active ? "var(--brand-green)" : "inherit", flexShrink: 0, marginLeft: active ? 2 : 0 }}>
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  {isExpanded && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Tooltip — collapsed state */}
                {!isExpanded && tooltip === item.label && (
                  <div
                    style={{
                      position: "fixed",
                      left: COLLAPSED_W + 8,
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-dm-mono)",
                      padding: "5px 10px",
                      borderRadius: 8,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      zIndex: 999,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Footer ───────────────────────────────────────── */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* User info — expanded only */}
          {isExpanded && session && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--surface-raised)",
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 26, height: 26,
                  borderRadius: "50%",
                  background: "var(--brand-green)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "var(--font-syne)",
                }}
              >
                {session.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-dm-mono)",
                    color: "var(--foreground-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.email}
                </p>
                <p style={{ fontSize: "0.6rem", color: "var(--warning)", fontFamily: "var(--font-dm-mono)" }}>
                  Administrator
                </p>
              </div>
            </div>
          )}

          {/* Sign out */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => !isExpanded && setTooltip("__signout")}
            onMouseLeave={() => setTooltip(null)}
          >
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: isExpanded ? "9px 12px" : "9px 0",
                justifyContent: isExpanded ? "flex-start" : "center",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "var(--foreground-subtle)",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.875rem",
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.5 : 1,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!signingOut) {
                  e.currentTarget.style.background = "var(--danger-bg)"
                  e.currentTarget.style.color = "var(--danger)"
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--foreground-subtle)"
              }}
            >
              <span style={{ flexShrink: 0 }}>
                {signingOut
                  ? <Loader2 size={16} strokeWidth={1.75} style={{ animation: "spin 1s linear infinite" }} />
                  : <LogOut  size={16} strokeWidth={1.75} />
                }
              </span>
              {isExpanded && (
                <span>{signingOut ? "Signing out…" : "Sign out"}</span>
              )}
            </button>

            {/* Tooltip — sign out */}
            {!isExpanded && tooltip === "__signout" && (
              <div
                style={{
                  position: "fixed",
                  left: COLLAPSED_W + 8,
                  bottom: 16,
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--danger)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-dm-mono)",
                  padding: "5px 10px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  zIndex: 999,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                Sign out
              </div>
            )}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-30 md:hidden" style={{ width: EXPANDED_W }}>
          <SidebarContent isMobile />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile topbar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 sticky top-0 z-10"
          style={{
            height: 52,
            background: "rgba(240,253,244,0.95)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-raised)",
              color: "var(--foreground-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Menu size={15} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1.5">
            <img src="/logo.jpg" alt="OuterSkinX" className="h-12 mt-4 w-auto rounded-lg object-contain" />

          </div>

          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.58rem",
              fontFamily: "var(--font-dm-mono)",
              letterSpacing: "0.1em",
              color: "var(--warning)",
              background: "var(--warning-bg)",
              border: "1px solid rgba(217,119,6,0.2)",
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            ADMIN
          </span>
        </div>

        <main style={{ flex: 1, padding: "20px" }} className="md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}