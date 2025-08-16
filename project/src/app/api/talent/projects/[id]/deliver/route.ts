import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import UserModel from "@/models/user.model";
import NotificationModel from "@/models/notification.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";
import { io } from "socket.io-client";
import { sendDeliverablesSubmittedEmail } from "@/emails/DeliverablesSubmittedEmail";
import projectsModel from "@/models/projects.model";

export const deliverProposalSchema = z.object({
  files: z.array(z.string().url()).optional().default([]),
  note: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can submit deliverables." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = deliverProposalSchema.parse(body);

    await connectDB();

    const proposal = await ProposalModel.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.talentId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only submit deliverables for your own proposals." },
        { status: 403 }
      );
    }

    if (proposal.proposalStatus !== "accepted") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot submit deliverables for a proposal in ${proposal.proposalStatus} status`,
        },
        { status: 400 }
      );
    }

    proposal.deliverables = {
      files: validatedData.files || [],
      note: validatedData.note || null,
      submittedAt: new Date(),
    };
    proposal.proposalStatus = "delivered";

    await proposal.save();

    const project = await projectsModel.findById(proposal.projectId).select("_id clientId title");
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const client = await UserModel.findById(project.clientId).select("_id email userName");
    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client not found" },
        { status: 404 }
      );
    }

    // const emailResponse = await sendDeliverablesSubmittedEmail({
    //   email: client.email,
    //   userName: client.userName,
    //   projectTitle: project.title,
    //   orderId: proposal._id.toString(),
    //   note: validatedData.note,
    //   fileCount: validatedData.files?.length || 0,
    // });

    // if (!emailResponse.success) {
    //   console.error("Failed to send deliverables email:", emailResponse.message);
    // }

    const notificationMessage = `Deliverables submitted for proposal on project: ${project.title}`;
    const notification = new NotificationModel({
      userId: client._id,
      projectId: project._id,
      message: notificationMessage,
      read: false,
    });
    await notification.save();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });
    socket.emit("proposalDeliverablesSubmitted", {
      proposalId: proposal._id.toString(),
      message: notificationMessage,
      clientId: project.clientId.toString(),
    });
    socket.disconnect();

    return NextResponse.json(
      {
        success: true,
        message: notificationMessage,
        data: {
          _id: proposal._id.toString(),
          projectId: proposal.projectId,
          talentId: proposal.talentId,
          bid: proposal.bid,
          coverLetter: proposal.coverLetter,
          files: proposal.files || [],
          proposalStatus: proposal.proposalStatus,
          deliverables: {
            files: proposal.deliverables?.files || [],
            note: proposal.deliverables?.note || null,
            submittedAt: proposal.deliverables?.submittedAt?.toISOString() || null,
          },
          createdAt: proposal.createdAt.toISOString(),
          updatedAt: proposal.updatedAt.toISOString(),
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
    console.error("Error submitting proposal deliverables:", error);
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