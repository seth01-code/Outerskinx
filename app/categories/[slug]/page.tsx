"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"

interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  images: string[]
  retailPrice: number
  inStock: boolean
  brand: { _id: string; name: string; slug: string }
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const category = decodeURIComponent(slug)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?category=${encodeURIComponent(category)}&page=${page}&limit=24`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || [])
        setTotal(d.total || 0)
        setPages(d.pages || 1)
        setLoading(false)
      })
  }, [category, page])

  return (
    <div className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8">
          <Link href="/catalogue">Catalogue</Link>
          <span className="sep">/</span>
          <span className="current">{category}</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="section-label mb-2">Category</div>
            <h1
              className="text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              {category}
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--foreground-subtle)",
              }}
            >
              {loading ? "..." : `${total} products`}
            </p>
          </div>
          <Link href="/catalogue" className="btn-ghost">
            All categories
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--foreground-muted)" }}>
            <p style={{ fontWeight: 300 }}>No products found in this category.</p>
          </div>
        ) : (
          <>
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
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--foreground-subtle)",
                        marginBottom: "4px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.brand?.name}
                    </p>
                    <p
                      className="text-sm leading-snug line-clamp-2 mb-3"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em" }}
                    >
                      {p.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p
                        className="text-sm"
                        style={{ color: "var(--brand-green)", fontFamily: "var(--font-mono)", fontWeight: 500 }}
                      >
                        ₦{p.retailPrice.toLocaleString()}
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}>
                        {p.sku}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--foreground-subtle)" }}>
                  {page} / {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}