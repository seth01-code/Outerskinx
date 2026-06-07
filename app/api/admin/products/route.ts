import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Product from "../../../models/Product"
import Brand from "../../../models/Brand"
import { getSession } from "../../../lib/auth"

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
      sku,
      name,
      brand,
      categories,
      tags,
      shortDescription,
      description,
      images,
      retailPrice,
      salePrice,
      stock,
      inStock,
      weightG,
      wholesalePricing,
      isActive,
    } = body

    if (!sku || !name || !brand || !retailPrice) {
      return NextResponse.json(
        { error: "SKU, name, brand and retail price are required" },
        { status: 400 }
      )
    }

    const existingSku = await Product.findOne({ sku })
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 })
    }

    const brandDoc = await Brand.findById(brand)
    if (!brandDoc) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    let slug = slugify(name)
    const existingSlug = await Product.findOne({ slug })
    if (existingSlug) slug = `${slug}-${sku.toLowerCase()}`

    const product = await Product.create({
      sku,
      name,
      slug,
      brand,
      categories: categories || [],
      tags: tags || [],
      shortDescription: shortDescription || "",
      description: description || "",
      images: images || [],
      retailPrice,
      salePrice: salePrice || undefined,
      stock: stock || 0,
      inStock: inStock || false,
      weightG: weightG || undefined,
      wholesalePricing: wholesalePricing || [],
      isActive: isActive ?? true,
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Product create error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "24"))
    const search = searchParams.get("search") ?? ""
    const brandSlug = searchParams.get("brand") ?? ""
    const category = searchParams.get("category") ?? ""

    const query: Record<string, unknown> = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ]
    }

    if (brandSlug) {
      const brandDoc = await Brand.findOne({ slug: brandSlug }).select("_id").lean()
      if (brandDoc) query.brand = brandDoc._id
      else query.brand = null // no match → return empty
    }

    if (category) {
      query.categories = category
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
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