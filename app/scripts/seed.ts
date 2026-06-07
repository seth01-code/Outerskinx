import * as XLSX from "xlsx"
import mongoose from "mongoose"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import Brand from "../models/Brand"
import Product from "../models/Product"

const XLSX_PATH = path.join(process.cwd(), "wc-product-export.xlsx")

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function cleanCategory(raw: string): string[] {
  const map: Record<string, string> = {
    "cleansers": "Cleanser",
    "cleanser": "Cleanser",
    "moisturizer": "Moisturizer",
    "moisturizers": "Moisturizer",
    "face moisturizer": "Moisturizer",
    "serums": "Serum",
    "serum": "Serum",
    "toner": "Toner",
    "toners": "Toner",
    "body wash": "Body Wash",
    "body bath": "Body Wash",
    "body lotion": "Body Lotion",
    "body oil": "Body Oil",
    "body cream": "Body Cream",
    "body scrubs": "Body Scrub",
    "scrub": "Body Scrub",
    "bar soap": "Bar Soap",
    "sheet mask": "Sheet Mask",
    "mask": "Mask",
    "eye mask": "Eye Mask",
    "eye cream": "Eye Cream",
    "sunscreen": "Sunscreen",
    "sunscreens": "Sunscreen",
    "hair care": "Hair Care",
    "fragrance": "Fragrance",
    "supplement": "Supplement",
    "lip care": "Lip Care",
    "lip gloss": "Lip Care",
    "lip balm": "Lip Care",
    "deodorant": "Deodorant",
    "hand lotion": "Hand Lotion",
    "patch": "Patch",
    "gel": "Gel",
    "skin primer": "Skin Primer",
    "lotion": "Body Lotion",
    "face lotion": "Moisturizer",
    "face kit": "Kit",
    "wash": "Body Wash",
    "treatment lotion": "Treatment",
    "body treatment": "Treatment",
    "detox mask": "Mask",
    "cleansing": "Cleanser",
    "cream": "Moisturizer",
  }
  return raw
    .split(",")
    .map((c) => {
      const key = c.trim().toLowerCase()
      return map[key] || c.trim()
    })
    .filter(Boolean)
}

function cleanBrandName(raw: string): string {
  const map: Record<string, string> = {
    "face facts": "Face Facts",
    "st ives": "St. Ives",
    "dr teals": "Dr. Teal's",
    "la roche posay": "La Roche-Posay",
    "skin by zaron": "Skin By Zaron",
    "25 pskyn": "25 PSKYN",
  }
  const key = raw.trim().toLowerCase()
  return map[key] || raw.trim()
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string)
  console.log("✓ Connected to MongoDB")

  const workbook = XLSX.readFile(XLSX_PATH)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)
  console.log(`✓ Read ${rows.length} rows from Excel`)

  // ── Brands ──────────────────────────────────────────────────
  const brandNames = [
    ...new Set(rows.map((r) => cleanBrandName(r["Brand"] || "")).filter(Boolean)),
  ]

  console.log(`\nSeeding ${brandNames.length} brands...`)
  const brandMap: Record<string, mongoose.Types.ObjectId> = {}

  for (const name of brandNames) {
    const slug = slugify(name)
    const brand = await Brand.findOneAndUpdate(
      { slug },
      { name, slug, isActive: true },
      { upsert: true, new: true }
    )
    brandMap[name.toLowerCase()] = brand._id
    process.stdout.write(".")
  }
  console.log("\n✓ Brands seeded")

  // ── Products ─────────────────────────────────────────────────
  console.log(`\nSeeding ${rows.length} products...`)
  let created = 0
  let skipped = 0

  for (const row of rows) {
    const sku = (row["SKU"] || "").trim()
    if (!sku) { skipped++; continue }

    const brandRaw = cleanBrandName(row["Brand"] || "")
    const brandId = brandMap[brandRaw.toLowerCase()]
    if (!brandId) { console.warn(`\n⚠ No brand found for SKU ${sku}: "${brandRaw}"`); skipped++; continue }

    const name = (row["Name"] || "").trim()
    const slug = slugify(name) || slugify(sku)
    const retailPrice = parseFloat(row["Regular price"] || "0")
    const salePrice = row["Sale price"] ? parseFloat(row["Sale price"]) : undefined
    const stock = parseInt(row["Stock"] || "0", 10)
    const inStock = (row["In stock?"] || "0") === "1"
    const weightG = row["Weight (g)"] ? parseFloat(row["Weight (g)"]) : undefined
    const categories = cleanCategory(row["Categories"] || "")
    const tags = (row["Tags"] || "").split(",").map((t: string) => t.trim()).filter(Boolean)
    const images = (row["Images"] || "").split(",").map((i: string) => i.trim()).filter(Boolean)
    const wcId = parseInt(row["ID"] || "0", 10)

    await Product.findOneAndUpdate(
      { sku },
      {
        wcId,
        sku,
        name,
        slug,
        shortDescription: (row["Short description"] || "").trim(),
        description: (row["Description"] || "").trim(),
        images,
        brand: brandId,
        categories,
        tags,
        retailPrice,
        salePrice,
        wholesalePricing: [],
        stock,
        inStock,
        weightG,
        isActive: row["Published"] === "1",
      },
      { upsert: true, new: true }
    )
    created++
    process.stdout.write(".")
  }

  console.log(`\n✓ Products seeded: ${created} upserted, ${skipped} skipped`)
  await mongoose.disconnect()
  console.log("✓ Done")
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})