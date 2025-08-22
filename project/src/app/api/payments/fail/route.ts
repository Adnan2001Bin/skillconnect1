import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";

interface PaymentResponse {
  success: boolean;
  message: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { tran_id } = body;

    if (!tran_id) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    // Delete the order since payment failed
    const order = await OrderModel.findByIdAndDelete(tran_id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment failed. Order has been removed.",
    });
  } catch (error) {
    console.error("Error processing payment failure:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}