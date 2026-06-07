"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"

interface Brand {
  _id: string
  name: string
  slug: string
  logo?: string
  country?: string
  description?: string
}

interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  images: string[]
  retailPrice: number
  inStock: boolean
  categories: string[]
}

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const brandsRes = await fetch("/api/brands")
      const brandsData = await brandsRes.json()
      const found = (brandsData.brands || []).find((b: Brand) => b.slug === slug)

      if (!found) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setBrand(found)

      const productsRes = await fetch(`/api/products?brand=${found._id}&limit=48`)
      const productsData = await productsRes.json()
      setProducts(productsData.products || [])
      setTotal(productsData.total || 0)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen px-5 md:px-8 py-12" style={{ background: "var(--background)" }}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="skeleton h-28 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !brand) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center space-y-4">
          <p
            className="text-6xl mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--foreground-subtle)",
            }}
          >
            404
          </p>
          <p style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>Brand not found.</p>
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "var(--brand-green)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Back to brands
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
          <Link href="/brands">Brands</Link>
          <span className="sep">/</span>
          <span className="current">{brand.name}</span>
        </nav>

        {/* Brand header */}
        <div
          className="flex items-center gap-6 mb-10 pb-10"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {brand.logo ? (
              <Image src={brand.logo} alt={brand.name} width={80} height={80} className="object-contain" />
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "2rem",
                  color: "var(--brand-green)",
                }}
              >
                {brand.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h1
              className="text-3xl md:text-4xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {brand.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              {brand.country && (
                <span
                  className="badge"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground-subtle)",
                  }}
                >
                  {brand.country}
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--brand-green)",
                }}
              >
                {total} products
              </span>
            </div>
            {brand.description && (
              <p
                className="mt-3 max-w-xl"
                style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7, fontSize: "0.9rem" }}
              >
                {brand.description}
              </p>
            )}
          </div>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div
            className="text-center py-32"
            style={{ color: "var(--foreground-muted)" }}
          >
            <p style={{ fontWeight: 300 }}>No products found for this brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p._id}
                href={`/catalogue/${p.slug}`}
                className="group card overflow-hidden"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="relative aspect-square product-card-img"
                  style={{ background: "var(--surface-raised)" }}
                >
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "var(--foreground-subtle)", fontSize: "0.75rem" }}
                    >
                      No image
                    </div>
                  )}
                  {!p.inStock && (
                    <span
                      className="absolute top-2 left-2 badge"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--danger)",
                        border: "1px solid rgba(248,113,113,0.2)",
                      }}
                    >
                      Out of stock
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p
                    className="text-sm leading-snug line-clamp-2 mb-3"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em" }}
                  >
                    {p.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--brand-green)", fontFamily: "var(--font-mono)" }}
                    >
                      ₦{p.retailPrice.toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.sku}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}