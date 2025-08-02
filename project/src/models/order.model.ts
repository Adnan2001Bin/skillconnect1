import mongoose, { Schema, Document } from "mongoose";

interface IOrder extends Document {
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
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
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
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);