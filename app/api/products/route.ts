import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../lib/mongodb"  // ← one more ../
import Product from "../../models/Product"      // ← one more ../
import { getSession } from "../../lib/auth"     // ← one more ../

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const brand = searchParams.get("brand")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "24", 10)
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = { isActive: true }

    if (brand) query.brand = brand
    if (category) query.categories = category
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}