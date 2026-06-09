import mongoose, { Schema, Document } from "mongoose"

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  sku: string
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface IPaystackDetails {
  reference: string
  accessCode?: string
  status: "pending" | "success" | "failed"
  paidAt?: Date
}

export interface IDHLDetails {
  shipmentId?: string
  trackingNumber?: string
  labelUrl?: string
  estimatedDelivery?: Date
  pickupConfirmationNumber?: string
  pickupCreatedAt?: Date
}

export interface IWholesaleOrder extends Document {
  buyer: mongoose.Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  total: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: "paystack" | "bank_transfer" | "net_terms"
  paystack?: IPaystackDetails
  dhl?: IDHLDetails
  poNumber?: string
  poFileUrl?: string
  invoiceUrl?: string
  deliveryAddress: {
    street: string
    city: string
    state: string
    country: string
    postalCode?: string
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
)

const WholesaleOrderSchema = new Schema<IWholesaleOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["paystack", "bank_transfer", "net_terms"],
      required: true,
    },
    paystack: {
      reference: { type: String },
      accessCode: { type: String },
      status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
      paidAt: { type: Date },
    },
    dhl: {
      shipmentId: { type: String },
      trackingNumber: { type: String },
      labelUrl: { type: String },
      estimatedDelivery: { type: Date },
      pickupConfirmationNumber: { type: String },
      pickupCreatedAt: { type: Date },
    },
    poNumber: { type: String },
    poFileUrl: { type: String },
    invoiceUrl: { type: String },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String },
    },
    notes: { type: String },
  },
  { timestamps: true }
)

WholesaleOrderSchema.index({ buyer: 1 })
WholesaleOrderSchema.index({ status: 1 })
WholesaleOrderSchema.index({ createdAt: -1 })

export default mongoose.models.WholesaleOrder ||
  mongoose.model<IWholesaleOrder>("WholesaleOrder", WholesaleOrderSchema)