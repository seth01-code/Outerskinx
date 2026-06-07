import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectDB } from "../../../lib/mongodb"
import WholesaleOrder from "../../../models/WholesaleOrder"
import Buyer from "../../../models/Buyer"
import { sendOrderConfirmationEmail } from "../../../lib/email"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
      .update(rawBody)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === "charge.success") {
      const { reference, metadata } = event.data
      const orderId = metadata?.orderId

      if (!orderId) {
        return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 })
      }

      await connectDB()

      const order = await WholesaleOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "confirmed",
            "paystack.reference": reference,
            "paystack.status": "success",
            "paystack.paidAt": new Date(),
          },
        },
        { new: true }
      )

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Send confirmation email
      const buyer = await Buyer.findById(order.buyer)
      if (buyer) {
        try {
          await sendOrderConfirmationEmail({
            email: buyer.email,
            contactName: buyer.contactName,
            businessName: buyer.businessName,
            orderId: order._id.toString(),
            total: order.total,
            itemCount: order.items.length,
          })
        } catch (emailError) {
          console.error("Confirmation email failed:", emailError)
        }
      }
    }

    if (event.event === "charge.failed") {
      const { reference, metadata } = event.data
      const orderId = metadata?.orderId

      if (orderId) {
        await connectDB()
        await WholesaleOrder.findByIdAndUpdate(orderId, {
          $set: {
            "paystack.reference": reference,
            "paystack.status": "failed",
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Paystack webhook error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}