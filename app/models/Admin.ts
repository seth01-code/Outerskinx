import mongoose, { Schema, Document } from "mongoose"

export interface IAdmin extends Document {
  email: string
  passwordHash: string
  role: "admin"
  createdAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
)

export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema)