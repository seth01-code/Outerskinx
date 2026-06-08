import { NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"
import { connectDB } from "../../../lib/mongodb"
import Buyer from "../../../models/Buyer"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ session: null })

    if (session.role === "buyer") {
      await connectDB()
      const buyer = await Buyer.findById(session.id).select("profileImage").lean() as { profileImage?: string } | null
      return NextResponse.json({
        session: {
          ...session,
          profileImage: buyer?.profileImage ?? null,
        }
      })
    }

    return NextResponse.json({ session })
  } catch {
    return NextResponse.json({ session: null })
  }
}