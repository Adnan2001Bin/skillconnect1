import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "../../auth/[...nextauth]/options";

// Define interfaces for proper typing
interface PopulatedUser {
  _id: string;
  userName: string;
}

interface LeanOrder {
  _id: string;
  talentId: PopulatedUser;
  clientId: PopulatedUser;
  ratePlan: {
    type: string;
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
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled" | "completed";
  revisionStatus?: "none" | "requested" | "submitted";
  revisionCount?: number;
  createdAt: Date;
  updatedAt: Date;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt?: Date;
  };
}

interface RecentOrder {
  _id: string;
  talentId: string;
  clientId: string;
  clientUserName: string;
  talentUserName: string;
  ratePlan: {
    type: string;
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
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled" | "completed";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
}

interface AdminDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    totalOrders: number;
    ordersByStatus: {
      pending: number;
      accepted: number;
      rejected: number;
      completed: number;
      cancelled: number;
    };
    recentOrders: RecentOrder[];
  };
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<AdminDashboardResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only admins can view the dashboard." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange") || "30";

    await connectDB();

    const now = new Date();
    let startDate: Date | undefined;
    switch (timeRange) {
      case "7":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "30":
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "90":
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case "all":
        startDate = undefined;
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    const query = startDate ? { createdAt: { $gte: startDate } } : {};

    const totalOrders = await OrderModel.countDocuments(query);
    const ordersByStatus = {
      pending: await OrderModel.countDocuments({ ...query, status: "pending" }),
      accepted: await OrderModel.countDocuments({ ...query, status: "accepted" }),
      rejected: await OrderModel.countDocuments({ ...query, status: "rejected" }),
      completed: await OrderModel.countDocuments({ ...query, status: "completed" }),
      cancelled: await OrderModel.countDocuments({ ...query, status: "cancelled" }),
    };

    const recentOrders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate<{ talentId: PopulatedUser }>({ path: "talentId", select: "userName" })
      .populate<{ clientId: PopulatedUser }>({ path: "clientId", select: "userName" })
      .lean<LeanOrder[]>();

    const recentOrdersWithUserNames = recentOrders.map((order) => {
      const talentId = order.talentId?._id?.toString() || "unknown-talent";
      const clientId = order.clientId?._id?.toString() || "unknown-client";
      const talentUserName = order.talentId?.userName || "Unknown";
      const clientUserName = order.clientId?.userName || "Unknown";

      return {
        _id: order._id.toString(),
        talentId,
        clientId,
        clientUserName,
        talentUserName,
        ratePlan: order.ratePlan,
        projectDetails: order.projectDetails,
        status: order.status,
        revisionStatus: order.revisionStatus || "none",
        revisionCount: order.revisionCount || 0,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        revisionRequest: order.revisionRequest
          ? {
              files: order.revisionRequest.files || [],
              note: order.revisionRequest.note || undefined,
              requestedAt: order.revisionRequest.requestedAt?.toISOString() || "",
            }
          : undefined,
      } as RecentOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
          totalOrders,
          ordersByStatus,
          recentOrders: recentOrdersWithUserNames,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch dashboard data.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}