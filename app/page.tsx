"use client"
import Link from "next/link"
import Image from "next/image"

const BRANDS_MARQUEE = [
  "Skin By Zaron", "Face Facts", "St. Ives", "La Roche-Posay",
  "Dr. Teal's", "25 PSKYN", "Neutrogena", "CeraVe", "Olay",
  "Garnier", "L'Oréal", "Nivea", "Dove", "Palmer's", "Vaseline",
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Verified access only",
    body: "Every account is manually reviewed. Only approved businesses unlock wholesale pricing and catalogues.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Tiered wholesale pricing",
    body: "Retailer, distributor, and premium tiers with real MOQ-based pricing on every SKU across all brands.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="3" width="15" height="13" rx="2" stroke="#22c55e" strokeWidth="1.75" />
        <path d="M16 8h6l-1 5H16M11 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM22 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    title: "Bulk order tooling",
    body: "Build large multi-SKU orders in one session with our dedicated bulk order builder. Add hundreds of lines in minutes.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="#22c55e" strokeWidth="1.75" />
        <path d="M16 14a2 2 0 100-4 2 2 0 000 4z" stroke="#22c55e" strokeWidth="1.75" />
      </svg>
    ),
    title: "Flexible payment terms",
    body: "Pay via Paystack, bank transfer, or apply for net credit terms based on your account tier and order history.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.75" />
      </svg>
    ),
    title: "DHL shipping integration",
    body: "Live shipping rates calculated at checkout. Track every shipment directly from your order dashboard.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
    title: "Full order history",
    body: "Every invoice, tracking number, and order status in one place. Repeat past orders with a single click.",
  },
]

const STEPS = [
  { num: "01", title: "Apply for access", body: "Submit your business details. Our team reviews every application within 1–2 business days." },
  { num: "02", title: "Get approved & browse", body: "Once approved, unlock wholesale pricing across 200+ brands and thousands of SKUs." },
  { num: "03", title: "Place your order", body: "Use our catalogue or bulk order tool to build your order. Pay via Paystack or bank transfer." },
  { num: "04", title: "Track & reorder", body: "Monitor every shipment via DHL tracking. Repeat past orders in seconds from your dashboard." },
]

const TIERS = [
  {
    name: "Retailer",
    desc: "For independent stores and boutiques just getting started with wholesale.",
    color: "var(--info)",
    colorBg: "var(--info-bg)",
    perks: ["Access to full catalogue", "Standard wholesale pricing", "MOQ from 6 units", "Email support"],
  },
  {
    name: "Distributor",
    desc: "For established businesses moving serious volume across multiple categories.",
    color: "var(--warning)",
    colorBg: "var(--warning-bg)",
    perks: ["Everything in Retailer", "Distributor pricing (15–25% off)", "Lower MOQs", "Priority support", "Net 30 terms available"],
    featured: true,
  },
  {
    name: "Premium",
    desc: "For high-volume distributors and enterprise buyers with dedicated account needs.",
    color: "var(--brand-green)",
    colorBg: "var(--brand-green-subtle)",
    perks: ["Everything in Distributor", "Best-in-market pricing", "Custom MOQ negotiation", "Dedicated account manager", "Net 60 terms"],
  },
]

