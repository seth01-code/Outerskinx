import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import WholesaleOrder from "../../../models/WholesaleOrder"
import { getSession } from "../../../lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = {}
    if (status) query.status = status

    const [orders, total] = await Promise.all([
      WholesaleOrder.find(query)
        .populate("buyer", "businessName contactName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WholesaleOrder.countDocuments(query),
    ])

    return NextResponse.json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Admin orders fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}