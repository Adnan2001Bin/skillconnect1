 import mongoose from "mongoose";

  const transactionSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    talentId: { type: String, required: true },
    clientId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    talentUserName: { type: String },
    clientUserName: { type: String },
  });

  const TransactionModel = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
  export default TransactionModel;