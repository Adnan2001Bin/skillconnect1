import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model"; // Import IOrder
import ProposalModel  from "@/models/proposal.model"; // Import IProposal if you have it
import UserModel from "@/models/user.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

interface TransactionResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: "pending" | "completed" | "failed" | "cancelled";
    createdAt: string;
    clientName: string;
    relatedTo: "order" | "project";
  }[];
  error?: string;
}

// Create interfaces for the lean documents
interface LeanOrder {
  _id: mongoose.Types.ObjectId;
  talentId: string;
  clientId: string;
  ratePlan: {
    price: number;
  };
  paymentStatus?: "pending" | "completed" | "failed" | "cancelled";
  createdAt: Date;
}

interface LeanProposal {
  _id: mongoose.Types.ObjectId;
  talentId: string;
  proposalStatus: string;
  bid: number;
  updatedAt: Date;
  projectId?: {
    clientId: mongoose.Types.ObjectId;
    paymentStatus?: "pending" | "completed" | "failed" | "cancelled";
    _id: mongoose.Types.ObjectId;
  };
}

export async function GET(): Promise<NextResponse<TransactionResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their payments." },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch order-related transactions
    const orders = await OrderModel.find({ talentId: session.user._id }).lean<LeanOrder[]>();
    const orderTransactions = await Promise.all(
      orders.map(async (order: LeanOrder) => { // Use LeanOrder instead of any
        const client = await UserModel.findById(order.clientId).select("userName").lean();
        return {
          _id: order._id.toString(),
          orderId: order._id.toString(),
          amount: order.ratePlan.price,
          currency: "USD",
          status: order.paymentStatus || "pending",
          createdAt: order.createdAt.toISOString(),
          clientName: client?.userName || "Unknown",
          relatedTo: "order" as const,
        };
      })
    );

    // Fetch project-related transactions (based on accepted, delivered, or revision-requested proposals)
    const acceptedProposals = await ProposalModel.find({
      talentId: session.user._id,
      proposalStatus: { $in: ["accepted", "delivered", "revision-requested"] },
    })
      .populate({
        path: "projectId",
        select: "clientId title paymentStatus",
        model: ProjectModel,
      })
      .lean<LeanProposal[]>();

    const projectTransactions = await Promise.all(
      acceptedProposals.map(async (proposal: LeanProposal) => { // Use LeanProposal instead of any
        // Get client info from the project
        let clientName = "Unknown";
        let status: "pending" | "completed" | "failed" | "cancelled" = "pending";
        let projectId = "Unknown Project";

        if (proposal.projectId && proposal.projectId.clientId) {
          const client = await UserModel.findById(proposal.projectId.clientId)
            .select("userName")
            .lean();
          clientName = client?.userName || "Unknown";
          status = proposal.projectId.paymentStatus || "pending";
          projectId = proposal.projectId._id.toString();
        }

        return {
          _id: proposal._id.toString(),
          orderId: projectId,
          amount: proposal.bid,
          currency: "USD",
          status,
          createdAt: proposal.updatedAt.toISOString(),
          clientName,
          relatedTo: "project" as const,
        };
      })
    );

    // Combine and sort transactions by createdAt (descending)
    const allTransactions = [...orderTransactions, ...projectTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        message: "Transactions fetched successfully",
        data: allTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching talent payments:", error);
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