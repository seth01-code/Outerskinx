"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface Brand {
  _id: string
  name: string
  slug: string
  logo?: string
  country?: string
  isActive: boolean
  createdAt: string
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [togglingAll, setTogglingAll] = useState(false)
  const [importResults, setImportResults] = useState<{
    created: number
    updated: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [importError, setImportError] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", country: "", description: "", logo: "" })
  const [formError, setFormError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => { setBrands(d.brands || []); setLoading(false) })
  }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResults(null)
    setImportError("")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/admin/brands/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setImportError(data.error || "Import failed"); return }
      setImportResults(data.results)
      const brandsRes = await fetch("/api/admin/brands")
      const brandsData = await brandsRes.json()
      setBrands(brandsData.brands || [])
    } catch {
      setImportError("Something went wrong")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    setSaving(true)
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || "Failed to create brand"); return }
      setBrands((prev) => [data.brand, ...prev])
      setForm({ name: "", country: "", description: "", logo: "" })
      setShowAddForm(false)
    } catch {
      setFormError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    if (res.ok) {
      setBrands((prev) => prev.map((b) => (b._id === id ? { ...b, isActive: !isActive } : b)))
    }
  }

  async function toggleAll(activate: boolean) {
    setTogglingAll(true)
    try {
      await Promise.all(
        brands
          .filter((b) => b.isActive !== activate)
          .map((b) =>
            fetch(`/api/admin/brands/${b._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: activate }),
            })
          )
      )
      setBrands((prev) => prev.map((b) => ({ ...b, isActive: activate })))
    } catch {
      //
    } finally {
      setTogglingAll(false)
    }
  }

  const allActive = brands.length > 0 && brands.every((b) => b.isActive)
  const allInactive = brands.length > 0 && brands.every((b) => !b.isActive)

  return (
    <div className="animate-fadeUp">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="section-label mb-2">Admin</div>
          <h1
            className="text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em" }}
          >
            Brands
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn-ghost text-sm">
            {importing ? "Importing..." : "Import Excel"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-sm">
            {showAddForm ? "Cancel" : "Add brand"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAddBrand}
          className="p-6 rounded-2xl mb-6 space-y-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border-accent)" }}
        >
          <p className="section-label">New brand</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Brand name *", placeholder: "e.g. Face Facts", required: true },
              { key: "country", label: "Country of origin", placeholder: "e.g. United Kingdom" },
              { key: "logo", label: "Logo URL", placeholder: "https://..." },
              { key: "description", label: "Description", placeholder: "Short brand description" },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label
                  className="block text-xs mb-2"
                  style={{ color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  {label}
                </label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  required={required}
                  className="input-base"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
          {formError && <p className="text-sm" style={{ color: "var(--danger)" }}>{formError}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Creating..." : "Create brand"}
          </button>
        </form>
      )}

      {/* Import results */}
      {(importResults || importError) && (
        <div
          className="p-5 rounded-xl mb-6"
          style={{
            background: importError ? "var(--danger-bg)" : "var(--surface)",
            border: importError ? "1px solid rgba(248,113,113,0.2)" : "1px solid var(--border-accent)",
          }}
        >
          {importError ? (
            <p className="text-sm" style={{ color: "var(--danger)" }}>{importError}</p>
          ) : importResults && (
            <>
              <p className="section-label mb-3">Import complete</p>
              <div className="flex gap-6">
                {[
                  { label: "Created", value: importResults.created, color: "var(--success)" },
                  { label: "Updated", value: importResults.updated, color: "var(--info)" },
                  { label: "Skipped", value: importResults.skipped, color: "var(--warning)" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "1.5rem", color, letterSpacing: "-0.03em" }}>{value}</p>
                    <p style={{ fontSize: "0.7rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Brands list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : brands.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl"
          style={{ border: "1px dashed var(--border)", color: "var(--foreground-muted)" }}
        >
          <p style={{ fontWeight: 300 }}>No brands yet. Import an Excel file or add one manually.</p>
        </div>
      ) : (
        <>
          {/* Bulk actions bar */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
              {brands.filter((b) => b.isActive).length} of {brands.length} active
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(true)}
                disabled={togglingAll || allActive}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(74,222,128,0.2)",
                  background: "var(--success-bg)",
                  color: "var(--success)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.72rem",
                  cursor: togglingAll || allActive ? "not-allowed" : "pointer",
                  opacity: togglingAll || allActive ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {togglingAll ? "Working…" : "Activate all"}
              </button>
              <button
                onClick={() => toggleAll(false)}
                disabled={togglingAll || allInactive}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(248,113,113,0.2)",
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "0.72rem",
                  cursor: togglingAll || allInactive ? "not-allowed" : "pointer",
                  opacity: togglingAll || allInactive ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                Deactivate all
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {brands.map((brand) => (
              <div
                key={brand._id}
                className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  opacity: brand.isActive ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Logo */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                  >
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={40}
                        height={40}
                        className="object-contain w-full h-full p-1"
                        unoptimized
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-syne)",
                          fontWeight: 800,
                          fontSize: "1rem",
                          color: "var(--brand-green)",
                        }}
                      >
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {brand.name}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}>
                      {brand.slug}{brand.country && ` · ${brand.country}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(brand._id, brand.isActive)}
                  className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition-all"
                  style={{
                    background: brand.isActive ? "var(--danger-bg)" : "var(--success-bg)",
                    color: brand.isActive ? "var(--danger)" : "var(--success)",
                    border: brand.isActive ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(74,222,128,0.2)",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {brand.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}