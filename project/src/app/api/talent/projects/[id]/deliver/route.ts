import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import UserModel from "@/models/user.model";
import NotificationModel from "@/models/notification.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import { io } from "socket.io-client";
import { sendDeliverablesSubmittedEmail } from "@/emails/DeliverablesSubmittedEmail";

export const deliverProjectSchema = z.object({
  files: z.array(z.string().url()).optional().default([]),
  note: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can submit deliverables." },
        { status: 401 }
      );
    }

    // 2. Validate project ID
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = deliverProjectSchema.parse(body);

    // 4. Connect to the database
    await connectDB();

    // 5. Find the project
    const project = await ProjectModel.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    // 6. Verify the talent is assigned to the project
    if (project.talentId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only submit deliverables for your own projects." },
        { status: 403 }
      );
    }

    // 7. Check project status
    if (project.status !== "in-progress") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot submit deliverables for a project in ${project.status} status`,
        },
        { status: 400 }
      );
    }

    // 8. Update project with deliverables
    project.deliverables = {
      files: validatedData.files || [],
      note: validatedData.note || null,
      submittedAt: new Date(),
    };
    project.status = "delivered";

    await project.save();

    // 9. Find client details for notification
    const client = await UserModel.findById(project.clientId).select("_id email userName");
    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client not found" },
        { status: 404 }
      );
    }

    // 10. Send email notification
    const emailResponse = await sendDeliverablesSubmittedEmail({
      email: client.email,
      userName: client.userName,
      projectTitle: project.title,
      orderId: project._id.toString(), // Using project ID as orderId for consistency
      note: validatedData.note,
      fileCount: validatedData.files?.length || 0,
    });

    if (!emailResponse.success) {
      console.error("Failed to send deliverables email:", emailResponse.message);
      // Continue despite email failure to ensure notification is sent
    }

    // 11. Create notification
    const notificationMessage = `Deliverables submitted for project: ${project.title}`;
    const notification = new NotificationModel({
      userId: client._id,
      orderId: project._id, // Using project ID as orderId
      message: notificationMessage,
      read: false,
    });
    await notification.save();

    // 12. Emit Socket.IO event
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });
    socket.emit("deliverablesSubmitted", {
      orderId: project._id.toString(),
      message: notificationMessage,
      clientId: project.clientId.toString(),
    });
    socket.disconnect();

    // 13. Return success response
    return NextResponse.json(
      {
        success: true,
        message: notificationMessage,
        data: {
          _id: project._id.toString(),
          clientId: project.clientId,
          talentId: project.talentId,
          title: project.title,
          description: project.description,
          category: project.category,
          services: project.services,
          requirements: project.requirements,
          budget: project.budget,
          timeline: project.timeline,
          status: project.status,
          files: project.files || [],
          deliverables: {
            files: project.deliverables.files || [],
            note: project.deliverables.note || null,
            submittedAt: project.deliverables.submittedAt?.toISOString() || null,
          },
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
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