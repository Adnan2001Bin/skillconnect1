import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { io } from "socket.io-client";

const revisionSchema = z.object({
  revisionNote: z.string().min(1, "Revision note is required").max(1000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "user" && session.user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients or admins can request revisions." },
        { status: 401 }
      );
    }

    // 2. Extract proposalId from params
    const proposalId = params.id;
    if (!proposalId) {
      return NextResponse.json(
        { success: false, message: "Proposal ID is required" },
        { status: 400 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = revisionSchema.parse(body);

    // 4. Connect to the database
    await connectDB();

    // 5. Find the proposal
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal not found" },
        { status: 404 }
      );
    }

    // 6. Verify project exists and user has access
    const project = await ProjectModel.findById(proposal.projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }
    if (session.user.role === "user" && project.clientId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only request revisions for your own projects." },
        { status: 403 }
      );
    }

    // 7. Check revision count
    if (proposal.revisionCount >= 2) {
      return NextResponse.json(
        { success: false, message: "Maximum revision attempts (2) reached." },
        { status: 400 }
      );
    }

    // 8. Update proposal
    proposal.proposalStatus = "revision-requested";
    proposal.revisionCount = (proposal.revisionCount || 0) + 1;
    proposal.revisionNote = validatedData.revisionNote;
    proposal.updatedAt = new Date();
    await proposal.save();

    // 9. Emit Socket.IO event
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
    socket.emit("revisionRequested", {
      proposalId: proposal._id.toString(),
      projectId: project._id.toString(),
      revisionCount: proposal.revisionCount,
      revisionNote: validatedData.revisionNote,
    });
    socket.disconnect();

    return NextResponse.json(
      {
        success: true,
        message: "Revision requested successfully",
        data: {
          proposalId: proposal._id,
          revisionCount: proposal.revisionCount,
          revisionNote: proposal.revisionNote,
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
    console.error("Error requesting revision:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to request revision.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}