"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"

interface WholesaleTier {
  tier: "retailer" | "distributor" | "premium"
  moq: number
  price: number
}

interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  images: string[]
  retailPrice: number
  salePrice?: number
  stock: number
  inStock: boolean
  weightG?: number
  categories: string[]
  tags: string[]
  wholesalePricing: WholesaleTier[]
  brand: { _id: string; name: string; slug: string; country?: string }
}

const tierLabels: Record<string, string> = {
  retailer: "Retailer",
  distributor: "Distributor",
  premium: "Premium",
}

const tierColors: Record<string, { bg: string; color: string }> = {
  retailer: { bg: "rgba(96,165,250,0.08)", color: "#60a5fa" },
  distributor: { bg: "rgba(250,204,21,0.08)", color: "#facc15" },
  premium: { bg: "rgba(34,197,94,0.08)", color: "#22c55e" },
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (d) setProduct(d.product)
        setLoading(false)
      })
  }, [slug])

  async function addToCart() {
    if (!product) return
    setAdding(true)
    const cart = JSON.parse(localStorage.getItem("osx_cart") || "[]")
    const existing = cart.findIndex((i: { _id: string }) => i._id === product._id)
    if (existing >= 0) {
      cart[existing].qty += qty
    } else {
      cart.push({
        _id: product._id,
        sku: product.sku,
        name: product.name,
        image: product.images[0] || "",
        retailPrice: product.retailPrice,
        wholesalePricing: product.wholesalePricing,
        qty,
      })
    }
    localStorage.setItem("osx_cart", JSON.stringify(cart))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen px-5 md:px-8 py-12" style={{ background: "var(--background)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-5">
            <div className="skeleton h-8 rounded-lg w-3/4" />
            <div className="skeleton h-5 rounded-lg w-1/2" />
            <div className="skeleton h-28 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--background)" }}>
        <div className="text-center space-y-4">
          <p
            className="text-6xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--foreground-subtle)" }}
          >
            404
          </p>
          <p style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Product not found.</p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "var(--brand-green)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Back to catalogue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8">
          <Link href="/catalogue">Catalogue</Link>
          <span className="sep">/</span>
          {product.brand && (
            <>
              <Link href={`/brands/${product.brand.slug}`}>{product.brand.name}</Link>
              <span className="sep">/</span>
            </>
          )}
          <span className="current">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12">

          {/* Images */}
          <div className="space-y-3">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {product.images[activeImage] ? (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: "var(--foreground-subtle)", fontSize: "0.875rem" }}
                >
                  No image
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2.5">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden transition-all"
                    style={{
                      border: `2px solid ${activeImage === i ? "var(--brand-green)" : "var(--border)"}`,
                      boxShadow: activeImage === i ? "0 0 12px var(--brand-green-glow)" : "none",
                    }}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="section-label hover:opacity-80 transition-opacity"
                >
                  {product.brand.name}
                </Link>
              )}
              <h1
                className="text-2xl md:text-3xl mt-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                {product.name}
              </h1>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--foreground-subtle)",
                  letterSpacing: "0.05em",
                }}
              >
                SKU: {product.sku}
              </p>
            </div>

            {product.shortDescription && (
              <p style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7, fontSize: "0.9rem" }}>
                {product.shortDescription}
              </p>
            )}

            {/* Stock badge */}
            <div>
              {product.inStock ? (
                <span
                  className="inline-flex items-center gap-2 badge"
                  style={{
                    background: "var(--success-bg)",
                    color: "var(--success)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    padding: "6px 14px",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--success)" }} />
                  In stock · {product.stock} units
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-2 badge"
                  style={{
                    background: "var(--danger-bg)",
                    color: "var(--danger)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    padding: "6px 14px",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} />
                  Out of stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "2rem",
                  color: "var(--brand-green)",
                  letterSpacing: "-0.04em",
                }}
              >
                ₦{product.retailPrice.toLocaleString()}
              </span>
              {product.salePrice && (
                <span
                  style={{
                    fontSize: "1rem",
                    color: "var(--foreground-subtle)",
                    textDecoration: "line-through",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ₦{product.salePrice.toLocaleString()}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}>
                retail
              </span>
            </div>

            {/* Wholesale pricing */}
            {product.wholesalePricing?.length > 0 && (
              <div>
                <p className="section-label mb-3">Wholesale pricing</p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>MOQ</th>
                        <th>Unit price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.wholesalePricing.map((t) => {
                        const colors = tierColors[t.tier] || { bg: "var(--surface-raised)", color: "var(--foreground-muted)" }
                        return (
                          <tr key={t.tier}>
                            <td>
                              <span
                                className="badge"
                                style={{ background: colors.bg, color: colors.color }}
                              >
                                {tierLabels[t.tier]}
                              </span>
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)", color: "var(--foreground-muted)" }}>
                              {t.moq} units
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 500,
                                color: "var(--foreground)",
                              }}
                            >
                              ₦{t.price.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add to cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="qty-stepper">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                />
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button
                onClick={addToCart}
                disabled={adding || !product.inStock}
                className="btn-primary flex-1"
                style={added ? { background: "var(--brand-green-dim)" } : {}}
              >
                {added ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Added to cart
                  </>
                ) : adding ? "Adding..." : "Add to cart"}
              </button>
            </div>

            {/* Meta */}
            <div
              className="pt-4 space-y-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {product.categories.length > 0 && (
                <p
                  style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}
                >
                  Categories:{" "}
                  <span style={{ color: "var(--foreground-muted)" }}>{product.categories.join(", ")}</span>
                </p>
              )}
              {product.weightG && (
                <p style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}>
                  Weight: <span style={{ color: "var(--foreground-muted)" }}>{product.weightG}g</span>
                </p>
              )}
              {product.brand?.country && (
                <p style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}>
                  Origin: <span style={{ color: "var(--foreground-muted)" }}>{product.brand.country}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full description */}
        {product.description && (
          <div
            className="mt-16 pt-10 max-w-2xl"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="section-label mb-5">Product description</p>
            <div
              className="prose-custom"
              style={{
                fontSize: "0.9rem",
                color: "var(--foreground-muted)",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  )
}