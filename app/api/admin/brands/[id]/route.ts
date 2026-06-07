import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../../lib/mongodb"
import Brand from "../../../../models/Brand"
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

    const allowedFields = ["name", "country", "description", "logo", "isActive"]
    const update: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field]
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    return NextResponse.json({ brand })
  } catch (error) {
    console.error("Brand update error:", error)
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

    const brand = await Brand.findByIdAndDelete(id)
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Brand delete error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}