import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import NotificationModel, { INotification } from "@/models/notification.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can view notifications." },
        { status: 401 }
      );
    }

    await connectDB();

    const notifications = await NotificationModel.find({
      userId: new mongoose.Types.ObjectId(session.user._id as string),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<INotification[]>();

    return NextResponse.json(
      {
        success: true,
        data: notifications.map((notif) => ({
          id: notif._id.toString(),
          message: notif.message,
          orderId: notif.orderId?.toString(),
          projectId: notif.projectId?.toString(),
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch notifications.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can mark notifications as read." },
        { status: 401 }
      );
    }

    const { id } = await req.json();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId: session.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to mark notification as read.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ✨ NEW DELETE FUNCTION ✨
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can delete notifications." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing notification ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedNotification = await NotificationModel.findOneAndDelete({
      _id: id,
      userId: session.user._id, // Ensure user can only delete their own notifications
    });

    if (!deletedNotification) {
      return NextResponse.json(
        { success: false, message: "Notification not found or you are not authorized to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete notification.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}