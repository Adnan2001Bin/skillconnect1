import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import UserModel from "@/models/user.model";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> } // Change this line
) {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only admins can delete orders." },
        { status: 401 }
      );
    }

    // Await the params first
    const params = await context.params;
    const { orderId } = params;
    
    console.log("Received orderId for deletion:", orderId); // Debug log

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID", receivedId: orderId },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find and delete order
    const order = await OrderModel.findByIdAndDelete(orderId);
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    const params = await context.params;
    const { id } = params;

    // Fetch talent by ID
    const talent = await UserModel.findOne({ _id: id, role: "user" }).lean();
    if (!talent) {
      return NextResponse.json(
        { success: false, message: "user not found." },
        { status: 404 }
      );
    }

    // Return talent data
    return NextResponse.json({
      success: true,
      data: {
        _id: talent._id.toString(),
        userName: talent.userName,
        email: talent.email,
        profilePicture: talent.profilePicture || null,
        bio: talent.bio || null,
      },
    });
  } catch (error) {
    console.error("Error fetching talent:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}