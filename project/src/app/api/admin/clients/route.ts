import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import orderModel from "@/models/order.model";

interface Response {
  success: boolean;
  message: string;
  error?: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    // Extract orderId from URL parameters
    const { orderId } = params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find and delete order
    const order = await orderModel.findByIdAndDelete(orderId);
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

export async function GET(request: NextRequest): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Only admins can access client data.",
        },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectDB();

    // Fetch all users with role "user"
    const clients = await UserModel.find({ role: "user" }).select(
      "_id userName email bio"
    ).lean();

    // Transform the data to ensure only necessary fields are returned
    const clientData = clients.map(client => ({
      _id: client._id.toString(),
      userName: client.userName,
      email: client.email,
      bio: client.bio || null,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Clients retrieved successfully",
        data: clientData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch clients.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}