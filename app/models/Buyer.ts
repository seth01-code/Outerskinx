import mongoose, { Schema, Document } from "mongoose"

export interface IAddress {
  street: string
  city: string
  state: string
  country: string
  postalCode?: string
}

export interface IBuyer extends Document {
  businessName: string
  contactName: string
  email: string
  phone: string
  address: IAddress
  profileImage?: string
  buyerTier: "retailer" | "distributor" | "premium"
  status: "pending" | "approved" | "suspended"
  passwordHash: string
  savedAddresses: IAddress[]
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String },
  },
  { _id: false }
)

const BuyerSchema = new Schema<IBuyer>(
  {
    businessName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    profileImage: { type: String, default: null },
    address: { type: AddressSchema, required: true },
    buyerTier: {
      type: String,
      enum: ["retailer", "distributor", "premium"],
      default: "retailer",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
    },
    passwordHash: { type: String, required: true },
    savedAddresses: [AddressSchema],
  },
  { timestamps: true }
)

BuyerSchema.index({ email: 1 })
BuyerSchema.index({ status: 1 })

export default mongoose.models.Buyer || mongoose.model<IBuyer>("Buyer", BuyerSchema)