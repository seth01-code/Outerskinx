import { NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"
import { getSession } from "../../../lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const buyers = await Buyer.find().sort({ createdAt: -1 }).select("-passwordHash")
    return NextResponse.json({ buyers })
  } catch (error) {
    console.error("Buyers fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}