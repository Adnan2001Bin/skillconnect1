import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  conversationId: { type: String, required: true }, // Unique ID for conversation (e.g., sorted user IDs)
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

export default mongoose.models.Message || mongoose.model("Message", messageSchema);