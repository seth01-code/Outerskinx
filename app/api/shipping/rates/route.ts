import { NextRequest, NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"

const DHL_BASE_URL = "https://express.api.dhl.com/mydhlapi/test"

// Shipper origin — Lagos hub
const SHIPPER = {
  addressLine1: "OuterSkinX Warehouse, Lagos",
  postalCode: "100001",
  cityName: "Lagos",
  countyName: "Lagos",
  countryCode: "NG",
}

function getCountryCode(country: string): string {
  const map: Record<string, string> = {
    nigeria: "NG", gh: "GH", ghana: "GH", kenya: "KE",
    "south africa": "ZA", "united kingdom": "GB", uk: "GB",
    "united states": "US", usa: "US", canada: "CA",
    france: "FR", germany: "DE", uae: "AE",
    "united arab emirates": "AE",
  }
  return map[country?.toLowerCase()] || country?.toUpperCase().slice(0, 2) || "NG"
}

function isInternational(countryCode: string): boolean {
  return countryCode !== "NG"
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { deliveryAddress, items } = body

    if (!deliveryAddress || !items?.length) {
      return NextResponse.json(
        { error: "Delivery address and items are required" },
        { status: 400 }
      )
    }

    const totalWeightKg = items.reduce(
      (sum: number, item: { weightG?: number; qty: number }) =>
        sum + ((item.weightG || 500) * item.qty) / 1000,
      0
    )

    // Tomorrow, formatted as required: 2025-01-15T10:00:00GMT+01:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split("T")[0]
    const plannedShippingDateAndTime = `${dateStr}T10:00:00GMT+01:00`

    const receiverCountryCode = getCountryCode(deliveryAddress.country || "NG")
    const international = isInternational(receiverCountryCode)

    // Per the DHL doc:
    // Within NG → productCode: N, account: EXP (shipper)
    // NG → International → productCode: P (non-doc), account: EXP (shipper)
    const productCode = international ? "P" : "N"
    const accountNumber = process.env.DHL_ACCOUNT_NUMBER_EXP || process.env.DHL_ACCOUNT_NUMBER

    const requestBody = {
      plannedShippingDateAndTime,
      productCode,
      unitOfMeasurement: "metric",
      isCustomsDeclarable: international,
      nextBusinessDay: true,
      accounts: [
        {
          number: accountNumber,
          typeCode: "shipper",
        },
      ],
      customerDetails: {
        shipperDetails: {
          addressLine1: SHIPPER.addressLine1,
          postalCode: SHIPPER.postalCode,
          cityName: SHIPPER.cityName,
          countyName: SHIPPER.countyName,
          countryCode: SHIPPER.countryCode,
        },
        receiverDetails: {
          addressLine1: deliveryAddress.street || "Delivery Address",
          postalCode: deliveryAddress.postalCode || "",
          cityName: deliveryAddress.city || "",
          countyName: deliveryAddress.state || "",
          countryCode: receiverCountryCode,
        },
      },
      packages: [
        {
          weight: Math.max(0.1, Math.round(totalWeightKg * 100) / 100),
          dimensions: {
            length: 30,
            width: 30,
            height: 30,
          },
        },
      ],
    }

    const credentials = Buffer.from(
      `${process.env.DHL_API_KEY}:${process.env.DHL_API_SECRET}`
    ).toString("base64")

    console.log("DHL rates request:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${DHL_BASE_URL}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("DHL rates error:", JSON.stringify(data, null, 2))
      return NextResponse.json({
        rates: [],
        fallback: true,
        message: "Live rates unavailable. Shipping will be calculated manually.",
        debug: process.env.NODE_ENV === "development" ? data : undefined,
      })
    }

    const rates = (data.products || []).map(
      (product: {
        productName: string
        productCode: string
        totalPrice: { price: number; priceCurrency: string; typeCode: string }[]
        deliveryCapabilities: { estimatedDeliveryDateAndTime: string }
      }) => {
        // Prefer NGN price; fall back to first available
        const ngnPrice = product.totalPrice?.find((p) => p.priceCurrency === "NGN")
        const anyPrice = product.totalPrice?.[0]
        const chosen = ngnPrice || anyPrice

        return {
          productName: product.productName,
          productCode: product.productCode,
          price: chosen?.price || 0,
          currency: chosen?.priceCurrency || "NGN",
          estimatedDelivery:
            product.deliveryCapabilities?.estimatedDeliveryDateAndTime || null,
        }
      }
    )

    return NextResponse.json({ rates, totalWeightKg })
  } catch (error) {
    console.error("DHL rate error:", error)
    return NextResponse.json({
      rates: [],
      fallback: true,
      message: "Live rates unavailable. Shipping will be calculated manually.",
    })
  }
}