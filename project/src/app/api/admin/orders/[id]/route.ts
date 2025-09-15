import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import { z } from "zod";

// Define interface for the populated order
interface PopulatedOrder {
  _id: mongoose.Types.ObjectId;
  talentId: { _id: mongoose.Types.ObjectId; userName: string };
  clientId: { _id: mongoose.Types.ObjectId; userName: string };
  ratePlan: {
    type: "Basic" | "Standard" | "Premium";
    price: number;
    description: string;
    whatsIncluded: string[];
    deliveryDays: number;
    revisions: number;
  };
  projectDetails: { title: string; description: string };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "completed" | "cancelled";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

interface FormattedOrder {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: {
    type: "Basic" | "Standard" | "Premium";
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
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "completed" | "cancelled";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  talentUserName: string;
  clientUserName: string;
}

interface Response {
  success: boolean;
  message: string;
  data?: FormattedOrder;
  error?: string;
}

const updateOrderSchema = z.object({
  status: z.enum(["pending", "in-progress", "accepted", "rejected", "delivered", "completed", "cancelled"]).optional(),
  revisionStatus: z.enum(["none", "requested", "submitted"]).optional(),
  revisionCount: z.number().nonnegative().optional(),
  revisionRequest: z
    .object({
      note: z.string().optional(),
      files: z.array(z.string()).optional(),
      requestedAt: z.string().datetime().optional(),
    })
    .optional(),
  ratePlan: z
    .object({
      type: z.enum(["Basic", "Standard", "Premium"]),
      price: z.number().positive(),
      description: z.string(),
      whatsIncluded: z.array(z.string()),
      deliveryDays: z.number().positive(),
      revisions: z.number().nonnegative(),
    })
    .optional(),
  projectDetails: z
    .object({
      title: z.string(),
      description: z.string(),
    })
    .optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Only admins can view order details.",
        },
        { status: 401 }
      );
    }

    // Await the params first
    const params = await context.params;
    const { id } = params;
    
    // Validate orderId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find order and populate talent and client usernames
    const order = await OrderModel.findById(id)
      .populate<{ talentId: { userName: string } }>({
        path: "talentId",
        model: UserModel,
        select: "userName",
      })
      .populate<{ clientId: { userName: string } }>({
        path: "clientId",
        model: UserModel,
        select: "userName",
      })
      .lean<PopulatedOrder>();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Transform the order to match the client-side Order interface
    const formattedOrder = {
      _id: order._id.toString(),
      talentId: order.talentId._id.toString(),
      clientId: order.clientId._id.toString(),
      ratePlan: {
        type: order.ratePlan.type,
        price: order.ratePlan.price,
        description: order.ratePlan.description,
        whatsIncluded: order.ratePlan.whatsIncluded,
        deliveryDays: order.ratePlan.deliveryDays,
        revisions: order.ratePlan.revisions || 0,
      },
      projectDetails: order.projectDetails,
      status: order.status,
      revisionStatus: order.revisionStatus || "none",
      revisionCount: order.revisionCount || 0,
      revisionRequest: order.revisionRequest
        ? {
            files: order.revisionRequest.files || [],
            note: order.revisionRequest.note || undefined,
            requestedAt: order.revisionRequest.requestedAt?.toISOString() || "",
          }
        : undefined,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      talentUserName: order.talentId.userName,
      clientUserName: order.clientId.userName,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Order fetched successfully",
        data: formattedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch order.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only admins can update orders." },
        { status: 401 }
      );
    }

    // Await the params first
    const params = await context.params;
    const { id } = params;
    
    // Validate orderId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    // Connect to the database
    await connectDB();

    // Find order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Update order fields
    if (validatedData.status) {
      order.status = validatedData.status;
    }
    if (validatedData.revisionStatus) {
      order.revisionStatus = validatedData.revisionStatus;
    }
    if (validatedData.revisionCount !== undefined) {
      order.revisionCount = validatedData.revisionCount;
    }
    if (validatedData.revisionRequest) {
      order.revisionRequest = {
        ...validatedData.revisionRequest,
        files: validatedData.revisionRequest.files || order.revisionRequest?.files || [],
        requestedAt: validatedData.revisionRequest.requestedAt
          ? new Date(validatedData.revisionRequest.requestedAt)
          : order.revisionRequest?.requestedAt || new Date(),
      };
    }
    if (validatedData.ratePlan) {
      order.ratePlan = validatedData.ratePlan;
    }
    if (validatedData.projectDetails) {
      order.projectDetails = validatedData.projectDetails;
    }

    // Save updated order
    await order.save();

    // Re-populate talent and client usernames for response
    const updatedOrder = await OrderModel.findById(id)
      .populate<{ talentId: { userName: string } }>({
        path: "talentId",
        model: UserModel,
        select: "userName",
      })
      .populate<{ clientId: { userName: string } }>({
        path: "clientId",
        model: UserModel,
        select: "userName",
      })
      .lean<PopulatedOrder>();

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found after update" },
        { status: 404 }
      );
    }

    // Transform the updated order to match the client-side Order interface
    const formattedUpdatedOrder = {
      _id: updatedOrder._id.toString(),
      talentId: updatedOrder.talentId._id.toString(),
      clientId: updatedOrder.clientId._id.toString(),
      ratePlan: {
        type: updatedOrder.ratePlan.type,
        price: updatedOrder.ratePlan.price,
        description: updatedOrder.ratePlan.description,
        whatsIncluded: updatedOrder.ratePlan.whatsIncluded,
        deliveryDays: updatedOrder.ratePlan.deliveryDays,
        revisions: updatedOrder.ratePlan.revisions || 0,
      },
      projectDetails: updatedOrder.projectDetails,
      status: updatedOrder.status,
      revisionStatus: updatedOrder.revisionStatus || "none",
      revisionCount: updatedOrder.revisionCount || 0,
      revisionRequest: updatedOrder.revisionRequest
        ? {
            files: updatedOrder.revisionRequest.files || [],
            note: updatedOrder.revisionRequest.note || undefined,
            requestedAt: updatedOrder.revisionRequest.requestedAt?.toISOString() || "",
          }
        : undefined,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      talentUserName: updatedOrder.talentId.userName,
      clientUserName: updatedOrder.clientId.userName,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
        data: formattedUpdatedOrder,
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
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update order.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}