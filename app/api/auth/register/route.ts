import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"
import Admin from "../../../models/Admin"
import { hashPassword, createSession } from "../../../lib/auth"

function isAdminEmail(email: string) {
  return email.toLowerCase().endsWith("@outerskinx.com")
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { businessName, contactName, email, phone, password, address } = body

    if (!email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    // Admin registration
    if (isAdminEmail(email)) {
      const existing = await Admin.findOne({ email: email.toLowerCase() })
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }

      const admin = await Admin.create({
        email: email.toLowerCase(),
        passwordHash,
        role: "admin",
      })

      await createSession({
        id: admin._id.toString(),
        email: admin.email,
        role: "admin",
      })

      return NextResponse.json({ success: true, role: "admin" }, { status: 201 })
    }

    // Buyer registration
    if (!businessName || !contactName || !phone || !address) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const existing = await Buyer.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const buyer = await Buyer.create({
      businessName,
      contactName,
      email: email.toLowerCase(),
      phone,
      address,
      passwordHash,
      buyerTier: "retailer",
      status: "pending",
    })

    await createSession({
      id: buyer._id.toString(),
      email: buyer.email,
      role: "buyer",
      tier: buyer.buyerTier,
      status: buyer.status,
    })

    return NextResponse.json({ success: true, role: "buyer", status: "pending" }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}