import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export const deliverProjectSchema = z.object({
  files: z.array(z.string().url()).optional().default([]),
  note: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can submit deliverables." },
        { status: 401 }
      );
    }

    // Validate order ID
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = deliverProjectSchema.parse(body);

    // Connect to the database
    await connectDB();

    // Find the order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if the talent is assigned to the order
    if (order.talentId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only submit deliverables for your own orders." },
        { status: 403 }
      );
    }

    // Check if order is in a valid state
    if ( order.status !== "in-progress") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot submit deliverables for an order in ${order.status} status`,
        },
        { status: 400 }
      );
    }

    // Update order with deliverables and status
    order.deliverables = {
      files: validatedData.files || [],
      note: validatedData.note || null,
      submittedAt: new Date(),
    };
    order.status = "completed";
    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: "Deliverables submitted successfully",
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
    console.error("Error submitting deliverables:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to submit deliverables.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

