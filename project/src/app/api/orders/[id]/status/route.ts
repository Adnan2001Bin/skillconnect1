import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "in-progress", "rejected", "delivered", "cancelled", "completed"]).optional(),
  revisionStatus: z.enum(["none", "requested", "submitted"]).optional(),
  revisionFiles: z.array(z.string().url()).optional().default([]),
  revisionNote: z.string().max(1000).optional(),
  review: z
    .object({
      rating: z.number().min(1).max(5),
      comment: z.string().max(1000).optional(),
      reviewedAt: z.string().datetime().optional(),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    await connectDB();

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (session.user.role === "talent" && order.talentId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only update your own orders." },
        { status: 403 }
      );
    }

    if (session.user.role === "user" && order.clientId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only request revisions or approve your own orders." },
        { status: 403 }
      );
    }

    if (validatedData.revisionStatus) {
      if (session.user.role !== "user") {
        return NextResponse.json(
          { success: false, message: "Only clients can request revisions." },
          { status: 403 }
        );
      }
      if (order.status !== "delivered") {
        return NextResponse.json(
          {
            success: false,
            message: "Revisions can only be requested for delivered orders.",
          },
          { status: 400 }
        );
      }
      if (order.revisionCount >= order.ratePlan.revisions) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum number of revisions reached.",
          },
          { status: 400 }
        );
      }
      if (validatedData.revisionStatus === "requested") {
        order.revisionStatus = "requested";
        order.revisionCount += 1;
        order.revisionRequest = {
          files: validatedData.revisionFiles || [],
          note: validatedData.revisionNote || null,
          requestedAt: new Date(),
        };
      }
    } else if (validatedData.status) {
      const validTransitions: { [key: string]: string[] } = {
        pending: ["in-progress", "rejected"],
        "in-progress": ["cancelled"],
        delivered: ["cancelled", "completed"],
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

      if (validatedData.status === "completed" && session.user.role !== "user") {
        return NextResponse.json(
          { success: false, message: "Only clients can approve projects." },
          { status: 403 }
        );
      }

      if (validatedData.status === "completed" && !validatedData.review) {
        return NextResponse.json(
          { success: false, message: "Review is required to complete the project." },
          { status: 400 }
        );
      }

      order.status = validatedData.status;

      if (validatedData.status === "completed" && validatedData.review) {
        order.review = {
          rating: validatedData.review.rating,
          comment: validatedData.review.comment || "",
          reviewedAt: validatedData.review.reviewedAt || new Date().toISOString(),
        };
        order.paymentStatus = "completed";
      }
    }

    // Check and update payment status based on deadlines
    const now = new Date();
    if (order.status === "delivered" && order.deliverables?.submittedAt) {
      const deliveredAt = new Date(order.deliverables.submittedAt);
      const deadline = new Date(deliveredAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (now >= deadline && order.paymentStatus !== "completed") {
        order.paymentStatus = "completed";
      }
    }
    if (order.revisionStatus === "requested" && order.revisionRequest?.requestedAt) {
      const requestedAt = new Date(order.revisionRequest.requestedAt);
      const deadline = new Date(requestedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (now >= deadline && order.paymentStatus === "completed") {
        order.paymentStatus = "cancelled";
      }
    }

    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: `Order updated successfully`,
        data: {
          _id: order._id.toString(),
          talentId: order.talentId,
          clientId: order.clientId,
          ratePlan: order.ratePlan,
          projectDetails: order.projectDetails,
          status: order.status,
          paymentStatus: order.paymentStatus,
          revisionStatus: order.revisionStatus,
          revisionCount: order.revisionCount,
          createdAt: order.createdAt.toISOString(),
          deliverables: order.deliverables
            ? {
                files: order.deliverables.files,
                note: order.deliverables.note,
                submittedAt: order.deliverables.submittedAt?.toISOString(),
              }
            : undefined,
          revisionRequest: order.revisionRequest
            ? {
                files: order.revisionRequest.files,
                note: order.revisionRequest.note,
                requestedAt: order.revisionRequest.requestedAt?.toISOString(),
              }
            : undefined,
          review: order.review
            ? {
                rating: order.review.rating,
                comment: order.review.comment,
                reviewedAt: order.review.reviewedAt,
              }
            : undefined,
        },
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