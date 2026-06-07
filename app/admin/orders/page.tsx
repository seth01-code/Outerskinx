"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface TrackingEvent {
  timestamp: string
  location: string
  description: string
  typeCode: string
}

interface Order {
  _id: string
  buyer: { businessName: string; email: string }
  items: { name: string; qty: number }[]
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  dhl?: {
    trackingNumber?: string
    shipmentId?: string
    labelUrl?: string
    estimatedDelivery?: string
    pickupConfirmationNumber?: string
  }
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "#facc15", bg: "rgba(250,204,21,0.08)",   label: "Pending" },
  confirmed:  { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  label: "Confirmed" },
  processing: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "Processing" },
  shipped:    { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   label: "Shipped" },
  delivered:  { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  label: "Delivered" },
  cancelled:  { color: "#f87171", bg: "rgba(248,113,113,0.08)", label: "Cancelled" },
}

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"]
const APPROVED_STATUSES = ["processing", "shipped", "delivered"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)
  const [creatingShipment, setCreatingShipment] = useState<string | null>(null)
  const [requestingPickup, setRequestingPickup] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<Record<string, { events: TrackingEvent[]; status: string; loading: boolean }>>({})
  const [shipmentErrors, setShipmentErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false) })
  }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...data.order } : o)))
    }
    setUpdating(null)
  }

  async function createShipment(orderId: string) {
    const withPickup = requestingPickup[orderId] ?? false
    setCreatingShipment(orderId)
    setShipmentErrors((p) => ({ ...p, [orderId]: "" }))
    try {
      const res = await fetch("/api/shipping/shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, requestPickup: withPickup }),
      })
      const data = await res.json()
      if (!res.ok) {
        setShipmentErrors((p) => ({ ...p, [orderId]: data.error || "Shipment creation failed" }))
        return
      }
      setOrders((prev) => prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              status: "shipped",
              dhl: {
                trackingNumber: data.trackingNumber,
                shipmentId: data.shipmentId,
                labelUrl: data.labelUrl,
                pickupConfirmationNumber: data.pickupConfirmationNumber,
              },
            }
          : o
      ))
    } catch {
      setShipmentErrors((p) => ({ ...p, [orderId]: "Something went wrong" }))
    } finally {
      setCreatingShipment(null)
    }
  }

  async function fetchTracking(trackingNumber: string, orderId: string) {
    setTrackingData((p) => ({ ...p, [orderId]: { events: [], status: "", loading: true } }))
    try {
      const res = await fetch(`/api/shipping/tracking?trackingNumber=${trackingNumber}`)
      const data = await res.json()
      setTrackingData((p) => ({
        ...p,
        [orderId]: { events: data.events || [], status: data.status || "", loading: false },
      }))
    } catch {
      setTrackingData((p) => ({ ...p, [orderId]: { events: [], status: "", loading: false } }))
    }
  }

  function downloadLabel(labelUrl: string, orderId: string) {
    const a = document.createElement("a")
    a.href = labelUrl
    a.download = `label-${orderId.slice(-8).toUpperCase()}.pdf`
    a.click()
  }

  const filtered = orders.filter((o) => filter === "all" || o.status === filter)

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <div className="section-label mb-2">Admin</div>
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
        >
          Orders
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {["all", ...STATUS_FLOW, "cancelled"].map((f) => {
          const s = STATUS_STYLES[f]
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
              style={{
                background: filter === f ? "var(--surface-elevated)" : "transparent",
                color: filter === f ? (s?.color || "var(--foreground)") : "var(--foreground-subtle)",
                border: filter === f ? "1px solid var(--border)" : "1px solid transparent",
                fontFamily: "var(--font-dm-mono)",
              }}
            >
              {s?.label || "All"}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl" style={{ border: "1px dashed var(--border)", color: "var(--foreground-muted)" }}>
          <p style={{ fontWeight: 300 }}>No {filter === "all" ? "" : filter} orders.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending
            const isExpanded = expanded === order._id
            const tracking = trackingData[order._id]
            const shipmentErr = shipmentErrors[order._id]
            const isApproved = APPROVED_STATUSES.includes(order.status)
            const isShipped = ["shipped", "delivered"].includes(order.status)
            const isCancelled = order.status === "cancelled"
            const isDelivered = order.status === "delivered"
            const withPickup = requestingPickup[order._id] ?? false

            return (
              <div
                key={order._id}
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {/* Summary row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : order._id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.72rem", color: "var(--foreground-subtle)" }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        {order.dhl?.trackingNumber && (
                          <span style={{
                            fontSize: "0.65rem", fontFamily: "var(--font-dm-mono)",
                            color: "var(--brand-green)", background: "rgba(34,197,94,0.08)",
                            padding: "2px 7px", borderRadius: 6,
                          }}>
                            DHL {order.dhl.trackingNumber}
                          </span>
                        )}
                        {order.dhl?.pickupConfirmationNumber && (
                          <span style={{
                            fontSize: "0.65rem", fontFamily: "var(--font-dm-mono)",
                            color: "#60a5fa", background: "rgba(96,165,250,0.08)",
                            padding: "2px 7px", borderRadius: 6,
                          }}>
                            Pickup confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {order.buyer?.businessName || order.buyer?.email}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                        {order.items.length} products ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "1.1rem", color: "var(--brand-green)", letterSpacing: "-0.03em" }}>
                      ₦{order.total.toLocaleString()}
                    </p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      className="transition-transform"
                      style={{ color: "var(--foreground-subtle)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 space-y-5" style={{ borderTop: "1px solid var(--border)" }}>

                    {/* ── Action buttons ── */}
                    {!isCancelled && !isDelivered && (
                      <div
                        className="flex flex-wrap items-center gap-2 p-3 rounded-xl"
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                      >
                        {/* Approve */}
                        {(order.status === "pending" || order.status === "confirmed") && (
                          <button
                            onClick={() => updateStatus(order._id, "processing")}
                            disabled={updating === order._id}
                            style={{
                              padding: "7px 16px", borderRadius: 8, border: "none",
                              background: "var(--brand-green)", color: "#000",
                              fontFamily: "var(--font-dm-mono)", fontSize: "0.78rem", fontWeight: 700,
                              cursor: updating === order._id ? "not-allowed" : "pointer",
                              opacity: updating === order._id ? 0.6 : 1,
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {updating === order._id ? "Approving…" : "Approve order"}
                          </button>
                        )}

                        {/* Create DHL shipment — with pickup toggle */}
                        {order.status === "processing" && !order.dhl?.trackingNumber && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => createShipment(order._id)}
                              disabled={creatingShipment === order._id}
                              style={{
                                padding: "7px 16px", borderRadius: 8, border: "none",
                                background: "#1a6bff", color: "#fff",
                                fontFamily: "var(--font-dm-mono)", fontSize: "0.78rem", fontWeight: 600,
                                cursor: creatingShipment === order._id ? "not-allowed" : "pointer",
                                opacity: creatingShipment === order._id ? 0.6 : 1,
                                display: "flex", alignItems: "center", gap: 6,
                              }}
                            >
                              {creatingShipment === order._id ? (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    style={{ animation: "spin 1s linear infinite" }}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
                                  </svg>
                                  {withPickup ? "Creating shipment + pickup…" : "Creating shipment…"}
                                </>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                  Create DHL shipment
                                </>
                              )}
                            </button>

                            {/* Pickup toggle */}
                            <label
                              className="flex items-center gap-1.5 cursor-pointer select-none"
                              style={{ fontSize: "0.72rem", fontFamily: "var(--font-dm-mono)", color: "var(--foreground-subtle)" }}
                            >
                              <div
                                onClick={() =>
                                  setRequestingPickup((p) => ({ ...p, [order._id]: !p[order._id] }))
                                }
                                style={{
                                  width: 28, height: 16, borderRadius: 8,
                                  background: withPickup ? "#1a6bff" : "var(--border)",
                                  position: "relative", transition: "background 0.2s",
                                  cursor: "pointer", flexShrink: 0,
                                }}
                              >
                                <span style={{
                                  position: "absolute", top: 2,
                                  left: withPickup ? 14 : 2,
                                  width: 12, height: 12, borderRadius: "50%",
                                  background: "#fff", transition: "left 0.2s",
                                }} />
                              </div>
                              Request pickup
                            </label>
                          </div>
                        )}

                        {/* Mark delivered */}
                        {order.status === "shipped" && (
                          <button
                            onClick={() => updateStatus(order._id, "delivered")}
                            disabled={updating === order._id}
                            style={{
                              padding: "7px 16px", borderRadius: 8,
                              border: "1px solid rgba(74,222,128,0.3)",
                              background: "rgba(74,222,128,0.08)", color: "var(--success)",
                              fontFamily: "var(--font-dm-mono)", fontSize: "0.78rem", fontWeight: 600,
                              cursor: updating === order._id ? "not-allowed" : "pointer",
                              opacity: updating === order._id ? 0.6 : 1,
                            }}
                          >
                            {updating === order._id ? "Updating…" : "Mark as delivered"}
                          </button>
                        )}

                        {/* Cancel */}
                        {!isApproved && (
                          <button
                            onClick={() => updateStatus(order._id, "cancelled")}
                            disabled={updating === order._id}
                            style={{
                              padding: "7px 14px", borderRadius: 8,
                              border: "1px solid rgba(248,113,113,0.2)",
                              background: "var(--danger-bg)", color: "var(--danger)",
                              fontFamily: "var(--font-dm-mono)", fontSize: "0.78rem",
                              cursor: updating === order._id ? "not-allowed" : "pointer",
                              opacity: updating === order._id ? 0.6 : 1,
                              marginLeft: "auto",
                            }}
                          >
                            Cancel order
                          </button>
                        )}
                      </div>
                    )}

                    {/* State notices */}
                    {isCancelled && (
                      <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.15)" }}>
                        This order has been cancelled.
                      </div>
                    )}
                    {isDelivered && (
                      <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                        style={{ background: "rgba(74,222,128,0.06)", color: "var(--success)", border: "1px solid rgba(74,222,128,0.2)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Order delivered.
                      </div>
                    )}

                    {/* ── DHL section ── */}
                    {(isShipped || order.dhl?.trackingNumber) && (
                      <div
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="section-label">DHL Shipment</p>
                          <span style={{
                            fontSize: "0.68rem", fontFamily: "var(--font-dm-mono)",
                            color: "var(--success)", background: "rgba(34,197,94,0.08)",
                            padding: "3px 8px", borderRadius: 6,
                            border: "1px solid rgba(34,197,94,0.2)",
                          }}>
                            ✓ Shipment created
                          </span>
                        </div>

                        {shipmentErr && (
                          <div className="px-3 py-2 rounded-lg text-xs"
                            style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                            {shipmentErr}
                          </div>
                        )}

                        {/* Tracking number + pickup confirmation */}
                        <div className="grid gap-3" style={{ gridTemplateColumns: order.dhl?.pickupConfirmationNumber ? "1fr 1fr" : "1fr" }}>
                          <div>
                            <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Tracking number
                            </p>
                            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--brand-green)", fontWeight: 600 }}>
                              {order.dhl?.trackingNumber}
                            </p>
                          </div>
                          {order.dhl?.pickupConfirmationNumber && (
                            <div>
                              <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Pickup confirmation
                              </p>
                              <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "#60a5fa", fontWeight: 600 }}>
                                {order.dhl.pickupConfirmationNumber}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {order.dhl?.labelUrl && (
                            <button
                              onClick={() => downloadLabel(order.dhl!.labelUrl!, order._id)}
                              style={{
                                padding: "6px 12px", borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--surface)", color: "var(--foreground-muted)",
                                fontFamily: "var(--font-dm-mono)", fontSize: "0.72rem",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                              </svg>
                              Download label
                            </button>
                          )}
                          <button
                            onClick={() => fetchTracking(order.dhl!.trackingNumber!, order._id)}
                            disabled={tracking?.loading}
                            style={{
                              padding: "6px 12px", borderRadius: 8,
                              border: "1px solid var(--border-accent)",
                              background: "transparent", color: "var(--brand-green)",
                              fontFamily: "var(--font-dm-mono)", fontSize: "0.72rem",
                              cursor: tracking?.loading ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", gap: 5,
                            }}
                          >
                            {tracking?.loading ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                style={{ animation: "spin 1s linear infinite" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                              </svg>
                            )}
                            Refresh tracking
                          </button>
                        </div>

                        {/* Tracking events */}
                        {tracking && !tracking.loading && tracking.events.length > 0 && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                            <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                              <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-dm-mono)", color: "var(--foreground-subtle)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Tracking events
                              </p>
                            </div>
                            <div className="divide-y max-h-52 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                              {tracking.events.map((ev, i) => (
                                <div key={i} className="px-3 py-2.5 flex items-start gap-3">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                    style={{ background: i === 0 ? "var(--brand-green)" : "var(--foreground-subtle)" }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p style={{ fontSize: "0.75rem", color: "var(--foreground)", fontWeight: i === 0 ? 500 : 400 }}>
                                      {ev.description}
                                    </p>
                                    <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", marginTop: 2 }}>
                                      {ev.location && `${ev.location} · `}
                                      {new Date(ev.timestamp).toLocaleString("en-GB", {
                                        day: "numeric", month: "short",
                                        hour: "2-digit", minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tracking && !tracking.loading && tracking.events.length === 0 && (
                          <p style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                            No tracking events yet. Check back after pickup.
                          </p>
                        )}
                      </div>
                    )}

                    <Link
                      href={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--brand-green)", fontFamily: "var(--font-dm-mono)" }}
                    >
                      View full order
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}