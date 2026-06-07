import { NextResponse } from "next/server"
import { connectDB } from "../../lib/mongodb"
import Brand from "../../models/Brand"
import { getSession } from "../../lib/auth"

export async function GET() {
  try {
    await connectDB()
    console.log("Connected, fetching brands...")
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean()
    console.log("Found:", brands.length)
    return NextResponse.json({ brands })
  } catch (error) {
    console.error("Brands fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}