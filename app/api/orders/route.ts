import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "../../lib/mongodb"
import WholesaleOrder from "../../models/WholesaleOrder"
import Buyer from "../../models/Buyer"
import Product from "../../models/Product" // ← add this import
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
    const { items, deliveryAddress, paymentMethod, poNumber, notes, shipping } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    if (!deliveryAddress || !paymentMethod) {
      return NextResponse.json({ error: "Delivery address and payment method are required" }, { status: 400 })
    }

    // ── Enrich items with logistics fields from the product catalogue ──────
    // The cart only carries display data; weightG / hsCode / customsDescription
    // must come from the source of truth (the product document) so that DHL
    // shipment creation and commercial invoices are always accurate.
    const productIds = items.map((i: { product: string }) => i.product)
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id weightG hsCode customsDescription")
      .lean() as { _id: { toString(): string }; weightG?: number; hsCode?: string; customsDescription?: string }[]

    const productMap = new Map(products.map((p) => [p._id.toString(), p]))

    const enrichedItems = items.map((i: {
      product: string
      sku: string
      name: string
      qty: number
      unitPrice: number
      subtotal: number
    }) => {
      const p = productMap.get(i.product)
      return {
        ...i,
        weightG: p?.weightG ?? 500,                  // fallback 500g if not set
        hsCode: p?.hsCode ?? "33049900",              // fallback cosmetics HS code
        customsDescription: p?.customsDescription ?? i.name, // fallback to product name
      }
    })
    // ──────────────────────────────────────────────────────────────────────

    const subtotal = enrichedItems.reduce(
      (sum: number, i: { unitPrice: number; qty: number }) => sum + i.unitPrice * i.qty,
      0
    )

    const shippingFee = shipping?.price || 0
    const total = subtotal + shippingFee

    const order = await WholesaleOrder.create({
      buyer: session.id,
      items: enrichedItems, // ← use enriched items
      subtotal,
      shippingFee,
      tax: 0,
      total,
      status: "pending",
      paymentMethod,
      poNumber,
      deliveryAddress,
      notes,
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