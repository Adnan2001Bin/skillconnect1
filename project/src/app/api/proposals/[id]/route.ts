import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const updateProposalSchema = z.object({
  proposalStatus: z.enum(["accepted", "rejected"], {
    message: "Proposal status must be either 'accepted' or 'rejected'",
  }),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "user" && session.user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients or admins can update proposals." },
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
    const validatedData = updateProposalSchema.parse(body);

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
        { success: false, message: "Unauthorized. You can only update proposals for your own projects." },
        { status: 403 }
      );
    }

    // 7. Handle proposal status update
    if (validatedData.proposalStatus === "accepted") {
      // Check if another proposal is already accepted for this project
      const existingAcceptedProposal = await ProposalModel.findOne({
        projectId: proposal.projectId,
        proposalStatus: "accepted",
        _id: { $ne: proposalId },
      });
      if (existingAcceptedProposal) {
        return NextResponse.json(
          { success: false, message: "Another proposal is already accepted for this project." },
          { status: 400 }
        );
      }

      // Update proposal status
      proposal.proposalStatus = validatedData.proposalStatus;
      proposal.updatedAt = new Date();
      await proposal.save();

      // Update project status to in-progress
      project.status = "in-progress";
      project.updatedAt = new Date();
      await project.save();

      return NextResponse.json(
        {
          success: true,
          message: "Proposal accepted and project status updated to in-progress",
          data: proposal,
        },
        { status: 200 }
      );
    } else if (validatedData.proposalStatus === "rejected") {
      // Update proposal status without deleting
      proposal.proposalStatus = validatedData.proposalStatus;
      proposal.updatedAt = new Date();
      await proposal.save();

      return NextResponse.json(
        {
          success: true,
          message: "Proposal rejected successfully",
          data: proposal,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update proposal.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}