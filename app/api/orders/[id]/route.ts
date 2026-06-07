import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import WholesaleOrder from "../../../models/WholesaleOrder"
import { getSession } from "../../../lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const order = await WholesaleOrder.findById(id)
      .populate("buyer", "businessName contactName email phone")
      .populate("items.product", "name sku images")
      .lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Buyers can only see their own orders
    if (
      session.role === "buyer" &&
      order.buyer._id.toString() !== session.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}