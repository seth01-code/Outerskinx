import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../../lib/mongodb"
import WholesaleOrder from "../../../models/WholesaleOrder"
import Buyer from "../../../models/Buyer"
import { getSession } from "../../../lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const order = await WholesaleOrder.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.buyer.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const buyer = await Buyer.findById(session.id)
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    // Initialize transaction with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: buyer.email,
        amount: Math.round(order.total * 100), // Paystack uses kobo
        reference: `OSX-${orderId}-${Date.now()}`,
        metadata: {
          orderId: orderId,
          businessName: buyer.businessName,
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderId}?payment=success`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Paystack initialization failed" },
        { status: 500 }
      )
    }

    // Save access code to order
    await WholesaleOrder.findByIdAndUpdate(orderId, {
      $set: {
        "paystack.accessCode": data.data.access_code,
        "paystack.reference": data.data.reference,
        "paystack.status": "pending",
      },
    })

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}