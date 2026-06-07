import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"
import Admin from "../../../models/Admin"
import { verifyPassword, createSession } from "../../../lib/auth"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check admin first
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (admin) {
      const valid = await verifyPassword(password, admin.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }
      await createSession({
        id: admin._id.toString(),
        email: admin.email,
        role: "admin",
      })
      return NextResponse.json({ success: true, role: "admin" })
    }

    // Check buyer
    const buyer = await Buyer.findOne({ email: email.toLowerCase() })
    if (!buyer) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await verifyPassword(password, buyer.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await createSession({
      id: buyer._id.toString(),
      email: buyer.email,
      role: "buyer",
      tier: buyer.buyerTier,
      status: buyer.status,
    })

    return NextResponse.json({
      success: true,
      role: "buyer",
      status: buyer.status,
      tier: buyer.buyerTier,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}