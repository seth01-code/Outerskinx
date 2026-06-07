import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../../lib/mongodb"
import Product from "../../../../models/Product"
import Brand from "../../../../models/Brand"
import { getSession } from "../../../../lib/auth"
import * as XLSX from "xlsx"

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

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: "Sheet is empty" }, { status: 400 })
    }

    // Build brand map once
    const brands = await Brand.find().lean()
    const brandMap: Record<string, string> = {}
    for (const b of brands) {
      brandMap[b.name.toLowerCase()] = b._id.toString()
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const row of rows) {
      const sku = (row["sku"] || "").trim()
      const name = (row["name"] || "").trim()
      const brandName = (row["brand"] || "").trim()
      const retailPrice = parseFloat(row["retail_price"] || "0")

      if (!sku || !name || !brandName || !retailPrice) {
        results.errors.push(`Row skipped — missing required field (sku: ${sku || "??"})`)
        results.skipped++
        continue
      }

      const brandId = brandMap[brandName.toLowerCase()]
      if (!brandId) {
        results.errors.push(`SKU ${sku} — brand "${brandName}" not found`)
        results.skipped++
        continue
      }

      const slug = slugify(name) || slugify(sku)

      // Build wholesale pricing array
      const wholesalePricing = []
      if (row["wholesale_retailer_price"] && row["wholesale_retailer_moq"]) {
        wholesalePricing.push({
          tier: "retailer",
          price: parseFloat(row["wholesale_retailer_price"]),
          moq: parseInt(row["wholesale_retailer_moq"], 10),
        })
      }
      if (row["wholesale_distributor_price"] && row["wholesale_distributor_moq"]) {
        wholesalePricing.push({
          tier: "distributor",
          price: parseFloat(row["wholesale_distributor_price"]),
          moq: parseInt(row["wholesale_distributor_moq"], 10),
        })
      }
      if (row["wholesale_premium_price"] && row["wholesale_premium_moq"]) {
        wholesalePricing.push({
          tier: "premium",
          price: parseFloat(row["wholesale_premium_price"]),
          moq: parseInt(row["wholesale_premium_moq"], 10),
        })
      }

      const payload = {
        sku,
        name,
        slug,
        brand: brandId,
        categories: row["categories"]
          ? row["categories"].split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        tags: row["tags"]
          ? row["tags"].split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        shortDescription: (row["short_description"] || "").trim(),
        description: (row["description"] || "").trim(),
        images: row["images"]
          ? row["images"].split(",").map((i) => i.trim()).filter(Boolean)
          : [],
        retailPrice,
        salePrice: row["sale_price"] ? parseFloat(row["sale_price"]) : undefined,
        stock: parseInt(row["stock"] || "0", 10),
        inStock:
          row["in_stock"] === "1" || row["in_stock"]?.toLowerCase() === "true",
        weightG: row["weight_g"] ? parseFloat(row["weight_g"]) : undefined,
        wholesalePricing,
        isActive:
          row["is_active"] === "1" || row["is_active"]?.toLowerCase() === "true",
      }

      const existing = await Product.findOne({ sku })
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: payload })
        results.updated++
      } else {
        await Product.create(payload)
        results.created++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Product import error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}