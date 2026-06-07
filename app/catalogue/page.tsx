"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

interface Brand { _id: string; name: string; slug: string }
interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  images: string[]
  retailPrice: number
  salePrice?: number
  stock: number
  inStock: boolean
  categories: string[]
  brand: { _id: string; name: string; slug: string }
  wholesalePricing: { tier: string; moq: number; price: number }[]
}
interface Filters { brands: Brand[]; categories: string[] }

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<Filters>({ brands: [], categories: [] })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch("/api/products/filters")
      .then((r) => r.json())
      .then((d) => setFilters(d))
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (selectedBrand) params.set("brand", selectedBrand)
    if (selectedCategory) params.set("category", selectedCategory)
    params.set("page", String(page))

    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [search, selectedBrand, selectedCategory, page])

  useEffect(() => { setPage(1) }, [search, selectedBrand, selectedCategory])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  function clearFilters() {
    setSearch("")
    setSelectedBrand("")
    setSelectedCategory("")
    setPage(1)
  }

  const hasFilters = search || selectedBrand || selectedCategory

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Top bar */}
      <div
  className="px-2 md:px-8 py-4 flex items-center justify-between gap-4 relative top-0"
  style={{
    background: "transparent",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid var(--border)",
  }}
>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center gap-2 text-sm btn-ghost px-3 py-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Filters
          </button>

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--foreground-subtle)",
            }}
          >
            {loading ? "Loading..." : `${total} products`}
          </span>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--danger)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "var(--foreground-subtle)" }}
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 py-2"
          />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "block" : "hidden"} md:block w-56 shrink-0 py-8 px-5 space-y-8`}
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {/* Brands */}
          <div>
            <p className="section-label mb-4">Brand</p>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedBrand("")}
                className={`filter-btn ${!selectedBrand ? "active" : ""}`}
              >
                All brands
              </button>
              {filters.brands.map((b) => (
                <button
                  key={b._id}
                  onClick={() => setSelectedBrand(b._id)}
                  className={`filter-btn ${selectedBrand === b._id ? "active" : ""}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="section-label mb-4">Category</p>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedCategory("")}
                className={`filter-btn ${!selectedCategory ? "active" : ""}`}
              >
                All categories
              </button>
              {filters.categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`filter-btn ${selectedCategory === c ? "active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1 px-5 md:px-8 py-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton h-72 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32" style={{ color: "var(--foreground-muted)" }}>
              <p style={{ fontWeight: 300 }}>
                No products found.{" "}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    style={{ color: "var(--brand-green)", textDecoration: "underline" }}
                  >
                    Clear filters
                  </button>
                )}
              </p>
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

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--foreground-subtle)",
                    }}
                  >
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
        </main>
      </div>
    </div>
  )
}