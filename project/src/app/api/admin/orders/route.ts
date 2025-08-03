import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";

interface Response {
  success: boolean;
  message: string;
  data?: any;
}
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Only admins can delete orders.",
        },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectDB();
    const { orderId } = await request.json();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }
    // Find and delete order
    const order = await OrderModel.findByIdAndDelete(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete order.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
