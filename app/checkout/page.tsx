/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface CartItem {
  _id: string
  sku: string
  name: string
  image: string
  retailPrice: number
  wholesalePricing: { tier: string; moq: number; price: number }[]
  qty: number
  weightG?: number
  hsCode?: string
  customsDescription?: string
}

interface Address {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface DhlRate {
  productName: string
  productCode: string
  price: number
  currency: string
  estimatedDelivery: string | null
  priceBreakdown: { name: string; price: number }[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [address, setAddress] = useState<Address>({
    street: "", city: "", state: "", country: "Nigeria", postalCode: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer" | "net_terms">("paystack")
  const [poNumber, setPoNumber] = useState("")
  const [notes, setNotes] = useState("")

  // ── DHL rates state ────────────────────────────────────────────────────
  const [rates, setRates] = useState<DhlRate[]>([])
  const [selectedRate, setSelectedRate] = useState<DhlRate | null>(null)
  const [fetchingRates, setFetchingRates] = useState(false)
  const [ratesFallback, setRatesFallback] = useState(false)
  const [ratesFetched, setRatesFetched] = useState(false)
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("osx_cart") || "[]")
    if (cart.length === 0) { router.push("/cart"); return }
    setItems(cart)
    setLoaded(true)
  }, [router])

  // ── Auto-fetch rates when address is sufficiently filled ───────────────
  useEffect(() => {
    const { street, city, country } = address
    if (!street || !city || !country || items.length === 0) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setFetchingRates(true)
      setRatesFetched(false)
      setRates([])
      setSelectedRate(null)
      setRatesFallback(false)
      setExpandedBreakdown(null)
      try {
        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveryAddress: address, items }),
        })
        const data = await res.json()
        if (data.fallback) {
          setRatesFallback(true)
        } else {
          setRates(data.rates || [])
          if (data.rates?.length === 1) setSelectedRate(data.rates[0])
        }
      } catch {
        setRatesFallback(true)
      } finally {
        setFetchingRates(false)
        setRatesFetched(true)
      }
    }, 800)
  }, [address, items])

  function handleAddress(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const subtotal = items.reduce((sum, i) => sum + i.retailPrice * i.qty, 0)
  const shippingCost = selectedRate?.price ?? 0
  const total = subtotal + shippingCost

  function formatDelivery(dateStr: string | null) {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString("en-NG", {
        weekday: "short", day: "numeric", month: "short",
      })
    } catch { return null }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (rates.length > 0 && !selectedRate) {
      setError("Please select a shipping option.")
      return
    }

    setSubmitting(true)
    try {
      const orderItems = items.map((i) => ({
        product: i._id,
        sku: i.sku,
        name: i.name,
        qty: i.qty,
        unitPrice: i.retailPrice,
        subtotal: i.retailPrice * i.qty,
        weightG: i.weightG,
        hsCode: i.hsCode,
        customsDescription: i.customsDescription,
      }))

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          deliveryAddress: address,
          paymentMethod,
          poNumber: poNumber || undefined,
          notes: notes || undefined,
          shipping: selectedRate
            ? {
                productCode: selectedRate.productCode,
                productName: selectedRate.productName,
                price: selectedRate.price,
                currency: selectedRate.currency,
                estimatedDelivery: selectedRate.estimatedDelivery,
              }
            : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); return }
      localStorage.removeItem("osx_cart")
      router.push(`/orders/${data.orderId}`)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) return null

  const paymentOptions = [
    { value: "paystack", label: "Pay now", description: "Card, bank transfer, USSD via Paystack", icon: "⚡" },
    { value: "bank_transfer", label: "Bank transfer", description: "We'll send you our account details", icon: "🏦" },
    { value: "net_terms", label: "Net terms", description: "Pay within agreed credit period", icon: "📄" },
  ]

  const addressComplete = !!(address.street && address.city && address.country)

  return (
    <div className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-10">
          <div className="section-label mb-2">Finalise your order</div>
          <h1
            className="text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.04em" }}
          >
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8">

            {/* ── Left ─────────────────────────────────────────────────── */}
            <div className="md:col-span-2 space-y-10">

              {/* Delivery address */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="accent-line" />
                  <p className="section-label">Delivery address</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
                      Street address
                    </label>
                    <input name="street" value={address.street} onChange={handleAddress} required className="input-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>City</label>
                      <input name="city" value={address.city} onChange={handleAddress} required className="input-base" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>State</label>
                      <input name="state" value={address.state} onChange={handleAddress} className="input-base" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Country</label>
                      <input name="country" value={address.country} onChange={handleAddress} required className="input-base" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Postal code</label>
                      <input name="postalCode" value={address.postalCode} onChange={handleAddress} className="input-base" />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Shipping options ──────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="accent-line" />
                  <p className="section-label">Shipping</p>
                  {fetchingRates && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      style={{ color: "var(--foreground-subtle)", animation: "spin 1s linear infinite", marginLeft: 4 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                  )}
                </div>

                {!addressComplete ? (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      border: "1px dashed var(--border)",
                      color: "var(--foreground-subtle)",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "0.78rem",
                    }}
                  >
                    Fill in your delivery address above to see shipping options.
                  </div>
                ) : fetchingRates ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                  </div>
                ) : ratesFallback ? (
                  <div
                    className="px-4 py-3 rounded-xl text-sm flex items-start gap-3"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }}>
                      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 2, color: "var(--foreground)" }}>Live rates unavailable</p>
                      <p style={{ fontSize: "0.78rem", fontWeight: 300 }}>
                        Shipping cost will be calculated and confirmed after your order is placed.
                      </p>
                    </div>
                  </div>
                ) : ratesFetched && rates.length === 0 ? (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
                  >
                    No shipping options found for this address. Shipping will be confirmed manually.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rates.map((rate) => {
                      const selected = selectedRate?.productCode === rate.productCode
                      const delivery = formatDelivery(rate.estimatedDelivery)
                      const isExpanded = expandedBreakdown === rate.productCode

                      return (
                        <div key={rate.productCode}>
                          <label
                            className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                            style={{
                              border: `1px solid ${selected ? "var(--border-accent)" : "var(--border)"}`,
                              background: selected ? "var(--brand-green-subtle)" : "var(--surface)",
                              boxShadow: selected ? "0 0 20px rgba(34,197,94,0.06)" : "none",
                              borderBottomLeftRadius: isExpanded ? 0 : undefined,
                              borderBottomRightRadius: isExpanded ? 0 : undefined,
                            }}
                          >
                            <input
                              type="radio"
                              name="shippingRate"
                              checked={selected}
                              onChange={() => setSelectedRate(rate)}
                              style={{ accentColor: "var(--brand-green)", marginTop: 3 }}
                            />
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
                                {rate.productName}
                              </p>
                              {delivery && (
                                <p style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", fontWeight: 300, marginTop: 2 }}>
                                  Est. delivery: {delivery}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>
                                {rate.currency} {rate.price.toLocaleString()}
                              </p>
                              <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", marginTop: 1 }}>
                                via DHL
                              </p>
                            </div>
                          </label>

                          {/* Price breakdown toggle */}
                          {rate.priceBreakdown?.length > 0 && (
                            <div
                              style={{
                                border: `1px solid ${selected ? "var(--border-accent)" : "var(--border)"}`,
                                borderTop: "none",
                                borderBottomLeftRadius: "0.75rem",
                                borderBottomRightRadius: "0.75rem",
                                overflow: "hidden",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedBreakdown(isExpanded ? null : rate.productCode)}
                                className="w-full flex items-center justify-between px-4 py-2 transition-colors"
                                style={{
                                  background: "transparent",
                                  color: "var(--foreground-subtle)",
                                  fontSize: "0.72rem",
                                  fontFamily: "var(--font-dm-mono)",
                                  cursor: "pointer",
                                }}
                              >
                                <span>{isExpanded ? "Hide" : "See"} price breakdown</span>
                                <svg
                                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                                  style={{
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                  }}
                                >
                                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              </button>

                              {isExpanded && (
                                <div
                                  className="px-4 pb-3 space-y-1.5"
                                  style={{ borderTop: "1px solid var(--border)" }}
                                >
                                  {rate.priceBreakdown.map((line, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                      <span style={{
                                        fontSize: "0.75rem",
                                        color: "var(--foreground-muted)",
                                        fontWeight: 300,
                                        paddingTop: i === 0 ? "0.5rem" : 0,
                                      }}>
                                        {line.name}
                                      </span>
                                      <span style={{
                                        fontSize: "0.75rem",
                                        fontFamily: "var(--font-dm-mono)",
                                        color: "var(--foreground)",
                                        paddingTop: i === 0 ? "0.5rem" : 0,
                                      }}>
                                        {rate.currency} {line.price.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                  <div
                                    className="flex justify-between items-center pt-2"
                                    style={{ borderTop: "1px dashed var(--border)" }}
                                  >
                                    <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", fontWeight: 500 }}>
                                      Total (incl. VAT)
                                    </span>
                                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-dm-mono)", fontWeight: 600, color: "var(--foreground)" }}>
                                      {rate.currency} {rate.price.toLocaleString()}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", paddingTop: 2 }}>
                                    Includes 7.5% VAT. Fuel surcharge varies monthly.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Payment method */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="accent-line" />
                  <p className="section-label">Payment method</p>
                </div>
                <div className="space-y-3">
                  {paymentOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${paymentMethod === opt.value ? "var(--border-accent)" : "var(--border)"}`,
                        background: paymentMethod === opt.value ? "var(--brand-green-subtle)" : "var(--surface)",
                        boxShadow: paymentMethod === opt.value ? "0 0 20px rgba(34,197,94,0.06)" : "none",
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value as typeof paymentMethod)}
                        style={{ accentColor: "var(--brand-green)", marginTop: 3 }}
                      />
                      <div className="flex-1">
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
                          {opt.icon} {opt.label}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontWeight: 300, marginTop: 2 }}>
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Additional details */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="accent-line" />
                  <p className="section-label">Additional details</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
                      PO number <span style={{ color: "var(--foreground-subtle)" }}>(optional)</span>
                    </label>
                    <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
                      Order notes <span style={{ color: "var(--foreground-subtle)" }}>(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special instructions..."
                      className="input-base resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right: summary ────────────────────────────────────────── */}
            <div className="md:col-span-1">
              <div
                className="rounded-xl p-5 sticky top-24"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-accent)",
                  boxShadow: "0 0 30px rgba(34,197,94,0.06)",
                }}
              >
                <p className="mb-5" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em" }}>
                  Order summary
                </p>

                {/* Item list */}
                <div className="space-y-2 mb-5 max-h-44 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {items.map((item) => (
                    <div key={item._id} className="flex justify-between gap-2 text-xs">
                      <span className="line-clamp-1 flex-1" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
                        {item.name}
                      </span>
                      <span style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                        {item.qty}×
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2 mb-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Subtotal</span>
                    <span style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Shipping</span>
                    <span style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      {fetchingRates ? (
                        <span style={{ color: "var(--foreground-subtle)" }}>Calculating…</span>
                      ) : selectedRate ? (
                        `${selectedRate.currency} ${selectedRate.price.toLocaleString()}`
                      ) : (
                        <span style={{ color: "var(--foreground-subtle)" }}>TBD</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem" }}>Total</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", color: "var(--brand-green)", letterSpacing: "-0.04em" }}>
                      ₦{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {error && (
                  <div
                    className="px-3 py-2.5 rounded-lg mb-4 text-xs"
                    style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.2)" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || fetchingRates}
                  className="btn-primary w-full justify-center"
                >
                  {submitting ? "Placing order…" : "Place order"}
                  {!submitting && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {fetchingRates && (
                  <p style={{ fontSize: "0.68rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", textAlign: "center", marginTop: 8 }}>
                    Fetching shipping rates…
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}