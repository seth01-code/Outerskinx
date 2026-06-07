"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Order {
  _id: string
  items: { name: string; qty: number; unitPrice: number }[]
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  dhl?: { trackingNumber?: string }
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "#facc15", bg: "rgba(250,204,21,0.08)",   label: "Pending" },
  confirmed:  { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   label: "Confirmed" },
  processing: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  label: "Processing" },
  shipped:    { color: "#22c55e", bg: "rgba(34,197,94,0.08)",    label: "Shipped" },
  delivered:  { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   label: "Delivered" },
  cancelled:  { color: "#f87171", bg: "rgba(248,113,113,0.08)",  label: "Cancelled" },
}

const PAYMENT_LABELS: Record<string, string> = {
  paystack:      "Paystack",
  bank_transfer: "Bank Transfer",
  net_terms:     "Net Terms",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setOrders(d.orders || [])
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load orders")
        setLoading(false)
      })
  }, [])

  return (
    <div
      className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="section-label mb-2">Your account</div>
            <h1
              className="text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
            >
              Orders
            </h1>
          </div>
          <Link href="/catalogue" className="btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New order
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ border: "1px solid var(--border)", color: "var(--danger)" }}
          >
            <p className="text-sm">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            className="text-center py-32 rounded-2xl"
            style={{ border: "1px dashed var(--border)" }}
          >
            <svg
              width="36" height="36" viewBox="0 0 24 24" fill="none"
              className="mx-auto mb-4"
              style={{ color: "var(--foreground-subtle)" }}
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ color: "var(--foreground-muted)", fontWeight: 300, marginBottom: "16px" }}>
              No orders yet.
            </p>
            <Link href="/catalogue" className="btn-primary">
              Browse catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending
              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl transition-all group"
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
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: s.bg }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: s.color }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontSize: "0.7rem",
                            color: "var(--foreground-subtle)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <span
                          className="badge"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p
                        className="text-sm mb-1"
                        style={{ color: "var(--foreground)", fontWeight: 400 }}
                      >
                        {order.items.length} {order.items.length === 1 ? "product" : "products"}
                        {" · "}
                        {order.items.reduce((s, i) => s + i.qty, 0)} units
                      </p>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--foreground-subtle)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                        {order.dhl?.trackingNumber && (
                          <> · Tracking: {order.dhl.trackingNumber}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0">
                    <p
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        color: "var(--brand-green)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      ₦{order.total.toLocaleString()}
                    </p>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      className="transition-transform group-hover:translate-x-0.5"
                      style={{ color: "var(--foreground-subtle)" }}
                    >
                      <path d="M8 4.5L16 12L8 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}