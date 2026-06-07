import { connectDB } from "../../lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ status: "ok", db: "connected" })
  } catch (error) {
    return NextResponse.json({ status: "error", db: "disconnected", error: String(error) }, { status: 500 })
  }
}