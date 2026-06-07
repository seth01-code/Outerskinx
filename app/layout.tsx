import type { Metadata } from "next"
import { Playfair_Display, Inter, DM_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Preloader from "./components/Preloader"

const syne = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
  preload: false,
})

const dmSans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: "OuterSkinX — Wholesale Skincare",
    template: "%s | OuterSkinX",
  },
  description:
    "Premium wholesale skincare for verified distributors and retailers. Browse curated brands, place bulk orders, and track shipments — all in one platform.",
  keywords: ["wholesale skincare", "bulk skincare", "skincare distributor", "skincare retailer", "OuterSkinX"],
  metadataBase: new URL("https://wholesale.outerskinx.com"),
  openGraph: {
    title: "OuterSkinX — Wholesale Skincare",
    description: "Premium wholesale skincare for verified distributors and retailers.",
    url: "https://wholesale.outerskinx.com",
    siteName: "OuterSkinX",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OuterSkinX — Wholesale Skincare",
    description: "Premium wholesale skincare for verified distributors and retailers.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} h-full`}
    >
      <head>
        <style>{`html.preloading body { overflow: hidden; }`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!window.__osx_preloader_seen){document.documentElement.classList.add('preloading');}})();`,
          }}
        />
        <Preloader />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  )
}