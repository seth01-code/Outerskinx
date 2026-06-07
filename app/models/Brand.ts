import mongoose, { Schema, Document } from "mongoose"

export interface IBrand extends Document {
  name: string
  slug: string
  logo?: string
  description?: string
  country?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    description: { type: String },
    country: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema)