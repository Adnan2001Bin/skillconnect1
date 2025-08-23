import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

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
  }[];
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<TransactionResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their payments." },
        { status: 401 }
      );
    }

    await connectDB();

    const orders = await OrderModel.find({ talentId: session.user._id }).lean();
    const transactions = await Promise.all(
      orders.map(async (order: any) => {
        const client = await UserModel.findById(order.clientId).select("userName").lean();
        return {
          _id: order._id.toString(),
          orderId: order._id.toString(),
          amount: order.ratePlan.price,
          currency: "USD", // Adjust based on your payment system
          status: order.paymentStatus,
          createdAt: order.createdAt.toISOString(),
          clientName: client?.userName || "Unknown",
        };
      })
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