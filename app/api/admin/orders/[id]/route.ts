import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../../lib/mongodb"
import WholesaleOrder from "../../../../models/WholesaleOrder"
import { getSession } from "../../../../lib/auth"

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
    const { status, trackingNumber, shipmentId, labelUrl, estimatedDelivery } = body

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectDB()

    const update: Record<string, unknown> = {}
    if (status) update.status = status
    if (trackingNumber) update["dhl.trackingNumber"] = trackingNumber
    if (shipmentId) update["dhl.shipmentId"] = shipmentId
    if (labelUrl) update["dhl.labelUrl"] = labelUrl
    if (estimatedDelivery) update["dhl.estimatedDelivery"] = new Date(estimatedDelivery)

    const order = await WholesaleOrder.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("buyer", "businessName contactName email")
      .lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Admin order update error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}