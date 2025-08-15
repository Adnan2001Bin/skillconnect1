import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  _id: string;
  title: string;
  description: string;
  category: string;
  services: string[];
  budget: number;
  timeline: number;
  requirements: string;
  files?: string[];
  clientId: string;
  talentId?: string;
  status: "open" | "in-progress" | "completed" | "cancelled";
  deliverables?: {
    files: string[];
    note?: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title: { type: String, required: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, minlength: 10, maxlength: 1000 },
    category: { type: String, required: true },
    services: { type: [String], required: true, minlength: 1 },
    budget: { type: Number, required: true, min: 10, max: 100000 },
    timeline: { type: Number, required: true, min: 1, max: 365 },
    requirements: { type: String, required: true, minlength: 10, maxlength: 1000 },
    files: { type: [String], default: [] },
    clientId: { type: String, required: true },
    talentId: { type: String, default: null },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    deliverables: {
      files: { type: [String], default: [] },
      note: { type: String, maxlength: 1000, default: null },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

export default mongoose.models.ProjectModel || mongoose.model<IProject>("ProjectModel", ProjectSchema);