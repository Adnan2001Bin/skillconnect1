import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel, { IOrder } from "@/models/order.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
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

    // Connect to the database
    await connectDB();

    // Find the order
    const order = await OrderModel.findById(id).exec();
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if the user is authorized to view this order
    if (
      session.user.role !== "admin" &&
      order.clientId !== session.user._id &&
      order.talentId !== session.user._id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. You can only view your own orders.",
        },
        { status: 403 }
      );
    }

    // Serialize the order to match the client-side Order interface
    return NextResponse.json(
      {
        success: true,
        message: "Order retrieved successfully",
        data: {
          _id: order._id.toString(),
          talentId: order.talentId,
          clientId: order.clientId,
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
          revisionStatus: order.revisionStatus,
          revisionCount: order.revisionCount,
          createdAt: order.createdAt.toISOString(),
          deliverables: order.deliverables
            ? {
                files: order.deliverables.files || [],
                note: order.deliverables.note || null,
                submittedAt: order.deliverables.submittedAt?.toISOString() || null,
              }
            : undefined,
          revisionRequest: order.revisionRequest
            ? {
                files: order.revisionRequest.files || [],
                note: order.revisionRequest.note || null,
                requestedAt: order.revisionRequest.requestedAt?.toISOString() || null,
              }
            : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch order details.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}