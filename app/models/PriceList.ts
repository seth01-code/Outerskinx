import mongoose, { Schema, Document } from "mongoose"

export interface IPriceListItem {
  product: mongoose.Types.ObjectId
  moq: number
  price: number
}

export interface IPriceList extends Document {
  tier: "retailer" | "distributor" | "premium"
  effectiveDate: Date
  items: IPriceListItem[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PriceListItemSchema = new Schema<IPriceListItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    moq: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
)

const PriceListSchema = new Schema<IPriceList>(
  {
    tier: {
      type: String,
      enum: ["retailer", "distributor", "premium"],
      required: true,
    },
    effectiveDate: { type: Date, required: true, default: Date.now },
    items: [PriceListItemSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

PriceListSchema.index({ tier: 1, isActive: 1 })

export default mongoose.models.PriceList ||
  mongoose.model<IPriceList>("PriceList", PriceListSchema)