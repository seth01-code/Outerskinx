"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Stats {
  totalBuyers: number
  pendingBuyers: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalBrands: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [buyersRes, ordersRes, productsRes, brandsRes] = await Promise.all([
        fetch("/api/admin/buyers"),
        fetch("/api/admin/orders"),
        fetch("/api/products?limit=1"),
        fetch("/api/brands"),
      ])
      const [buyers, orders, products, brands] = await Promise.all([
        buyersRes.json(),
        ordersRes.json(),
        productsRes.json(),
        brandsRes.json(),
      ])
      setStats({
        totalBuyers: buyers.buyers?.length || 0,
        pendingBuyers: buyers.buyers?.filter((b: { status: string }) => b.status === "pending").length || 0,
        totalOrders: orders.total || 0,
        pendingOrders: orders.orders?.filter((o: { status: string }) => o.status === "pending").length || 0,
        totalProducts: products.total || 0,
        totalBrands: brands.brands?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const STAT_CARDS = stats ? [
    { label: "Total buyers", value: stats.totalBuyers, sub: `${stats.pendingBuyers} pending approval`, href: "/admin/buyers", color: "var(--info)" },
    { label: "Total orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, href: "/admin/orders", color: "var(--brand-green)" },
    { label: "Products", value: stats.totalProducts, sub: "Active SKUs", href: "/admin/products", color: "var(--warning)" },
    { label: "Brands", value: stats.totalBrands, sub: "Active brands", href: "/admin/brands", color: "var(--info)" },
  ] : []

  const QUICK_LINKS = [
    { href: "/admin/buyers", label: "Review pending buyers", desc: "Approve or reject new applications", urgent: (stats?.pendingBuyers || 0) > 0 },
    { href: "/admin/orders", label: "Manage orders", desc: "Update status and add tracking numbers", urgent: (stats?.pendingOrders || 0) > 0 },
    { href: "/admin/products", label: "Import products", desc: "Upload Excel sheet to add or update products", urgent: false },
    { href: "/admin/brands", label: "Manage brands", desc: "Add, edit or import brands", urgent: false },
  ]

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <div className="section-label mb-2">Admin dashboard</div>
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
        >
          Overview
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))
        ) : (
          STAT_CARDS.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="p-5 rounded-xl transition-all group"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)"
                e.currentTarget.style.background = "var(--surface-raised)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.background = "var(--surface)"
              }}
            >
              <p
                className="text-3xl mb-1"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: card.color,
                }}
              >
                {card.value}
              </p>
              <p
                className="text-sm mb-1"
                style={{ color: "var(--foreground)", fontWeight: 500 }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--foreground-subtle)",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                {card.sub}
              </p>
            </Link>
          ))
        )}
      </div>

      {/* Quick links */}
      <div>
        <p className="section-label mb-4">Quick actions</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between gap-4 p-5 rounded-xl transition-all group"
              style={{
                background: "var(--surface)",
                border: `1px solid ${link.urgent ? "rgba(250,204,21,0.3)" : "var(--border)"}`,
                boxShadow: link.urgent ? "0 0 20px rgba(250,204,21,0.05)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = link.urgent ? "rgba(250,204,21,0.5)" : "var(--border-strong)"
                e.currentTarget.style.background = "var(--surface-raised)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = link.urgent ? "rgba(250,204,21,0.3)" : "var(--border)"
                e.currentTarget.style.background = "var(--surface)"
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {link.label}
                  </p>
                  {link.urgent && (
                    <span
                      className="badge"
                      style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
                    >
                      Action needed
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--foreground-subtle)", fontWeight: 300 }}>
                  {link.desc}
                </p>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: "var(--foreground-subtle)" }}
              >
                <path d="M8 4.5L16 12L8 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}