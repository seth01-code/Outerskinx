"use client"

import { useEffect, useState } from "react"

export default function Preloader() {
  const [visible, setVisible]   = useState(true)   // start true — hide only after check
  const [phase, setPhase]       = useState<"in" | "hold" | "out">("in")
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)

    if ((window as any).__osx_preloader_seen) {
      setVisible(false)
      return
    }
    ;(window as any).__osx_preloader_seen = true

    // Remove the blocking class now that JS has taken over
    document.documentElement.classList.remove("preloading")
    document.body.style.overflow = "hidden"

    let prog = 0
    const progInterval = setInterval(() => {
      prog += Math.random() * 5 + 1.5
      if (prog >= 100) { prog = 100; clearInterval(progInterval) }
      setProgress(Math.min(prog, 100))
    }, 140)

    // Slower, more deliberate timeline
    const holdTimer = setTimeout(() => setPhase("hold"), 3000)
    const outTimer  = setTimeout(() => setPhase("out"),  4600)
    const doneTimer = setTimeout(() => {
      setVisible(false)
      document.body.style.overflow = ""
    }, 5500)

    return () => {
      clearInterval(progInterval)
      clearTimeout(holdTimer)
      clearTimeout(outTimer)
      clearTimeout(doneTimer)
      document.body.style.overflow = ""
      document.documentElement.classList.remove("preloading")
    }
  }, [])

  // Don't render anything until mounted — avoids SSR mismatch
  // but keep the space reserved via the blocking class above
  if (!mounted || !visible) return null

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: phase === "out" ? 0 : 1,
      transition: phase === "out" ? "opacity 1s cubic-bezier(0.4,0,0.2,1)" : "none",
      pointerEvents: phase === "out" ? "none" : "all",
      overflow: "hidden",
    }}>

      {/* Background radial pulse */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,197,94,0.06) 0%, transparent 70%)",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 1.4s ease 1s",
        pointerEvents: "none",
      }} />

      {/* Outer rotating ring */}
      <div style={{
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: "50%",
        border: "1px solid rgba(34,197,94,0.15)",
        animation: "osx-spin 8s linear infinite",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 0.8s ease 1.2s",
      }} />

      {/* Middle dashed ring */}
      <div style={{
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: "50%",
        border: "1px dashed rgba(34,197,94,0.2)",
        animation: "osx-spin-reverse 6s linear infinite",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 0.8s ease 1.3s",
      }} />

      {/* Center content */}
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        zIndex: 1,
      }}>

        {/* SVG icon */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.08)",
            opacity: phase === "hold" ? 1 : 0,
            transform: phase === "hold" ? "scale(1)" : "scale(0.6)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }} />

          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44"
              stroke="rgba(34,197,94,0.1)" strokeWidth="1.5" fill="none" />
            <circle cx="50" cy="50" r="44"
              stroke="#22c55e" strokeWidth="1.5" fill="none"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{
                strokeDasharray: 276,
                strokeDashoffset: 276 - (276 * progress) / 100,
                opacity: phase === "hold" ? 0 : 1,
                transition: "stroke-dashoffset 0.18s ease, opacity 0.6s ease",
              }}
            />
            <path
              d="M38 30 Q36 28 36 32 L36 68 Q36 72 40 70 L74 52 Q78 50 74 48 L40 30 Q38 28 38 30 Z"
              stroke="#22c55e" strokeWidth="4"
              strokeLinecap="round" strokeLinejoin="round"
              fill="none"
              style={{
                strokeDasharray: 220,
                strokeDashoffset: phase === "in" ? 220 : 0,
                transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s",
              }}
            />
            <path
              d="M38 30 Q36 28 36 32 L36 68 Q36 72 40 70 L74 52 Q78 50 74 48 L40 30 Q38 28 38 30 Z"
              fill="#22c55e"
              style={{
                opacity: phase === "hold" ? 0.12 : 0,
                transition: "opacity 0.8s ease",
              }}
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.7s ease 1.6s, transform 0.7s ease 1.6s",
        }}>
          {["Outer", "Skin", "X"].map((word, i) => (
            <span key={word} style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              fontSize: "1.8rem",
              letterSpacing: "-0.04em",
              color: i === 1 ? "#22c55e" : "var(--foreground)",
            }}>{word}</span>
          ))}
        </div>

        {/* Tagline + progress */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: phase === "in" ? 0 : 1,
          transition: "opacity 0.6s ease 2s",
        }}>
          <p style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.16em",
            color: "var(--foreground-subtle)",
            textTransform: "uppercase",
            margin: 0,
          }}>
            Wholesale Skincare Platform
          </p>

          <div style={{
            width: 160, height: 1,
            background: "rgba(34,197,94,0.12)",
            borderRadius: 999, overflow: "hidden",
            opacity: phase === "hold" ? 0 : 1,
            transition: "opacity 0.6s ease",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, rgba(34,197,94,0.4), #22c55e)",
              borderRadius: 999,
              transition: "width 0.18s ease",
            }} />
          </div>

          <span style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.58rem",
            color: "var(--brand-green)",
            letterSpacing: "0.1em",
            opacity: phase === "hold" ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Corner brackets */}
      {[
        { top: 32, left: 32 },
        { top: 32, right: 32 },
        { bottom: 32, left: 32 },
        { bottom: 32, right: 32 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: 20, height: 20,
          opacity: phase === "in" ? 0 : 0.4,
          transition: `opacity 0.5s ease ${1.6 + i * 0.1}s`,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d={
                pos.right !== undefined && pos.bottom !== undefined ? "M20 8 L20 20 L8 20" :
                pos.left  !== undefined && pos.bottom !== undefined ? "M0 8 L0 20 L12 20" :
                pos.right !== undefined                             ? "M20 12 L20 0 L8 0" :
                                                                      "M0 12 L0 0 L12 0"
              }
              stroke="#22c55e" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes osx-spin         { to { transform: rotate(360deg);  } }
        @keyframes osx-spin-reverse { to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  )
}