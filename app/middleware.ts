import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string)
const COOKIE_NAME = "osx_session"

const buyerRoutes = ["/catalogue", "/cart", "/checkout", "/orders", "/account"]
const adminRoutes = ["/admin"]
const authRoutes = ["/login", "/register"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isBuyerRoute = buyerRoutes.some((r) => pathname.startsWith(r))
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r))

  const token = req.cookies.get(COOKIE_NAME)?.value
  let session = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      session = payload as {
        id: string
        email: string
        role: "buyer" | "admin"
        status?: string
      }
    } catch {
      session = null
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && session) {
    const dest = session.role === "admin" ? "/admin" : "/catalogue"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Protect buyer routes
  if (isBuyerRoute) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url))
    }
    if (session.status === "pending") {
      return NextResponse.redirect(new URL("/pending-approval", req.url))
    }
    if (session.status === "suspended") {
      return NextResponse.redirect(new URL("/suspended", req.url))
    }
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?next=${pathname}", req.url))
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/catalogue", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/catalogue/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}