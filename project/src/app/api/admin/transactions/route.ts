import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import OrderModel, { IOrder } from "@/models/order.model";
import ProposalModel from "@/models/proposal.model";
import UserModel, { IUser } from "@/models/user.model";
import ProjectModel, { IProject } from "@/models/projects.model"; // Import Project model
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
  timeRange: z.enum(["7", "30", "90"]).transform((val) => parseInt(val, 10)).optional(),
  search: z.string().optional(),
});

interface Transaction {
  _id: string;
  orderId: string;
  clientId: string;
  talentId: string;
  clientUserName?: string;
  talentUserName?: string;
  amount: number;
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  relatedTo: "order" | "project";
}

interface TransactionsResponse {
  success: boolean;
  data: {
    orderTransactions: Transaction[];
    projectTransactions: Transaction[];
  };
  message?: string;
  error?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const validatedQuery = querySchema.parse(query);

    let filter: any = {};

    // Apply payment status filter
    if (validatedQuery.paymentStatus) {
      filter.paymentStatus = validatedQuery.paymentStatus;
    }

    // Apply time range filter
    if (validatedQuery.timeRange) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - validatedQuery.timeRange);
      filter.createdAt = { $gte: daysAgo };
    }

    // Apply search filter (case-insensitive search on client/talent usernames or order ID)
    if (validatedQuery.search) {
      filter.$or = [
        { "clientId": { $regex: validatedQuery.search, $options: "i" } }, // Search by clientId
        { "talentId": { $regex: validatedQuery.search, $options: "i" } }, // Search by talentId
        { _id: { $regex: validatedQuery.search, $options: "i" } },
      ];
    }

    // Fetch order-related transactions
    const orders = await OrderModel.find(filter)
      .select("_id clientId talentId ratePlan paymentStatus createdAt updatedAt")
      .lean<IOrder[]>(); // Explicitly type as array of IOrder

    const orderTransactions = await Promise.all(
      orders.map(async (order) => {
        // Get client info
        let clientName = "Unknown";
        if (order.clientId) {
          const client = await UserModel.findById(order.clientId).select("userName").lean<IUser>();
          clientName = client?.userName || "Unknown";
        }

        // Get talent info
        let talentName = "Unknown";
        if (order.talentId) {
          const talent = await UserModel.findById(order.talentId).select("userName").lean<IUser>();
          talentName = talent?.userName || "Unknown";
        }

        return {
          _id: order._id.toString(),
          orderId: order._id.toString(),
          clientId: order.clientId,
          talentId: order.talentId,
          clientUserName: clientName,
          talentUserName: talentName,
          amount: order.ratePlan.price || 0,
          paymentStatus: order.paymentStatus || "pending",
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          relatedTo: "order" as const,
        };
      })
    );

    // Create a separate filter for proposals
    let proposalFilter: any = {
      proposalStatus: { $in: ["accepted", "delivered", "revision-requested"] }
    };

    // Apply time range filter to proposals if needed
    if (validatedQuery.timeRange) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - validatedQuery.timeRange);
      proposalFilter.createdAt = { $gte: daysAgo };
    }

    // Fetch project-related transactions (based on accepted proposals)
    const acceptedProposals = await ProposalModel.find(proposalFilter).lean();

    const projectTransactions = await Promise.all(
      acceptedProposals.map(async (proposal: any) => {
        // Get client info - first try to get from proposal.clientId
        let clientName = "Unknown";
        if (proposal.clientId) {
          const client = await UserModel.findById(proposal.clientId).select("userName").lean<IUser>();
          clientName = client?.userName || "Unknown";
        } else {
          // Fallback: try to get client from the project
          try {
            const project = await ProjectModel.findById(proposal.projectId).select("clientId").lean<IProject>();
            if (project && project.clientId) {
              const client = await UserModel.findById(project.clientId).select("userName").lean<IUser>();
              clientName = client?.userName || "Unknown";
            }
          } catch (error) {
            console.error("Error fetching project for proposal:", proposal._id, error);
          }
        }

        // Get talent info
        let talentName = "Unknown";
        if (proposal.talentId) {
          const talent = await UserModel.findById(proposal.talentId).select("userName").lean<IUser>();
          talentName = talent?.userName || "Unknown";
        }

        // Derive payment status from proposalStatus
        let paymentStatus: "pending" | "completed" | "failed" | "cancelled" = "pending";
        if (proposal.proposalStatus === "delivered") paymentStatus = "completed";

        return {
          _id: proposal._id.toString(),
          orderId: proposal.projectId, // Use projectId as a reference
          clientId: proposal.clientId || "unknown", // Handle missing clientId
          talentId: proposal.talentId,
          clientUserName: clientName,
          talentUserName: talentName,
          amount: proposal.bid || 0,
          paymentStatus,
          createdAt: proposal.createdAt.toISOString(),
          updatedAt: proposal.updatedAt.toISOString(),
          relatedTo: "project" as const,
        };
      })
    );

    // Apply search filter to project transactions if needed
    let filteredProjectTransactions = projectTransactions;
    if (validatedQuery.search) {
      const searchLower = validatedQuery.search.toLowerCase();
      filteredProjectTransactions = projectTransactions.filter(transaction =>
        transaction.clientUserName?.toLowerCase().includes(searchLower) ||
        transaction.talentUserName?.toLowerCase().includes(searchLower) ||
        transaction.orderId.toLowerCase().includes(searchLower)
      );
    }

    // Apply payment status filter to project transactions if needed
    if (validatedQuery.paymentStatus) {
      filteredProjectTransactions = filteredProjectTransactions.filter(
        transaction => transaction.paymentStatus === validatedQuery.paymentStatus
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { orderTransactions, projectTransactions: filteredProjectTransactions },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch transactions.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}