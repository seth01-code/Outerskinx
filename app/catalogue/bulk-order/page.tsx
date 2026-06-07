"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface WholesaleTier {
  tier: string;
  moq: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  images: string[];
  retailPrice: number;
  salePrice?: number;
  inStock: boolean;
  stock: number;
  brand: { _id: string; name: string; slug: string };
  categories: string[];
  shortDescription?: string;
  wholesalePricing: WholesaleTier[];
}

interface BulkItem {
  product: Product;
  qty: number;
}

interface Filters {
  brands: { _id: string; name: string; slug: string }[];
  categories: string[];
}

type ViewMode = "search" | "browse";

const PAGE_LIMIT = 24;

export default function BulkOrderPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse");

  // ── Search state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Browse state ──────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    categories: [],
  });
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Order state ───────────────────────────────────────────────────────
  const [items, setItems] = useState<BulkItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [orderVisible, setOrderVisible] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load filters ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/products/filters")
      .then((r) => r.json())
      .then(setFilters)
      .catch(() => {});
  }, []);

  // ── Browse fetch ──────────────────────────────────────────────────────
  const fetchBrowse = useCallback(
    async (p = 1) => {
      setBrowseLoading(true);
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_LIMIT),
      });
      if (brandFilter) params.set("brand", brandFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setBrowseProducts(data.products || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
      setBrowseLoading(false);
    },
    [brandFilter, categoryFilter],
  );

  useEffect(() => {
    if (viewMode === "browse") fetchBrowse(1);
  }, [fetchBrowse, viewMode]);

  // ── Search ────────────────────────────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!search.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    const res = await fetch(
      `/api/products?search=${encodeURIComponent(search)}&limit=12`,
    );
    const data = await res.json();
    setSearchResults(data.products || []);
    setDropdownOpen(true);
    setSearching(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  // ── Cart ops ──────────────────────────────────────────────────────────
  function addItem(product: Product, qty = 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product._id === product._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { product, qty }];
    });
    setSearch("");
    setSearchResults([]);
    setDropdownOpen(false);
    setOrderVisible(true);
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.product._id === productId ? { ...i, qty } : i)),
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  }

  function isAdded(id: string) {
    return items.some((i) => i.product._id === id);
  }

  function getQty(id: string) {
    return items.find((i) => i.product._id === id)?.qty ?? 0;
  }

  // Best wholesale tier for a given qty
  function getBestTier(product: Product, qty: number): WholesaleTier | null {
    if (!product.wholesalePricing?.length) return null;
    const eligible = product.wholesalePricing
      .filter((t) => qty >= t.moq)
      .sort((a, b) => b.moq - a.moq);
    return eligible[0] ?? null;
  }

  async function addAllToCart() {
    if (items.length === 0) return;
    setAdding(true);
    const cart = JSON.parse(localStorage.getItem("osx_cart") || "[]");
    for (const item of items) {
      const existing = cart.findIndex(
        (c: { _id: string }) => c._id === item.product._id,
      );
      if (existing >= 0) {
        cart[existing].qty += item.qty;
      } else {
        cart.push({
          _id: item.product._id,
          sku: item.product.sku,
          name: item.product.name,
          image: item.product.images[0] || "",
          retailPrice: item.product.retailPrice,
          wholesalePricing: item.product.wholesalePricing,
          qty: item.qty,
        });
      }
    }
    localStorage.setItem("osx_cart", JSON.stringify(cart));
    setAdding(false);
    setItems([]);
    setOrderVisible(false);
    window.location.href = "/cart";
  }

  const subtotal = items.reduce((sum, i) => {
    const tier = getBestTier(i.product, i.qty);
    const price = tier ? tier.price : i.product.retailPrice;
    return sum + price * i.qty;
  }, 0);

  const totalUnits = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div
      className="min-h-screen animate-fadeUp"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <nav className="breadcrumb mb-4">
            <Link href="/catalogue">Catalogue</Link>
            <span className="sep">/</span>
            <span className="current">Bulk order</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1
                className="text-4xl md:text-5xl"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                Bulk order
              </h1>
              <p
                className="mt-2"
                style={{ color: "var(--foreground-muted)", fontWeight: 300 }}
              >
                Browse our catalogue, add products, and submit your order in one
                go.
              </p>
            </div>

            {/* Order summary pill */}
            {items.length > 0 && (
              <button
                onClick={() => setOrderVisible((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--brand-green-border)",
                  background: "rgba(var(--brand-green-rgb, 74,222,128),0.08)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--brand-green)",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {items.length}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "0.8rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  {orderVisible ? "Hide" : "View"} order · ₦
                  {subtotal.toLocaleString()}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* ── Left: browse/search panel ─────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Mode tabs + search */}
            <div
              className="flex items-center gap-3 mb-6 flex-wrap"
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: "1rem",
              }}
            >
              {/* Tab switcher */}
              <div
                className="flex rounded-lg overflow-hidden"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                {(["browse", "search"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "7px 16px",
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-dm-mono)",
                      background:
                        viewMode === mode
                          ? "var(--brand-green)"
                          : "transparent",
                      color:
                        viewMode === mode ? "#000" : "var(--foreground-muted)",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: viewMode === mode ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "browse"
                      ? "Browse catalogue"
                      : "Search by SKU / name"}
                  </button>
                ))}
              </div>
            </div>

            {/* Browse filters */}
            {viewMode === "browse" && (
              <div className="flex gap-3 mb-5 flex-wrap">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All brands</option>
                  {filters.brands.map((b) => (
                    <option key={b._id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All categories</option>
                  {filters.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {(brandFilter || categoryFilter) && (
                  <button
                    onClick={() => {
                      setBrandFilter("");
                      setCategoryFilter("");
                    }}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--foreground-muted)",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
                {!browseLoading && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--foreground-subtle)",
                      fontFamily: "var(--font-dm-mono)",
                      marginLeft: "auto",
                      alignSelf: "center",
                    }}
                  >
                    {total} products
                  </span>
                )}
              </div>
            )}

            {/* Search input */}
            {viewMode === "search" && (
              <div className="relative mb-6">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "var(--foreground-subtle)" }}
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search by product name, SKU, or brand…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-10 py-3"
                  autoFocus
                />
                {/* Search dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20"
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    {searching ? (
                      <div
                        className="px-5 py-4 text-sm"
                        style={{ color: "var(--foreground-muted)" }}
                      >
                        Searching…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div
                        className="px-5 py-4 text-sm"
                        style={{ color: "var(--foreground-muted)" }}
                      >
                        No results
                      </div>
                    ) : (
                      searchResults.map((p) => {
                        const added = isAdded(p._id);
                        return (
                          <button
                            key={p._id}
                            onClick={() => addItem(p)}
                            disabled={added}
                            className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors"
                            style={{
                              borderBottom: "1px solid var(--border)",
                              opacity: added ? 0.5 : 1,
                              cursor: added ? "not-allowed" : "pointer",
                            }}
                            onMouseEnter={(e) => {
                              if (!added)
                                e.currentTarget.style.background =
                                  "var(--surface-elevated)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <div
                              className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {p.images[0] && (
                                <Image
                                  src={p.images[0]}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  unoptimized
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm truncate"
                                style={{ color: "var(--foreground)" }}
                              >
                                {p.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--foreground-subtle)",
                                  fontFamily: "var(--font-dm-mono)",
                                }}
                              >
                                {p.sku} · {p.brand?.name} · ₦
                                {p.retailPrice.toLocaleString()}
                              </p>
                              {p.wholesalePricing?.length > 0 && (
                                <p
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "var(--brand-green)",
                                    fontFamily: "var(--font-dm-mono)",
                                    marginTop: 2,
                                  }}
                                >
                                  Wholesale from ₦
                                  {Math.min(
                                    ...p.wholesalePricing.map((t) => t.price),
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: added
                                  ? "var(--success)"
                                  : "var(--brand-green)",
                                fontFamily: "var(--font-dm-mono)",
                                flexShrink: 0,
                              }}
                            >
                              {added ? "✓ Added" : "+ Add"}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Browse grid */}
            {viewMode === "browse" &&
              (browseLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="skeleton rounded-2xl h-64" />
                  ))}
                </div>
              ) : browseProducts.length === 0 ? (
                <div
                  className="text-center py-20"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  <p style={{ fontWeight: 300 }}>No products found.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {browseProducts.map((p) => {
                      const added = isAdded(p._id);
                      const qty = getQty(p._id);
                      const bestWholesale = p.wholesalePricing?.[0];
                      return (
                        <div
                          key={p._id}
                          className="rounded-2xl overflow-hidden flex flex-col"
                          style={{
                            background: "var(--surface)",
                            border: added
                              ? "1px solid var(--brand-green-border)"
                              : "1px solid var(--border)",
                            transition: "border-color 0.2s",
                          }}
                        >
                          {/* Image */}
                          <div
                            className="relative w-full"
                            style={{
                              paddingBottom: "100%",
                              background: "var(--surface-raised)",
                            }}
                          >
                            {p.images[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  style={{ color: "var(--foreground-subtle)" }}
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                  />
                                  <circle
                                    cx="8.5"
                                    cy="8.5"
                                    r="1.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                  />
                                  <path
                                    d="M21 15l-5-5L5 21"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            )}
                            {/* Stock badge */}
                            {!p.inStock && (
                              <div
                                className="absolute top-2 left-2"
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 6,
                                  background: "rgba(0,0,0,0.7)",
                                  fontSize: "0.62rem",
                                  fontFamily: "var(--font-dm-mono)",
                                  color: "var(--danger)",
                                }}
                              >
                                Out of stock
                              </div>
                            )}
                            {/* Added badge */}
                            {added && (
                              <div
                                className="absolute top-2 right-2"
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 6,
                                  background: "var(--brand-green)",
                                  color: "#000",
                                  fontSize: "0.62rem",
                                  fontFamily: "var(--font-dm-mono)",
                                  fontWeight: 700,
                                }}
                              >
                                ✓ {qty} added
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-3 flex flex-col flex-1">
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--foreground-subtle)",
                                fontFamily: "var(--font-dm-mono)",
                                marginBottom: 2,
                              }}
                            >
                              {p.brand?.name}
                            </p>
                            <p
                              className="line-clamp-2 flex-1"
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--foreground)",
                                fontWeight: 500,
                                lineHeight: 1.4,
                              }}
                            >
                              {p.name}
                            </p>

                            {/* Pricing */}
                            <div className="mt-2 mb-3">
                              <p
                                style={{
                                  fontFamily: "var(--font-dm-mono)",
                                  fontSize: "0.82rem",
                                  color: "var(--foreground)",
                                  fontWeight: 600,
                                }}
                              >
                                ₦{p.retailPrice.toLocaleString()}
                              </p>
                              {bestWholesale && (
                                <p
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "var(--brand-green)",
                                    fontFamily: "var(--font-dm-mono)",
                                    marginTop: 2,
                                  }}
                                >
                                  Wholesale: ₦
                                  {bestWholesale.price.toLocaleString()} (MOQ{" "}
                                  {bestWholesale.moq})
                                </p>
                              )}
                            </div>

                            {/* Wholesale tiers */}
                            {p.wholesalePricing?.length > 0 && (
                              <div
                                className="rounded-lg p-2 mb-3"
                                style={{
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "0.6rem",
                                    color: "var(--foreground-subtle)",
                                    fontFamily: "var(--font-dm-mono)",
                                    marginBottom: 4,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Wholesale tiers
                                </p>
                                {p.wholesalePricing.map((t) => (
                                  <div
                                    key={t.tier}
                                    className="flex justify-between items-center"
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.65rem",
                                        color: "var(--foreground-muted)",
                                        fontFamily: "var(--font-dm-mono)",
                                      }}
                                    >
                                      {t.moq}+ units
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.65rem",
                                        color: "var(--brand-green)",
                                        fontFamily: "var(--font-dm-mono)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ₦{t.price.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add button */}
                            {added ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQty(p._id, qty - 1)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface-raised)",
                                    color: "var(--foreground)",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={qty}
                                  onChange={(e) =>
                                    updateQty(
                                      p._id,
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  style={{
                                    flex: 1,
                                    textAlign: "center",
                                    padding: "4px",
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface-raised)",
                                    color: "var(--foreground)",
                                    fontFamily: "var(--font-dm-mono)",
                                    fontSize: "0.78rem",
                                  }}
                                />
                                <button
                                  onClick={() => updateQty(p._id, qty + 1)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface-raised)",
                                    color: "var(--foreground)",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeItem(p._id)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    border: "1px solid rgba(248,113,113,0.2)",
                                    background: "var(--danger-bg)",
                                    color: "var(--danger)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M18 6L6 18M6 6l12 12"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addItem(p)}
                                disabled={!p.inStock}
                                style={{
                                  width: "100%",
                                  padding: "7px",
                                  borderRadius: 10,
                                  border: "1px solid var(--border)",
                                  background: p.inStock
                                    ? "var(--surface-raised)"
                                    : "transparent",
                                  color: p.inStock
                                    ? "var(--foreground-muted)"
                                    : "var(--foreground-subtle)",
                                  fontFamily: "var(--font-dm-mono)",
                                  fontSize: "0.75rem",
                                  cursor: p.inStock ? "pointer" : "not-allowed",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (p.inStock) {
                                    e.currentTarget.style.background =
                                      "var(--brand-green)";
                                    e.currentTarget.style.color = "#000";
                                    e.currentTarget.style.borderColor =
                                      "transparent";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "var(--surface-raised)";
                                  e.currentTarget.style.color =
                                    "var(--foreground-muted)";
                                  e.currentTarget.style.borderColor =
                                    "var(--border)";
                                }}
                              >
                                {p.inStock ? "+ Add to order" : "Out of stock"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                      <button
                        disabled={page <= 1}
                        onClick={() => fetchBrowse(page - 1)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color:
                            page <= 1
                              ? "var(--foreground-subtle)"
                              : "var(--foreground-muted)",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.78rem",
                          cursor: page <= 1 ? "not-allowed" : "pointer",
                          opacity: page <= 1 ? 0.4 : 1,
                        }}
                      >
                        ← Prev
                      </button>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--foreground-subtle)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {page} / {pages}
                      </span>
                      <button
                        disabled={page >= pages}
                        onClick={() => fetchBrowse(page + 1)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color:
                            page >= pages
                              ? "var(--foreground-subtle)"
                              : "var(--foreground-muted)",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.78rem",
                          cursor: page >= pages ? "not-allowed" : "pointer",
                          opacity: page >= pages ? 0.4 : 1,
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              ))}
          </div>

          {/* ── Right: order panel ────────────────────────────────────── */}
          {orderVisible && items.length > 0 && (
            <div
              className="w-80 shrink-0 sticky top-6 rounded-2xl overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="p-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <p className="section-label">Your order</p>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--foreground-subtle)",
                    fontFamily: "var(--font-dm-mono)",
                    marginTop: 2,
                  }}
                >
                  {items.length} product{items.length !== 1 ? "s" : ""} ·{" "}
                  {totalUnits} units
                </p>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                {items.map((item) => {
                  const tier = getBestTier(item.product, item.qty);
                  const price = tier ? tier.price : item.product.retailPrice;
                  return (
                    <div
                      key={item.product._id}
                      className="flex items-start gap-3 p-4"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div
                        className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0"
                        style={{
                          background: "var(--surface-raised)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {item.product.images[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs truncate"
                          style={{
                            color: "var(--foreground)",
                            fontWeight: 500,
                          }}
                        >
                          {item.product.name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--foreground-subtle)",
                            fontFamily: "var(--font-dm-mono)",
                          }}
                        >
                          {item.product.sku}
                        </p>
                        {tier && (
                          <p
                            style={{
                              fontSize: "0.62rem",
                              color: "var(--brand-green)",
                              fontFamily: "var(--font-dm-mono)",
                              marginTop: 1,
                            }}
                          >
                            {tier.tier} price applied
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() =>
                              updateQty(item.product._id, item.qty - 1)
                            }
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                              background: "var(--surface-raised)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-dm-mono)",
                              color: "var(--foreground)",
                              minWidth: 24,
                              textAlign: "center",
                            }}
                          >
                            {item.qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQty(item.product._id, item.qty + 1)
                            }
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                              background: "var(--surface-raised)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            +
                          </button>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontFamily: "var(--font-dm-mono)",
                              color: "var(--foreground-muted)",
                              marginLeft: "auto",
                            }}
                          >
                            ₦{(price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product._id)}
                        style={{
                          color: "var(--foreground-subtle)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--danger)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "var(--foreground-subtle)")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Total + CTA */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--foreground-muted)",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: "1.3rem",
                      color: "var(--brand-green)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={addAllToCart}
                  disabled={adding}
                  className="btn-primary w-full"
                >
                  {adding ? "Adding…" : "Add all to cart"}
                  {!adding && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
