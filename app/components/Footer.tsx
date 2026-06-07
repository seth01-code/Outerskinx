"use client"
import Link from "next/link"

const LINKS = {
  Platform: [
    { label: "Catalogue", href: "/catalogue" },
    { label: "Brands", href: "/brands" },
    { label: "Bulk Order", href: "/catalogue/bulk-order" },
    { label: "Apply for Access", href: "/register" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "My Account", href: "/account" },
    { label: "Order History", href: "/orders" },
  ],
  Company: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Refund Policy", href: "/refunds" },
  ],
}

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 mb-4">
                           <img src="/logo.jpg" alt="OuterSkinX" className="h-12 mt-4 w-auto rounded-lg object-contain" />

            </Link>
            <p
              className="text-xs leading-relaxed mb-5"
              style={{ color: "var(--foreground-subtle)", fontWeight: 300, maxWidth: "180px" }}
            >
              Premium wholesale skincare for verified retailers and distributors.
            </p>
            <a
              href="mailto:hello@outerskinx.com"
              className="text-xs transition-colors"
              style={{ color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand-green)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
            >
              hello@outerskinx.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p
                className="section-label mb-4"
                style={{ color: "var(--foreground-subtle)" }}
              >
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs transition-colors"
                      style={{ color: "var(--foreground-subtle)", fontWeight: 300 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "0.68rem",
              color: "var(--foreground-subtle)",
              letterSpacing: "0.05em",
            }}
          >
            © {new Date().getFullYear()} OUTERSKINX. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Refunds"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-xs transition-colors"
                style={{ color: "var(--foreground-subtle)", fontFamily: "var(--font-dm-mono)", letterSpacing: "0.04em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-subtle)")}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}