"use client"

import { useState, useEffect } from "react"

interface Buyer {
  _id: string
  businessName: string
  contactName: string
  email: string
  phone: string
  buyerTier: string
  status: string
  createdAt: string
  address: { city: string; country: string }
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#facc15", bg: "rgba(250,204,21,0.08)" },
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  suspended:{ color: "#f87171", bg: "rgba(248,113,113,0.08)" },
}

const TIER_STYLES: Record<string, { color: string; bg: string }> = {
  retailer:    { color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  distributor: { color: "#facc15", bg: "rgba(250,204,21,0.08)" },
  premium:     { color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
}

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "suspended">("all")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/buyers")
      .then((r) => r.json())
      .then((d) => { setBuyers(d.buyers || []); setLoading(false) })
  }, [])

  async function updateBuyer(id: string, patch: { status?: string; buyerTier?: string }) {
    setUpdating(id)
    const res = await fetch(`/api/admin/buyers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (res.ok) {
      setBuyers((prev) => prev.map((b) => (b._id === id ? { ...b, ...data.buyer } : b)))
    }
    setUpdating(null)
  }

  const filtered = buyers.filter((b) => filter === "all" || b.status === filter)
  const counts = {
    all: buyers.length,
    pending: buyers.filter((b) => b.status === "pending").length,
    approved: buyers.filter((b) => b.status === "approved").length,
    suspended: buyers.filter((b) => b.status === "suspended").length,
  }

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <div className="section-label mb-2">Admin</div>
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
        >
          Buyers
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {(["all", "pending", "approved", "suspended"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm capitalize transition-all"
            style={{
              background: filter === f ? "var(--surface-elevated)" : "transparent",
              color: filter === f ? "var(--foreground)" : "var(--foreground-subtle)",
              border: filter === f ? "1px solid var(--border)" : "1px solid transparent",
              fontFamily: "var(--font-dm-sans)",
              fontWeight: filter === f ? 500 : 400,
            }}
          >
            {f}
            <span
              className="badge"
              style={{
                background: filter === f ? "var(--brand-green-subtle)" : "var(--surface-raised)",
                color: filter === f ? "var(--brand-green)" : "var(--foreground-subtle)",
                padding: "1px 6px",
                fontSize: "0.6rem",
              }}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl"
          style={{ border: "1px dashed var(--border)", color: "var(--foreground-muted)" }}
        >
          <p style={{ fontWeight: 300 }}>No {filter === "all" ? "" : filter} buyers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((buyer) => {
            const s = STATUS_STYLES[buyer.status]
            const t = TIER_STYLES[buyer.buyerTier] || TIER_STYLES.retailer
            return (
              <div
                key={buyer._id}
                className="p-5 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-black font-bold"
                      style={{ background: "var(--brand-green)", fontFamily: "var(--font-syne)" }}
                    >
                      {buyer.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {buyer.businessName}
                        </p>
                        <span className="badge" style={{ background: s.bg, color: s.color }}>
                          {buyer.status}
                        </span>
                        <span className="badge" style={{ background: t.bg, color: t.color }}>
                          {buyer.buyerTier}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--foreground-subtle)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {buyer.contactName} · {buyer.email} · {buyer.address?.city}, {buyer.address?.country}
                      </p>
                      <p
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--foreground-subtle)",
                          fontFamily: "var(--font-dm-mono)",
                          marginTop: "2px",
                        }}
                      >
                        Applied {new Date(buyer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Tier selector */}
                    <select
                      value={buyer.buyerTier}
                      onChange={(e) => updateBuyer(buyer._id, { buyerTier: e.target.value })}
                      disabled={updating === buyer._id}
                      className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground-muted)",
                        fontFamily: "var(--font-dm-mono)",
                        cursor: "pointer",
                      }}
                    >
                      <option value="retailer">Retailer</option>
                      <option value="distributor">Distributor</option>
                      <option value="premium">Premium</option>
                    </select>

                    {/* Status actions */}
                    {buyer.status !== "approved" && (
                      <button
                        onClick={() => updateBuyer(buyer._id, { status: "approved" })}
                        disabled={updating === buyer._id}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          color: "var(--success)",
                          border: "1px solid rgba(34,197,94,0.2)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {updating === buyer._id ? "..." : "Approve"}
                      </button>
                    )}
                    {buyer.status !== "suspended" && (
                      <button
                        onClick={() => updateBuyer(buyer._id, { status: "suspended" })}
                        disabled={updating === buyer._id}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: "var(--danger-bg)",
                          color: "var(--danger)",
                          border: "1px solid rgba(248,113,113,0.2)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {updating === buyer._id ? "..." : "Suspend"}
                      </button>
                    )}
                    {buyer.status === "suspended" && (
                      <button
                        onClick={() => updateBuyer(buyer._id, { status: "pending" })}
                        disabled={updating === buyer._id}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: "var(--warning-bg)",
                          color: "var(--warning)",
                          border: "1px solid rgba(250,204,21,0.2)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}