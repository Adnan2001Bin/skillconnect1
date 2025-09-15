import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { tran_id, status, val_id } = body;

    if (!tran_id || !val_id || status !== "VALID") {
      return NextResponse.json(
        { success: false, message: "Invalid payment response" },
        { status: 400 }
      );
    }

    // Validate payment with SSLCommerz
    const validationResponse = await axios.get(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php`,
      {
        params: {
          val_id,
          store_id: process.env.NEXT_PUBLIC_SSL_COMMERZ_STORE_ID,
          store_passwd: process.env.SSL_COMMERZ_STORE_PASSWORD,
          format: "json",
        },
      }
    );

    if (validationResponse.data.status !== "VALID" && validationResponse.data.status !== "VALIDATED") {
      return NextResponse.json(
        { success: false, message: "Payment validation failed" },
        { status: 400 }
      );
    }

    // Update order status
    const order = await OrderModel.findById(tran_id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    order.paymentStatus = "completed";
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Payment validated and order updated successfully",
      data: { orderId: tran_id },
    });
  } catch (error) {
    console.error("Error processing payment success:", error);
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