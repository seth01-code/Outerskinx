import { NextRequest, NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"

const DHL_BASE = "https://express.api.dhl.com/mydhlapi/test"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const trackingNumber = req.nextUrl.searchParams.get("trackingNumber")
    if (!trackingNumber) {
      return NextResponse.json({ error: "trackingNumber required" }, { status: 400 })
    }

    const credentials = Buffer.from(
      `${process.env.DHL_API_KEY}:${process.env.DHL_API_SECRET}`
    ).toString("base64")

    const res = await fetch(
      `${DHL_BASE}/shipments/${trackingNumber}/tracking?trackingView=all-checkpoints&levelOfDetail=all`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error("DHL tracking error:", data)
      return NextResponse.json({ error: "Tracking fetch failed", dhlError: data }, { status: 502 })
    }

    // Normalise the response — DHL returns shipments array
    const shipment = data.shipments?.[0]
    const events = (shipment?.events || []).map((e: {
      timestamp: string
      location?: { address?: { addressLocality?: string; countryCode?: string } }
      description: string
      typeCode: string
    }) => ({
      timestamp: e.timestamp,
      location: [
        e.location?.address?.addressLocality,
        e.location?.address?.countryCode,
      ].filter(Boolean).join(", "),
      description: e.description,
      typeCode: e.typeCode,
    }))

    return NextResponse.json({
      trackingNumber,
      status: shipment?.status,
      estimatedDelivery: shipment?.estimatedTimeOfDelivery,
      events,
    })
  } catch (error) {
    console.error("Tracking error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}