import mongoose, { Schema, Document } from "mongoose"

export interface IWholesaleTier {
  tier: "retailer" | "distributor" | "premium"
  moq: number
  price: number
}

export interface IProduct extends Document {
  wcId: number
  sku: string
  name: string
  slug: string
  shortDescription: string
  description: string
  images: string[]
  brand: mongoose.Types.ObjectId
  categories: string[]
  tags: string[]
  retailPrice: number
  salePrice?: number
  wholesalePricing: IWholesaleTier[]
  stock: number
  inStock: boolean
  weightG?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const WholesaleTierSchema = new Schema<IWholesaleTier>(
  {
    tier: { type: String, enum: ["retailer", "distributor", "premium"], required: true },
    moq: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
)

const ProductSchema = new Schema<IProduct>(
  {
    wcId: { type: Number },
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    categories: [{ type: String }],
    tags: [{ type: String }],
    retailPrice: { type: Number, required: true },
    salePrice: { type: Number },
    wholesalePricing: [WholesaleTierSchema],
    stock: { type: Number, default: 0 },
    inStock: { type: Boolean, default: false },
    weightG: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

ProductSchema.index({ brand: 1 })
ProductSchema.index({ categories: 1 })
ProductSchema.index({ isActive: 1 })

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)