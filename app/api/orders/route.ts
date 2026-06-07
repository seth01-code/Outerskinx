import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../lib/mongodb"
import WholesaleOrder from "../../models/WholesaleOrder"
import Buyer from "../../models/Buyer"
import { getSession } from "../../lib/auth"
import { sendOrderConfirmationEmail } from "../../lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { items, deliveryAddress, paymentMethod, poNumber, notes, shipping  } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    if (!deliveryAddress || !paymentMethod) {
      return NextResponse.json({ error: "Delivery address and payment method are required" }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum: number, i: { unitPrice: number; qty: number }) => sum + i.unitPrice * i.qty,
      0
    )

    const shippingFee = shipping?.price || 0
const total = subtotal + shippingFee

    const order = await WholesaleOrder.create({
      buyer: session.id,
      items,
      subtotal,
      shippingFee,
      tax: 0,
      total,
      status: "pending",
      paymentMethod,
      poNumber,
      deliveryAddress,
      notes,
      // Store the full DHL rate selection
  shipping: shipping
    ? {
        productCode: shipping.productCode,
        productName: shipping.productName,
        price: shipping.price,
        currency: shipping.currency,
        estimatedDelivery: shipping.estimatedDelivery || undefined,
      }
    : undefined,
    })

    const buyer = await Buyer.findById(session.id)
    if (buyer) {
      try {
        await sendOrderConfirmationEmail({
          email: buyer.email,
          contactName: buyer.contactName,
          businessName: buyer.businessName,
          orderId: order._id.toString(),
          total: order.total,
          itemCount: items.length,
        })
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError)
      }
    }

    return NextResponse.json({ success: true, orderId: order._id.toString() }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const orders = await WholesaleOrder.find({ buyer: session.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}