import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../lib/mongodb"
import Buyer from "../../models/Buyer"
import { getSession } from "../../lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const buyer = await Buyer.findById(session.id).select("-passwordHash").lean()

    if (!buyer) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ buyer })
  } catch (error) {
    console.error("Account fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { contactName, phone, address, savedAddresses } = body

    const update: Record<string, unknown> = {}
    if (contactName) update.contactName = contactName
    if (phone) update.phone = phone
    if (address) update.address = address
    if (savedAddresses) update.savedAddresses = savedAddresses

    const buyer = await Buyer.findByIdAndUpdate(
      session.id,
      { $set: update },
      { new: true }
    ).select("-passwordHash")

    if (!buyer) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ buyer })
  } catch (error) {
    console.error("Account update error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}