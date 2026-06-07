import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"
import { getSession, verifyPassword, hashPassword } from "../../../lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    await connectDB()

    const buyer = await Buyer.findById(session.id)
    if (!buyer) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const valid = await verifyPassword(currentPassword, buyer.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    buyer.passwordHash = await hashPassword(newPassword)
    await buyer.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}