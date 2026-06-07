import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Product from "../../../models/Product"
import { getSession } from "../../../lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    await connectDB()

    const product = await Product.findOne({ slug, isActive: true })
      .populate("brand", "name slug country")
      .lean()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}