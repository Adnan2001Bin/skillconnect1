import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import ProjectModel from "@/models/projects.model";
import UserModel from "@/models/user.model";
import { authOptions } from "../auth/[...nextauth]/options";
import proposalModel, { IProposal } from "@/models/proposal.model";

// Interfaces for proper typing
interface LeanOrder {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: {
    price: number;
  };
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

interface LeanProject {
  _id: string;
  clientId: string;
  budget: number;
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

interface LeanUser {
  _id: string;
  userName: string;
}

interface TransactionData {
  _id: string;
  orderId?: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  talentName: string;
  type: "order" | "project";
}

interface TransactionResponse {
  success: boolean;
  message: string;
  data?: TransactionData[];
  error?: string;
}

export async function GET(): Promise<NextResponse<TransactionResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can view their payments." },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch orders
    const orders = await OrderModel.find({ clientId: session.user._id }).lean<LeanOrder[]>();
    const orderTransactions = await Promise.all(
      orders.map(async (order) => {
        const talent = await UserModel.findById(order.talentId).select("userName").lean<LeanUser>();
        return {
          _id: order._id.toString(),
          orderId: order._id.toString(),
          amount: order.ratePlan.price,
          currency: "USD",
          status: order.paymentStatus,
          createdAt: order.createdAt.toISOString(),
          talentName: talent?.userName || "Unknown",
          type: "order" as const,
        };
      })
    );

    // Fetch projects
    const projects = await ProjectModel.find({ clientId: session.user._id }).lean<LeanProject[]>();
    const projectTransactions = await Promise.all(
      projects.map(async (project) => {
        // Find a proposal in accepted, delivered, or revision-requested state
        const proposal = await proposalModel
          .findOne({
            projectId: project._id,
            proposalStatus: { $in: ["accepted", "delivered", "revision-requested"] },
          })
          .lean<IProposal>();
        const talent = proposal
          ? await UserModel.findById(proposal.talentId).select("userName").lean<LeanUser>()
          : null;
        return {
          _id: project._id.toString(),
          projectId: project._id.toString(),
          amount: project.budget,
          currency: "USD",
          status: project.paymentStatus,
          createdAt: project.createdAt.toISOString(),
          talentName: talent?.userName || "Unknown",
          type: "project" as const,
        };
      })
    );

    // Combine transactions
    const transactions = [...orderTransactions, ...projectTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        message: "Transactions fetched successfully",
        data: transactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching client payments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch payments.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}