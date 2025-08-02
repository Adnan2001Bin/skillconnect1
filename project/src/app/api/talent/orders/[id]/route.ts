import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import orderModel from "@/models/order.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "completed", "cancelled"]),
});
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can update order status." },
        { status: 401 }
      );
    }

    const orderId = req.url.split("/").pop();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    await connectDB();

    const order = await orderModel.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.talentId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only update your own orders." },
        { status: 403 }
      );
    }

    const validTransitions: { [key: string]: string[] } = {
      pending: ["accepted", "rejected"],
      accepted: ["completed", "cancelled"],
    };

    if (
      validTransitions[order.status] &&
      !validTransitions[order.status].includes(validatedData.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition from ${order.status} to ${validatedData.status}`,
        },
        { status: 400 }
      );
    }

    order.status = validatedData.status;
    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: `Order status updated to ${validatedData.status}`,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating order status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update order status.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}