import { Socket } from "socket.io";

export interface LeanProject {
  _id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  proposalCount?: number;
}

export interface LeanOrder {
  _id: string;
  projectDetails: { title: string; description: string };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  talentId: { userName: string };
  clientId: { userName: string };
}

export interface LeanMessage {
  _id: string;
  senderId: string | { userName: string | null }; // Allow userName to be null
  receiverId: string | { userName: string | null }; // Allow userName to be null
  content: string;
  conversationId: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isRead: boolean;
}

export interface DashboardData {
  totalProjects: number;
  projectsByStatus: { open: number; inProgress: number; completed: number; cancelled: number };
  totalOrders: number;
  ordersByStatus: { pending: number; accepted: number; rejected: number; completed: number; cancelled: number };
  activeProposals: number;
  disputes: number;
  recentActivity: { id: string; title: string; type: string; timestamp: Date }[];
  highPriorityIssues: { id: string; title: string; issue: string; type: "project" | "order" }[];
}


export interface AuthenticatedSocket extends Socket {
  userId: string;
}