import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
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
    const { name, country, description, logo, isActive } = body

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 })
    }

    const slug = slugify(name)

    const existing = await Brand.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: "Brand already exists" }, { status: 409 })
    }

    const brand = await Brand.create({
      name: name.trim(),
      slug,
      country: country || undefined,
      description: description || undefined,
      logo: logo || undefined,
      isActive: isActive ?? true,
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error("Brand create error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const brands = await Brand.find({}).sort({ name: 1 }).lean()
    return NextResponse.json({ brands })
  } catch (error) {
    console.error("Brands fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}