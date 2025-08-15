import { Socket } from "socket.io";

export interface DashboardData {
  totalOrders: number;
  ordersByStatus: {
    pending: number;
    inProgress: number;
    accepted: number;
    rejected: number;
    delivered: number;
    completed: number;
    cancelled: number;
  };
  revisionStatusCounts: {
    none: number;
    requested: number;
    submitted: number;
  };
  recentOrders: {
    _id: string;
    talentId: string;
    clientId: string;
    clientUserName: string;
    talentUserName: string; // Added talentUserName
    ratePlan: {
      type: "Basic" | "Standard" | "Premium";
      price: number;
      description: string;
      whatsIncluded: string[];
      deliveryDays: number;
      revisions: number;
    };
    projectDetails: {
      title: string;
      description: string;
    };
    status: string;
    revisionStatus: string;
    revisionCount: number;
    createdAt: string;
    updatedAt: string;
    revisionRequest?: {
      files: string[];
      note?: string;
      requestedAt: string;
    };

 
  }[];
  
}

   export interface LeanMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  conversationId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date; 
  isRead: boolean;
}

export interface AuthenticatedSocket extends Socket {
  userId: string;
}



// export interface LeanProject {
//   _id: string;
//   title: string;
//   status: string;
//   createdAt: Date;
//   updatedAt: Date;
//   proposalCount?: number;
// }

// export interface LeanOrder {
//   _id: string;
//   projectDetails: { title: string; description: string };
//   status: string;
//   createdAt: Date;
//   updatedAt: Date;
//   talentId: { userName: string };
//   clientId: { userName: string };
// }



// export interface DashboardData {
//   totalProjects: number;
//   projectsByStatus: { open: number; inProgress: number; completed: number; cancelled: number };
//   totalOrders: number;
//   ordersByStatus: { pending: number; accepted: number; rejected: number; completed: number; cancelled: number };
//   activeProposals: number;
//   disputes: number;
//   recentActivity: { id: string; title: string; type: string; timestamp: Date }[];
//   highPriorityIssues: { id: string; title: string; issue: string; type: "project" | "order" }[];
// }

