import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";

interface OrderResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    talentId: string;
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
    paymentStatus: "pending" | "completed" | "failed" | "cancelled"; // Added payment status
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
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<OrderResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus"); // New filter param

    await connectDB();

    const query: any = { talentId: session.user._id };
    if (status && status !== "all") {
      query.status = status;
    }
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    const orders = await OrderModel.find(query).lean();

    const ordersWithUserNames = await Promise.all(
      orders.map(async (order: any) => {
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
          paymentStatus: order.paymentStatus, // Include payment status
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
        message: "Orders fetched successfully",
        data: ordersWithUserNames,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching talent orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch orders.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}