/* ── Reusable image placeholder ───────────────────────────── */
function ImgPlaceholder({ label, hint, className = "", style = {} }: {
  label: string; hint: string; className?: string; style?: React.CSSProperties
}) {
  return (
    <div className={className} style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, var(--surface-raised) 0%, var(--surface) 100%)",
      border: "1.5px dashed var(--border-accent)",
      borderRadius: 20,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 10, padding: 24,
      ...style,
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="var(--brand-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="4" stroke="var(--brand-green)" strokeWidth="1.5" />
      </svg>
      {label && <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-dm-mono)", color: "var(--brand-green)", letterSpacing: "0.08em", textAlign: "center", opacity: 0.65 }}>{label}</p>}
      {hint && <p style={{ fontSize: "0.6rem", fontFamily: "var(--font-dm-mono)", color: "var(--foreground-subtle)", letterSpacing: "0.03em", textAlign: "center", maxWidth: 200, lineHeight: 1.6 }}>{hint}</p>}
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO — centered editorial, full-width image below
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "90vh", paddingBottom: 0 }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.13) 0%, transparent 70%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black, transparent)",
        }} />

        {/* Copy — centered */}
        <div className="relative z-10 px-5 max-w-4xl mx-auto animate-fadeUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs" style={{
            background: "var(--brand-green-subtle)",
            border: "1px solid var(--brand-green-border)",
            color: "var(--brand-green)",
            fontFamily: "var(--font-dm-mono)",
            letterSpacing: "0.08em",
          }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--brand-green)" }} />
            VERIFIED WHOLESALE PLATFORM
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6" style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
          }}>
            Premium skincare,
            <br />
            <span className="text-gradient-green">wholesale pricing.</span>
          </h1>

          <p className="text-base md:text-lg mb-10 max-w-lg mx-auto" style={{
            color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.8,
          }}>
            OuterSkinX connects verified retailers and distributors with top-tier skincare brands at competitive wholesale rates. Apply once, buy forever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base">
              Apply for Access
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/catalogue" className="btn-ghost px-8 py-3.5 text-base">Browse Catalogue</Link>
          </div>

          <p style={{ color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", fontSize: "0.68rem", letterSpacing: "0.08em" }}>
            200+ BRANDS · 280+ SKUS · VERIFIED BUYERS ONLY
          </p>
        </div>

        {/* Full-width hero image below the copy */}
        <div className="relative z-10 w-full mt-16 px-5 md:px-8 max-w-6xl mx-auto">
          <div style={{ height: 480, borderRadius: 24, overflow: "hidden", position: "relative" }}>
            <Image src="https://outerskinx.com/wp-content/uploads/2024/10/osx21-scaled.webp" alt="Premium skincare products" fill className="object-cover" />
            {/* <ImgPlaceholder
              label="HERO BANNER IMAGE"
              hint="Wide lifestyle flatlay of premium skincare products. Full bleed. Recommended: 2400×960px, landscape."
              style={{ borderRadius: 24, height: "100%" }}
            /> */}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(transparent, var(--background))" }} />
      </section>

      {/* ── Brand marquee ────────────────────────────────────── */}
      <section className="relative overflow-hidden py-5" style={{
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...BRANDS_MARQUEE, ...BRANDS_MARQUEE].map((b, i) => (
            <span key={i} className="inline-flex items-center gap-4 mx-6" style={{
              fontFamily: "var(--font-dm-mono)", fontSize: "0.7rem",
              letterSpacing: "0.1em", color: "var(--foreground-subtle)", textTransform: "uppercase",
            }}>
              {b}
              <span style={{ color: "var(--brand-green)", fontSize: "0.5rem" }}>◆</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-[color:var(--border)]">
            {[
              { value: "200+", label: "Premium Brands" },
              { value: "280+", label: "Active SKUs" },
              { value: "3", label: "Wholesale Tiers" },
              { value: "24hr", label: "Order Processing" },
            ].map((stat) => (
              <div key={stat.label} className="md:px-10 text-center md:text-left">
                <p className="text-3xl md:text-4xl mb-1" style={{
                  fontFamily: "var(--font-syne)", fontWeight: 800,
                  color: "var(--brand-green)", letterSpacing: "-0.04em",
                }}>{stat.value}</p>
                <p style={{
                  fontSize: "0.72rem", color: "var(--foreground-subtle)",
                  fontFamily: "var(--font-dm-mono)", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — image LEFT, steps RIGHT
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Image — left */}
          <div style={{ height: 500, position: "relative", borderRadius: 24, overflow: "hidden" }}>
      <Image src="/how.jpg" alt="Buyer placing a wholesale order" fill className="object-cover rounded-3xl" />
            {/* <ImgPlaceholder
              label="HOW IT WORKS — LEFT"
              hint="Person browsing catalogue on laptop / reviewing products. Portrait crop. Recommended: 800×1000px."
              style={{ height: "100%", borderRadius: 24 }}
            /> */}
          </div>

          {/* Steps — right */}
          <div>
            <div className="section-label mb-3">Process</div>
            <h2 className="text-3xl md:text-5xl mb-4" style={{
              fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em",
            }}>How it works</h2>
            <p className="text-sm mb-10 max-w-xs" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>
              From application to delivery — the OuterSkinX wholesale process is built for speed and clarity.
            </p>

            <div className="flex flex-col">
              {STEPS.map((step, i) => (
                <div key={step.num} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
                      background: "var(--brand-green-subtle)", border: "1px solid var(--brand-green-border)",
                    }}>
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.6rem", color: "var(--brand-green)", fontWeight: 700 }}>{step.num}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className="w-px flex-1 my-1.5" style={{ background: "var(--border)", minHeight: 36 }} />}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-sm mb-1.5" style={{ fontFamily: "var(--font-syne)", fontWeight: 700, letterSpacing: "-0.02em" }}>{step.title}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — copy LEFT, image RIGHT
      ══════════════════════════════════════════════════════ */}
      <section className="py-28" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">

          {/* Section header + image — alternating (image RIGHT) */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <div className="section-label mb-3">Why OuterSkinX</div>
              <h2 className="text-3xl md:text-5xl mb-4" style={{
                fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em",
              }}>Built for<br />serious buyers</h2>
              <p className="text-sm max-w-sm" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>
                Every tool on this platform exists to help you buy smarter, faster, and at better prices than anywhere else.
              </p>
            </div>
            <div style={{ height: 340, position: "relative", borderRadius: 20, overflow: "hidden" }}>
              <Image src="https://images.unsplash.com/photo-1741655262435-4890ab9918fa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fEFmcmljYW4lMjBXYXJlaG91c2UlMkMlMjBjdXJhdGVkJTIwcHJvZHVjdCUyMGRpc3BsYXklMkMlMjBvciUyMHRlYW0lMjBwaG90by4lMjBMYW5kc2NhcGUuJTIwUmVjb21tZW5kZWQlM0ElMjAxMjAwJUMzJTk3NjgwcHgufGVufDB8fDB8fHww" alt="OuterSkinX platform features" fill className="object-cover rounded-2xl" />
              {/* <ImgPlaceholder
                label="FEATURES — RIGHT"
                hint="Warehouse, curated product display, or team photo. Landscape. Recommended: 1200×680px."
                style={{ height: "100%", borderRadius: 20 }}
              /> */}
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl transition-all duration-300 cursor-default"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-accent)"
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--border-accent), 0 12px 40px rgba(0,0,0,0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{
                  background: "var(--brand-green-subtle)", border: "1px solid var(--brand-green-border)",
                }}>{f.icon}</div>
                <h3 className="text-sm mb-2" style={{ fontFamily: "var(--font-syne)", fontWeight: 700, letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.75 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING — image LEFT, tiers RIGHT
      ══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Image + copy — left */}
          <div className="lg:sticky lg:top-28">
            <div className="section-label mb-3">Pricing</div>
            <h2 className="text-3xl md:text-5xl mb-4" style={{
              fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em",
            }}>Wholesale tiers</h2>
            <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.7 }}>
              Every approved buyer is assigned a tier. As your order volume grows, your pricing improves automatically.
            </p>
            <div style={{ height: 360, position: "relative", borderRadius: 20, overflow: "hidden" }}>
              <Image src="https://images.unsplash.com/photo-1748002369513-af0f999d9f1e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Store owner reviewing wholesale pricing" fill className="object-cover rounded-2xl" />
              {/* <ImgPlaceholder
                label="PRICING — LEFT"
                hint="Store owner or buyer reviewing product/pricing. Portrait crop works well. Recommended: 800×720px."
                style={{ height: "100%", borderRadius: 20 }}
              /> */}
            </div>
          </div>

          {/* Tier cards — right */}
          <div className="flex flex-col gap-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className="relative p-7 rounded-2xl flex flex-col"
                style={{
                  background: tier.featured ? "var(--surface-raised)" : "var(--surface)",
                  border: tier.featured ? `1px solid ${tier.color}` : "1px solid var(--border)",
                  boxShadow: tier.featured ? `0 0 40px rgba(250,204,21,0.06)` : "none",
                }}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold" style={{
                    background: tier.color, color: "#000",
                    fontFamily: "var(--font-dm-mono)", letterSpacing: "0.06em",
                  }}>MOST POPULAR</div>
                )}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="badge mb-2" style={{ background: tier.colorBg, color: tier.color }}>{tier.name}</span>
                    <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.6, maxWidth: 260 }}>{tier.desc}</p>
                  </div>
                  <Link href="/register"
                    className={tier.featured ? "btn-primary text-sm py-2.5 px-5 shrink-0" : "btn-ghost text-sm py-2.5 px-5 shrink-0"}
                    style={tier.featured ? { background: tier.color } : {}}
                  >Apply</Link>
                </div>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs" style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5" style={{ color: tier.color }}>
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS — copy LEFT (stacked), image RIGHT
      ══════════════════════════════════════════════════════ */}
      <section className="py-28" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Testimonial cards — left */}
            <div>
              <div className="section-label mb-3">Testimonials</div>
              <h2 className="text-3xl md:text-4xl mb-10" style={{
                fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em",
              }}>What buyers say</h2>
              <div className="flex flex-col gap-4">
                {[
                  { quote: "OuterSkinX cut our restocking time in half. The bulk order tool is unmatched.", name: "Adaeze O.", role: "Retailer, Lagos" },
                  { quote: "Pricing is genuinely competitive. Finally a platform built for serious distributors.", name: "Emeka K.", role: "Distributor, Abuja" },
                  { quote: "From application to first delivery in under 4 days. Truly impressed.", name: "Fatima I.", role: "Retailer, Kano" },
                ].map((t, i) => (
                  <div key={i} className="p-5 rounded-2xl flex items-start gap-4" style={{
                    background: "var(--surface-raised)", border: "1px solid var(--border)",
                  }}>
                    <Image src={`https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWZyaWNhbiUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D-${i+1}`} alt={t.name} width={44} height={44} className="w-16 h-16 rounded-full object-cover shrink-0" />
                  
                    {/* Hint above ↑: 44×44px circular headshot */}
                    <div>
                      <p style={{ fontSize: "0.82rem", color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.75, fontStyle: "italic", marginBottom: 8 }}>
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <p style={{ fontSize: "0.78rem", fontFamily: "var(--font-syne)", fontWeight: 700, color: "var(--foreground)" }}>{t.name}</p>
                      <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-dm-mono)", color: "var(--foreground-subtle)", letterSpacing: "0.06em" }}>{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image — right */}
            <div style={{ height: 560, position: "relative", borderRadius: 24, overflow: "hidden" }}>
              <Image src="https://images.unsplash.com/photo-1560181275-a65519fd0ec1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8SGFwcHklMjBzdG9yZSUyMG93bmVyJTIwb3IlMjBidXllciUyMHdpdGglMjBwcm9kdWN0cy4lMjBUYWxsJTIwcG9ydHJhaXQlMjBjcm9wLiUyMFJlY29tbWVuZGVkJTNBJTIwODAwJUMzJTk3MTEyMHB4LnxlbnwwfHwwfHx8MA%3D%3D" alt="Happy retail buyer" fill className="object-cover rounded-3xl" />
              {/* <ImgPlaceholder
                label="TESTIMONIALS — RIGHT"
                hint="Happy store owner or buyer with products. Tall portrait crop. Recommended: 800×1120px."
                style={{ height: "100%", borderRadius: 24 }}
              /> */}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — full-width split: image LEFT, copy RIGHT
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 md:px-8 py-28">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden" style={{
          border: "1px solid var(--border-accent)",
          background: "var(--surface)",
        }}>
          <div className="grid lg:grid-cols-2 min-h-[400px]">

            {/* Image — left */}
            <div style={{ position: "relative", minHeight: 320 }}>
              <Image src="https://images.unsplash.com/photo-1627384114006-f7b66c22baf1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8UHJlbWl1bSUyMHByb2R1Y3QlMjBzcHJlYWQlMjBvciUyMGFzcGlyYXRpb25hbCUyMHNraW5jYXJlJTIwbGlmZXN0eWxlJTIwaW1hZ2UuJTIwRnVsbCUyMGJsZWVkLiUyMFJlY29tbWVuZGVkJTNBJTIwOTYwJUMzJTk3ODAwcHgufGVufDB8fDB8fHww" alt="Premium skincare" fill className="object-cover" />
              {/* <ImgPlaceholder
                label="CTA BANNER — LEFT"
                hint="Premium product spread or aspirational skincare lifestyle image. Full bleed. Recommended: 960×800px."
                style={{ height: "100%", minHeight: 320, borderRadius: 0, border: "none", borderRight: "1.5px dashed var(--border-accent)" }}
              /> */}
            </div>

            {/* Copy — right */}
            <div className="relative flex flex-col justify-center p-10 md:p-16">
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 80% 80% at 80% 50%, rgba(34,197,94,0.07), transparent)",
              }} />
              <div className="relative z-10">
                <div className="section-label mb-4">Get started today</div>
                <h2 className="text-3xl md:text-4xl mb-4" style={{
                  fontFamily: "var(--font-syne)", fontWeight: 800, letterSpacing: "-0.04em",
                }}>Ready to stock up?</h2>
                <p className="mb-8 text-sm max-w-sm" style={{ color: "var(--foreground-muted)", fontWeight: 300, lineHeight: 1.8 }}>
                  Apply for a wholesale account and get access to 200+ premium brands at distributor pricing.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/register" className="btn-primary px-7 py-3.5">
                    Apply Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </Link>
                  <Link href="/catalogue" className="btn-ghost px-7 py-3.5">Browse Catalogue</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}