export interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: {
    type: "Basic" | "Standard" | "Premium";
    description: string;
    price: number;
    whatsIncluded: string[];
    deliveryDays: number;
    revisions: number;
  };
  projectDetails: {
    title: string;
    description: string;
  };
  status:
    | "pending"
    | "in-progress"
    | "accepted"
    | "rejected"
    | "delivered"
    | "completed"
    | "cancelled";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled"; // Added
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  talentUserName?: string;
  clientUserName?: string;
  deliverables?: {
    files: string[];
    note: string | null;
    submittedAt: string;
  };
}