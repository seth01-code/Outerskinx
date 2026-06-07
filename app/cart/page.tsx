"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface CartItem {
  _id: string
  sku: string
  name: string
  image: string
  retailPrice: number
  wholesalePricing: { tier: string; moq: number; price: number }[]
  qty: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("osx_cart") || "[]")
    setItems(cart)
    setLoaded(true)
  }, [])

  function save(updated: CartItem[]) {
    setItems(updated)
    localStorage.setItem("osx_cart", JSON.stringify(updated))
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return
    save(items.map((i) => (i._id === id ? { ...i, qty } : i)))
  }

  function removeItem(id: string) {
    save(items.filter((i) => i._id !== id))
  }

  function clearCart() { save([]) }

  const subtotal = items.reduce((sum, i) => sum + i.retailPrice * i.qty, 0)
  const totalUnits = items.reduce((sum, i) => sum + i.qty, 0)

  if (!loaded) return null

  return (
    <div className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="section-label mb-2">Your order</div>
            <h1
              className="text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              Cart
            </h1>
            {items.length > 0 && (
              <p
                className="mt-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--foreground-subtle)",
                }}
              >
                {items.length} {items.length === 1 ? "product" : "products"} · {totalUnits} units
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs"
                style={{ color: "var(--foreground-subtle)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
              >
                Clear cart
              </button>
            )}
            <Link href="/catalogue" className="btn-ghost">
              Continue shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div
            className="text-center py-32 rounded-2xl"
            style={{ border: "1px dashed var(--border)" }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              className="mx-auto mb-4"
              style={{ color: "var(--foreground-subtle)" }}
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ color: "var(--foreground-muted)", fontWeight: 300, marginBottom: "16px" }}>
              Your cart is empty.
            </p>
            <Link
              href="/catalogue"
              style={{ color: "var(--brand-green)", fontSize: "0.875rem", textDecoration: "underline" }}
            >
              Browse catalogue
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">

            {/* Items */}
            <div className="md:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ color: "var(--foreground-subtle)", fontSize: "0.7rem" }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className="text-sm line-clamp-2"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            color: "var(--foreground-subtle)",
                            marginTop: "2px",
                          }}
                        >
                          {item.sku}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-xs shrink-0 transition-colors"
                        style={{ color: "var(--foreground-subtle)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="qty-stepper">
                        <button onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateQty(item._id, parseInt(e.target.value) || 1)}
                        />
                        <button onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                      </div>
                      <div className="text-right">
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 500,
                            color: "var(--brand-green)",
                            fontSize: "0.9rem",
                          }}
                        >
                          ₦{(item.retailPrice * item.qty).toLocaleString()}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            color: "var(--foreground-subtle)",
                          }}
                        >
                          ₦{item.retailPrice.toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    {/* Wholesale hints */}
                    {item.wholesalePricing?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.wholesalePricing.map((t) => (
                          <span
                            key={t.tier}
                            className="badge"
                            style={{
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border)",
                              color: "var(--foreground-subtle)",
                            }}
                          >
                            {t.tier}: ₦{t.price.toLocaleString()} × {t.moq}+
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="md:col-span-1">
              <div
                className="rounded-xl p-5 sticky top-24"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-accent)",
                  boxShadow: "0 0 30px rgba(34,197,94,0.06)",
                }}
              >
                <p
                  className="mb-5"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Order summary
                </p>

                <div className="space-y-3 mb-5">
                  {[
                    { label: "Products", value: items.length },
                    { label: "Total units", value: totalUnits },
                    { label: "Shipping", value: "Calculated at checkout" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>{label}</span>
                      <span
                        style={{
                          color: typeof value === "string" ? "var(--foreground-subtle)" : "var(--foreground)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="pt-4 mb-5"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex justify-between items-baseline">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem" }}>
                      Subtotal
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "1.4rem",
                        color: "var(--brand-green)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link href="/checkout" className="btn-primary w-full justify-center mb-3">
                  Proceed to checkout
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Link>

                <Link
                  href="/catalogue/bulk-order"
                  className="block w-full text-center py-2 text-sm transition-colors"
                  style={{ color: "var(--foreground-subtle)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
                >
                  + Add via bulk order
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}