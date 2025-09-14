import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import messageModel from "@/models/message.model";
import { getConversationId } from "@/socket/utils/conversation";
import { LeanMessage } from "@/type";
import { Server } from "socket.io";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["user", "talent"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in as a user or talent." },
        { status: 401 }
      );
    }

    const { receiverId, content } = await req.json();
    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Receiver ID and message content are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const sender = await UserModel.findById(session.user._id);
    const receiver = await UserModel.findById(receiverId);
    if (!sender || !receiver) {
      return NextResponse.json(
        { success: false, message: "Sender or receiver not found." },
        { status: 404 }
      );
    }

    // Ensure client can only message talent, and talent can only message client
    if (
      (sender.role === "user" && receiver.role !== "talent") ||
      (sender.role === "talent" && receiver.role !== "user")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid role combination for messaging." },
        { status: 403 }
      );
    }

    const conversationId = getConversationId(session.user._id, receiverId);
    const message = await messageModel.create({
      senderId: session.user._id,
      receiverId,
      content,
      conversationId,
    });

    const populatedMessage = await messageModel.findById(message._id)
      .populate<{ senderId: { userName: string | null } }>({ path: "senderId", select: "userName" })
      .lean<LeanMessage>();

    if (!populatedMessage) {
      return NextResponse.json(
        { success: false, message: "Failed to populate message data." },
        { status: 500 }
      );
    }

    // Emit new message via Socket.IO
    const io = new Server({ path: "/socket.io" });
    io.to(session.user._id).emit("newMessage", populatedMessage);
    io.to(receiverId).emit("newMessage", populatedMessage);
    io.close();

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        data: {
          _id: populatedMessage._id,
          senderId: populatedMessage.senderId,
          receiverId: populatedMessage.receiverId,
          content: populatedMessage.content,
          conversationId: populatedMessage.conversationId,
          createdAt: populatedMessage.createdAt,
          isRead: populatedMessage.isRead,
          updatedAt: populatedMessage.updatedAt,
          deletedAt: populatedMessage.deletedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to send message.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}