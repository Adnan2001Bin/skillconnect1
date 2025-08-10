import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  talentId: string;
  clientId: string;
  ratePlan: {
    type: string;
    price: number;
    description: string;
    whatsIncluded: string[];
    deliveryDays: number;
  };
  projectDetails: {
    title: string;
    description: string;
  };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "completed" | "cancelled";
  deliverables?: {
    files: string[];
    note?: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    talentId: { type: String, required: true },
    clientId: { type: String, required: true },
    ratePlan: {
      type: {
        type: String,
        required: true,
      },
      price: { type: Number, required: true },
      description: { type: String, required: true },
      whatsIncluded: [{ type: String }],
      deliveryDays: { type: Number, required: true },
    },
    projectDetails: {
      title: { type: String, required: true },
      description: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    deliverables: {
      files: { type: [String], default: [] },
      note: { type: String, maxlength: 1000, default: null },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Prevent model redefinition
const OrderModel = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default OrderModel;