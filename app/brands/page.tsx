"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

interface Brand {
  _id: string
  name: string
  slug: string
  logo?: string
  country?: string
  description?: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => {
        setBrands(d.brands || [])
        setLoading(false)
      })
  }, [])

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen px-5 md:px-8 py-12" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto animate-fadeUp">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="section-label mb-3">Our Partners</div>
            <h1
              className="text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              Brands
            </h1>
            <p style={{ color: "var(--foreground-muted)", marginTop: "8px", fontWeight: 300 }}>
              {loading ? "Loading..." : `${brands.length} brands available`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "var(--foreground-subtle)" }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="accent-line" />
          <span style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)" }}>
            {loading ? "—" : `${filtered.length} results`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-32"
            style={{ color: "var(--foreground-muted)" }}
          >
            <p
              className="text-5xl mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--foreground-subtle)" }}
            >
              —
            </p>
            <p style={{ fontWeight: 300 }}>No brands match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((b) => (
              <Link
                key={b._id}
                href={`/brands/${b.slug}`}
                className="group card flex flex-col items-center text-center gap-4 p-6"
                style={{ background: "var(--surface)" }}
              >
                {/* Logo circle */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {b.logo ? (
                    <Image
                      src={b.logo}
                      alt={b.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "1.4rem",
                        color: "var(--brand-green)",
                      }}
                    >
                      {b.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <p
                    className="text-sm transition-colors"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {b.name}
                  </p>
                  {b.country && (
                    <p
                      className="mt-1"
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {b.country}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div
                  className="w-full flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ marginTop: "auto" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--brand-green)" }}>
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}