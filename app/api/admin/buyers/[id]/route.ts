import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../../lib/mongodb"
import Buyer from "../../../../models/Buyer"
import { getSession } from "../../../../lib/auth"
import { sendWelcomeEmail } from "../../../../lib/email"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, buyerTier } = body

    const validStatuses = ["pending", "approved", "suspended"]
    const validTiers = ["retailer", "distributor", "premium"]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (buyerTier && !validTiers.includes(buyerTier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    await connectDB()

    const previousBuyer = await Buyer.findById(id)
    if (!previousBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    const update: Record<string, string> = {}
    if (status) update.status = status
    if (buyerTier) update.buyerTier = buyerTier

    const buyer = await Buyer.findByIdAndUpdate(id, update, { new: true }).select("-passwordHash")

    // Send welcome email when buyer is approved for the first time
    if (status === "approved" && previousBuyer.status !== "approved") {
      try {
        await sendWelcomeEmail({
          email: buyer.email,
          contactName: buyer.contactName,
          businessName: buyer.businessName,
          buyerTier: buyer.buyerTier,
        })
      } catch (emailError) {
        console.error("Welcome email failed:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ buyer })
  } catch (error) {
    console.error("Buyer update error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}