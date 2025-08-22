import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { createOrderSchema } from "@/schemas/createOrderSchema";
import { z } from "zod";

interface PaymentResponse {
  success: boolean;
  message: string;
  gatewayPageURL?: string;
  orderId?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can initiate payments." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    // Connect to database
    await connectDB();

    // Create order with payment status pending
    const order = new OrderModel({
      talentId: validatedData.talentId,
      clientId: session.user._id,
      ratePlan: validatedData.ratePlan,
      projectDetails: validatedData.projectDetails,
      status: "pending",
      paymentStatus: "pending", // Add payment status
    });
    await order.save();

    // Prepare SSLCommerz payment data
    const paymentData = {
      store_id: process.env.NEXT_PUBLIC_SSL_COMMERZ_STORE_ID,
      store_passwd: process.env.SSL_COMMERZ_STORE_PASSWORD,
      total_amount: validatedData.ratePlan.price,
      currency: "BDT", // Adjust based on your requirements
      tran_id: order._id.toString(), // Use order ID as transaction ID
      success_url: process.env.NEXT_PUBLIC_SUCCESS_URL,
      fail_url: process.env.NEXT_PUBLIC_FAIL_URL,
      cancel_url: process.env.NEXT_PUBLIC_CANCEL_URL,
      ipn_url: process.env.NEXT_PUBLIC_SUCCESS_URL, // Optional: for instant payment notification
      cus_name: session.user.userName,
      cus_email: session.user.email,
      cus_add1: "N/A",
      cus_city: "N/A",
      cus_country: "Bangladesh", // Adjust as needed
      cus_phone: "N/A",
      shipping_method: "NO",
      product_name: validatedData.projectDetails.title,
      product_category: "Service",
      product_profile: "general",
    };

    // Initiate payment with SSLCommerz
    const response = await axios.post(
      process.env.NEXT_PUBLIC_SSL_COMMERZ_SANDBOX_URL!,
      new URLSearchParams(paymentData as any).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.data.status === "SUCCESS" && response.data.GatewayPageURL) {
      return NextResponse.json({
        success: true,
        message: "Payment initiated successfully",
        gatewayPageURL: response.data.GatewayPageURL,
        orderId: order._id.toString(),
      });
    } else {
      // Delete the order if payment initiation fails
      await OrderModel.findByIdAndDelete(order._id);
      return NextResponse.json(
        { success: false, message: "Failed to initiate payment", error: response.data.failedreason },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error initiating payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to initiate payment.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}