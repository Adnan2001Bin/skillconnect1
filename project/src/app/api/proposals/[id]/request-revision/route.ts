import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { io } from "socket.io-client";
import proposalModel from "@/models/proposal.model";

// Initialize Socket.IO client
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract proposalId from params (await the Promise)
    const { id } = await params;
    
    const { revisionNote } = await request.json();

    if (!revisionNote || typeof revisionNote !== "string" || !revisionNote.trim()) {
      return NextResponse.json(
        { success: false, message: "Revision note is required" },
        { status: 400 }
      );
    }

    // Validate proposal ID
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    // Find the proposal
    const proposal = await proposalModel.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal not found" },
        { status: 404 }
      );
    }

    // Check if the user is authorized (client or admin)
    const project = await mongoose.model("ProjectModel").findById(proposal.projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isClient = session.user._id === project.clientId.toString();
    const isAdmin = session.user.role === "admin";
    if (!isClient && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to request revision" },
        { status: 403 }
      );
    }

    // Check if proposal is in a valid state for revision
    if (proposal.proposalStatus !== "delivered") {
      return NextResponse.json(
        {
          success: false,
          message: "Revision can only be requested for delivered proposals",
        },
        { status: 400 }
      );
    }

    // Check revision count
    const currentRevisionCount = proposal.revisionCount || 0;
    if (currentRevisionCount >= 2) {
      return NextResponse.json(
        { success: false, message: "Maximum revision attempts reached" },
        { status: 400 }
      );
    }

    // Update proposal
    proposal.revisionCount = currentRevisionCount + 1;
    proposal.revisionNote = revisionNote;
    proposal.proposalStatus = "revision-requested";
    await proposal.save();

    // Emit Socket.IO event
    socket.emit("revisionRequested", {
      proposalId: proposal._id.toString(),
      projectId: proposal.projectId.toString(),
      revisionCount: proposal.revisionCount,
      revisionNote,
    });

    return NextResponse.json({
      success: true,
      message: "Revision requested successfully",
      data: {
        revisionCount: proposal.revisionCount,
        revisionNote: proposal.revisionNote,
        proposalStatus: proposal.proposalStatus,
      },
    });
  } catch (error) {
    console.error("Error in request-revision:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}