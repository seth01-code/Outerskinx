"use client"

import { useState, useRef, useEffect, useCallback } from "react"

type Brand = { _id: string; name: string; slug: string }

type Product = {
  _id: string
  sku: string
  name: string
  slug: string
  brand: Brand | null
  categories: string[]
  tags: string[]
  retailPrice: number
  salePrice?: number
  stock: number
  inStock: boolean
  isActive: boolean
  images: string[]
  shortDescription?: string
}

type ImportResults = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

type Filters = {
  brands: Brand[]
  categories: string[]
}

const PAGE_LIMIT = 24

export default function AdminProductsPage() {
  // ── Import state ──────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [importError, setImportError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Product list state ────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [listError, setListError] = useState("")

  // ── Filters ───────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({ brands: [], categories: [] })
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  // ── Edit modal ────────────────────────────────────────────────────────
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // ── Delete confirm ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Load filters once ─────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/products/filters")
      .then((r) => r.json())
      .then((d) => setFilters(d))
      .catch(() => {})
  }, [])

  // ── Fetch products ────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (p = 1) => {
      setLoadingProducts(true)
      setListError("")
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_LIMIT),
        })
        if (search) params.set("search", search)
        if (brandFilter) params.set("brand", brandFilter)
        if (categoryFilter) params.set("category", categoryFilter)

        const res = await fetch(`/api/admin/products?${params}`)
        const data = await res.json()
        if (!res.ok) { setListError(data.error || "Failed to load products"); return }
        setProducts(data.products)
        setTotal(data.total)
        setPages(data.pages)
        setPage(p)
      } catch {
        setListError("Something went wrong")
      } finally {
        setLoadingProducts(false)
      }
    },
    [search, brandFilter, categoryFilter]
  )

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

  // ── Import handler ────────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResults(null)
    setImportError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/products/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setImportError(data.error || "Import failed"); return }
      setImportResults(data.results)
      fetchProducts(1)
    } catch {
      setImportError("Something went wrong during import")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  // ── Edit handlers ─────────────────────────────────────────────────────
  function openEdit(p: Product) {
    setEditProduct(p)
    setEditForm({
      name: p.name,
      sku: p.sku,
      retailPrice: p.retailPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      inStock: p.inStock,
      isActive: p.isActive,
      shortDescription: p.shortDescription ?? "",
    })
    setSaveError("")
  }

  async function handleSave() {
    if (!editProduct) return
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch(`/api/admin/products/${editProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error || "Save failed"); return }
      setEditProduct(null)
      fetchProducts(page)
    } catch {
      setSaveError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, { method: "DELETE" })
      if (!res.ok) return
      setDeleteTarget(null)
      fetchProducts(page)
    } catch {
      //
    } finally {
      setDeleting(false)
    }
  }

  // ── Debounced search ──────────────────────────────────────────────────
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchProducts(1), 400)
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fadeUp">
      {/* Page header */}
      <div className="mb-8">
        <div className="section-label mb-2">Admin</div>
        <h1
          className="text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
        >
          Products
        </h1>
      </div>

      {/* ── Import card ─────────────────────────────────────────────── */}
      <div
        className="p-6 rounded-2xl mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="section-label mb-2">Import from Excel</p>
        <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>
          Upload the OuterSkinX product import template (.xlsx). New products will be created and existing SKUs
          updated. Brands must already exist before importing products.
        </p>

        <div
          className="relative flex flex-col items-center justify-center p-10 rounded-xl mb-4 transition-all cursor-pointer"
          style={{ border: "1px dashed var(--border)", background: "var(--surface-raised)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-green-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          {importing ? (
            <>
              <svg
                className="mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none"
                style={{ color: "var(--brand-green)", animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <p className="section-label">Importing...</p>
            </>
          ) : (
            <>
              <svg className="mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "var(--foreground-subtle)" }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm mb-1" style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>
                Click to upload or drag and drop
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                .xlsx or .xls files only
              </p>
            </>
          )}
        </div>

        {importError && (
          <div
            className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            {importError}
          </div>
        )}

        {importResults && (
          <div className="p-5 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-accent)" }}>
            <p className="section-label mb-4">Import complete</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Created", value: importResults.created, color: "var(--success)" },
                { label: "Updated", value: importResults.updated, color: "var(--info)" },
                { label: "Skipped", value: importResults.skipped, color: "var(--warning)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-syne)", fontWeight: 800, color, letterSpacing: "-0.03em" }}>
                    {value}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
            {importResults.errors.length > 0 && (
              <div className="rounded-xl p-4 max-h-40 overflow-y-auto" style={{ background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.15)" }}>
                <p className="section-label mb-2" style={{ color: "var(--danger)" }}>
                  Errors ({importResults.errors.length})
                </p>
                {importResults.errors.map((err, i) => (
                  <p key={i} className="text-xs mb-1" style={{ color: "var(--danger)", fontFamily: "var(--font-dm-mono)", fontWeight: 300 }}>
                    {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Product list ─────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div>
            <p className="section-label mb-0.5">All products</p>
            {!loadingProducts && (
              <p style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                {total} total
              </p>
            )}
          </div>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--foreground-subtle)" }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "0.8rem",
              }}
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <select
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); fetchProducts(1) }}
            className="text-sm rounded-lg px-3 py-1.5"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "0.78rem",
            }}
          >
            <option value="">All brands</option>
            {filters.brands.map((b) => (
              <option key={b._id} value={b.slug}>{b.name}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); fetchProducts(1) }}
            className="text-sm rounded-lg px-3 py-1.5"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "0.78rem",
            }}
          >
            <option value="">All categories</option>
            {filters.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(brandFilter || categoryFilter || search) && (
            <button
              onClick={() => { setSearch(""); setBrandFilter(""); setCategoryFilter("") }}
              className="text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--foreground-muted)",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        {listError ? (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            {listError}
          </div>
        ) : loadingProducts ? (
          <div className="flex items-center justify-center py-16" style={{ color: "var(--foreground-subtle)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--foreground-subtle)" }}>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.8rem" }}>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Product", "SKU", "Brand", "Price", "Stock", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-6 pb-3 text-left"
                      style={{
                        fontSize: "0.68rem",
                        fontFamily: "var(--font-dm-mono)",
                        color: "var(--foreground-subtle)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: i < products.length - 1 ? "1px solid var(--border)" : undefined,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Product */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            width={36}
                            height={36}
                            style={{ borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                              background: "var(--surface-raised)", border: "1px solid var(--border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--foreground-subtle)" }}>
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}
                          </p>
                          {p.categories?.[0] && (
                            <p style={{ fontSize: "0.7rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                              {p.categories[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-3">
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.75rem", color: "var(--foreground-muted)" }}>
                        {p.sku}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="px-6 py-3">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        {typeof p.brand === "object" && p.brand !== null ? p.brand.name : "—"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          ₦{p.retailPrice?.toLocaleString()}
                        </p>
                        {p.salePrice && (
                          <p style={{ fontSize: "0.7rem", color: "var(--success)", fontFamily: "var(--font-dm-mono)" }}>
                            ₦{p.salePrice?.toLocaleString()} sale
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-3">
                      <span
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.78rem",
                          color: p.stock === 0 ? "var(--danger)" : p.stock < 5 ? "var(--warning)" : "var(--foreground-muted)",
                        }}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: "0.68rem",
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 500,
                          background: p.isActive ? "rgba(34,197,94,0.08)" : "rgba(107,114,128,0.1)",
                          color: p.isActive ? "var(--success)" : "var(--foreground-subtle)",
                          border: `1px solid ${p.isActive ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.15)"}`,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: "0.72rem",
                            fontFamily: "var(--font-dm-mono)",
                            color: "var(--foreground-muted)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--brand-green-border)"
                            e.currentTarget.style.color = "var(--foreground)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)"
                            e.currentTarget.style.color = "var(--foreground-muted)"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          style={{
                            background: "transparent",
                            border: "1px solid transparent",
                            borderRadius: 8,
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: "var(--foreground-subtle)",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--danger)"
                            e.currentTarget.style.background = "var(--danger-bg)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--foreground-subtle)"
                            e.currentTarget.style.background = "transparent"
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchProducts(page - 1)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: page <= 1 ? "var(--foreground-subtle)" : "var(--foreground-muted)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.75rem",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => fetchProducts(page + 1)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: page >= pages ? "var(--foreground-subtle)" : "var(--foreground-muted)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.75rem",
                  cursor: page >= pages ? "not-allowed" : "pointer",
                  opacity: page >= pages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Template info ─────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl flex items-start gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--info-bg)", border: "1px solid rgba(96,165,250,0.2)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--info)" }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Using the import template</p>
          <p style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>
            Use the OuterSkinX product import template with columns: sku, name, brand, categories, tags,
            short_description, description, retail_price, sale_price, stock, in_stock, weight_g, images, is_active,
            and wholesale pricing columns per tier. Brands must be imported first.
          </p>
        </div>
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {editProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditProduct(null) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="section-label mb-1">Edit product</p>
                <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "1.1rem", color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                  {editProduct.name}
                </p>
              </div>
              <button
                onClick={() => setEditProduct(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--foreground-subtle)", padding: 4 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <EditField label="Name">
                <input
                  type="text"
                  value={editForm.name ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </EditField>

              {/* SKU */}
              <EditField label="SKU">
                <input
                  type="text"
                  value={editForm.sku ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                />
              </EditField>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Retail price (₦)">
                  <input
                    type="number"
                    value={editForm.retailPrice ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, retailPrice: Number(e.target.value) }))}
                  />
                </EditField>
                <EditField label="Sale price (₦)">
                  <input
                    type="number"
                    value={editForm.salePrice ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, salePrice: Number(e.target.value) || undefined }))}
                    placeholder="Optional"
                  />
                </EditField>
              </div>

              {/* Stock */}
              <EditField label="Stock quantity">
                <input
                  type="number"
                  value={editForm.stock ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                />
              </EditField>

              {/* Short description */}
              <EditField label="Short description">
                <textarea
                  rows={3}
                  value={editForm.shortDescription ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  style={{ resize: "vertical" }}
                />
              </EditField>

              {/* Toggles */}
              <div className="flex gap-6">
                <Toggle
                  label="In stock"
                  checked={editForm.inStock ?? false}
                  onChange={(v) => setEditForm((f) => ({ ...f, inStock: v }))}
                />
                <Toggle
                  label="Active"
                  checked={editForm.isActive ?? false}
                  onChange={(v) => setEditForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            </div>

            {saveError && (
              <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditProduct(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--foreground-muted)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--brand-green)",
                  color: "#000",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--danger)" }}>
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-semibold mb-1" style={{ fontFamily: "var(--font-syne)", color: "var(--foreground)" }}>
              Delete product?
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.6 }}>
              <strong style={{ fontWeight: 600 }}>{deleteTarget.name}</strong> will be permanently deleted. This
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--foreground-muted)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--danger)",
                  color: "#fff",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Small helper components ────────────────────────────────────────────────

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block mb-1.5"
        style={{ fontSize: "0.7rem", fontFamily: "var(--font-dm-mono)", color: "var(--foreground-subtle)", letterSpacing: "0.04em", textTransform: "uppercase" }}
      >
        {label}
      </label>
      <div
        style={{
          ["--input-bg" as string]: "var(--surface-raised)",
        }}
      >
        {/* inputs & textareas receive global styles; add overrides via style on the parent */}
        <style>{`
          .edit-field-child input,
          .edit-field-child textarea {
            width: 100%;
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--surface-raised);
            color: var(--foreground);
            font-size: 0.875rem;
            outline: none;
            transition: border-color 0.15s;
            font-family: inherit;
          }
          .edit-field-child input:focus,
          .edit-field-child textarea:focus {
            border-color: var(--brand-green-border);
          }
        `}</style>
        <div className="edit-field-child">{children}</div>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? "var(--brand-green)" : "var(--border)",
          position: "relative",
          transition: "background 0.2s",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <span style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontFamily: "var(--font-dm-mono)" }}>
        {label}
      </span>
    </label>
  )
}