import Link from "next/link";

export default function SuspendedPage() {
  return (
    <main
      className="flex-1 flex items-center justify-center px-5 py-16"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-md w-full text-center animate-fadeUp">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "var(--danger-bg)",
            border: "1px solid rgba(248,113,113,0.2)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#f87171"
              strokeWidth="1.75"
            />
            <path
              d="M15 9l-6 6M9 9l6 6"
              stroke="#f87171"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="section-label mb-3" style={{ color: "var(--danger)" }}>
          Account suspended
        </div>
        <h1
          className="text-3xl mb-4"
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Access restricted
        </h1>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: "var(--foreground-muted)", fontWeight: 300 }}
        >
          Your wholesale account has been suspended. Please contact us to
          understand what happened and how to resolve it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:hello@outerskinx.com" className="btn-primary">
            Contact support
          </a>
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
