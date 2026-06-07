import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../../lib/mongodb"
import Product from "../../../../models/Product"
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

    await connectDB()

    const allowedFields = [
      "name",
      "brand",
      "categories",
      "tags",
      "shortDescription",
      "description",
      "images",
      "retailPrice",
      "salePrice",
      "stock",
      "inStock",
      "weightG",
      "wholesalePricing",
      "isActive",
    ]

    const update: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field]
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).populate("brand", "name slug")

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const product = await Product.findByIdAndDelete(id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product delete error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}