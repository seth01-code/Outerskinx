import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"
import { getSession } from "../../../lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Validate type and size (max 2MB)
    if (!file.type.startsWith("image/"))
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    if (file.size > 2 * 1024 * 1024)
      return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "outerskinx/avatars",
          public_id: `buyer_${session.id}`,
          overwrite: true,
          transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) reject(error)
          else resolve(result as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })

    await connectDB()
    const buyer = await Buyer.findByIdAndUpdate(
      session.id,
      { $set: { profileImage: result.secure_url } },
      { new: true }
    ).select("-passwordHash")

    return NextResponse.json({ buyer, imageUrl: result.secure_url })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}