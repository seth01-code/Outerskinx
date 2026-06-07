import { NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Product from "../../../models/Product"
import Brand from "../../../models/Brand"
import { getSession } from "../../../lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const [brands, categories] = await Promise.all([
      Brand.find({ isActive: true }).select("name slug").sort({ name: 1 }).lean(),
      Product.distinct("categories", { isActive: true }),
    ])

    const sortedCategories = (categories as string[])
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({ brands, categories: sortedCategories })
  } catch (error) {
    console.error("Filters fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}