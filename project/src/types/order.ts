export interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  description: string;
  price: number;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

export interface Deliverables {
  files: string[];
  note: string | null;
  submittedAt: string;
}

export interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: RatePlan;
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
  deliverables?: Deliverables;
}