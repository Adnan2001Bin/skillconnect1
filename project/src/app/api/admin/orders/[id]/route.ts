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
  };
  projectDetails: { title: string; description: string };
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

interface Response {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}


const updateOrderSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "completed", "cancelled"]).optional(),
  ratePlan: z
    .object({
      type: z.enum(["Basic", "Standard", "Premium"]),
      price: z.number().positive(),
      description: z.string(),
      whatsIncluded: z.array(z.string()),
      deliveryDays: z.number().positive(),
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
  { params }: { params: { id: string } }
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

    // Validate orderId
    const { id } = params;
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
      ratePlan: order.ratePlan,
      projectDetails: order.projectDetails,
      status: order.status,
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
  { params }: { params: { id: string } }
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

    // Validate orderId
    const { id } = params;
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
      ratePlan: updatedOrder.ratePlan,
      projectDetails: updatedOrder.projectDetails,
      status: updatedOrder.status,
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

