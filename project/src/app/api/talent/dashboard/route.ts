import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";

interface DashboardResponse {
  success: boolean;
  message: string;
  data?: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    recentOrders: {
      _id: string;
      clientId: string;
      clientUserName: string;
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
    }[];
  };
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<DashboardResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their dashboard." },
        { status: 401 }
      );
    }

    await connectDB();

    const talentId = session.user._id;
    const totalOrders = await OrderModel.countDocuments({ talentId });
    const pendingOrders = await OrderModel.countDocuments({ talentId, status: "pending" });
    const inProgressOrders = await OrderModel.countDocuments({ talentId, status: "in-progress" });
    const completedOrders = await OrderModel.countDocuments({ talentId, status: "completed" });

    const recentOrders = await OrderModel.find({ talentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrdersWithUserNames = await Promise.all(
      recentOrders.map(async (order: any) => {
        const client = await UserModel.findById(order.clientId).select("userName").lean();
        return {
          _id: order._id.toString(),
          talentId: order.talentId,
          clientId: order.clientId,
          clientUserName: client?.userName || "Unknown",
          ratePlan: {
            type: order.ratePlan.type,
            price: order.ratePlan.price,
            description: order.ratePlan.description,
            whatsIncluded: order.ratePlan.whatsIncluded,
            deliveryDays: order.ratePlan.deliveryDays,
            revisions: order.ratePlan.revisions,
          },
          projectDetails: {
            title: order.projectDetails.title,
            description: order.projectDetails.description,
          },
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
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
          totalOrders,
          pendingOrders,
          inProgressOrders,
          completedOrders,
          recentOrders: recentOrdersWithUserNames,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching talent dashboard data:", error);
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