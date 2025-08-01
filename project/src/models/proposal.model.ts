import mongoose, { Schema, Document } from "mongoose";

export interface IProposal extends Document {
  projectId: string;
  talentId: string;
  bid: number;
  coverLetter: string;
  files?: string[];
  proposalStatus: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema: Schema = new Schema({
  projectId: { type: String, required: true },
  talentId: { type: String, required: true },
  bid: { type: Number, required: true, min: 10 },
  coverLetter: { type: String, required: true, minlength: 10, maxlength: 1000 },
  files: { type: [String], default: [] },
  proposalStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProposalModel || mongoose.model<IProposal>("ProposalModel", ProposalSchema);