import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <main
      className="flex-1 flex items-center justify-center px-5 py-16"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-md w-full text-center animate-fadeUp">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "var(--warning-bg)",
            border: "1px solid rgba(250,204,21,0.2)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#facc15"
              strokeWidth="1.75"
            />
            <path
              d="M12 6v6l4 2"
              stroke="#facc15"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="section-label mb-3">Application received</div>
        <h1
          className="text-3xl mb-4"
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Under review
        </h1>
        <p
          className="text-sm leading-relaxed mb-2"
          style={{ color: "var(--foreground-muted)", fontWeight: 300 }}
        >
          Thank you for applying for a wholesale account with OuterSkinX. Our
          team will review your application and get back to you within 1–2
          business days.
        </p>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--foreground-muted)", fontWeight: 300 }}
        >
          Questions?{" "}
          <a
            href="mailto:hello@outerskinx.com"
            style={{
              color: "var(--brand-green)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            hello@outerskinx.com
          </a>
        </p>
        <Link href="/" className="btn-ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Back to home
        </Link>
      </div>
    </main>
  );
}
