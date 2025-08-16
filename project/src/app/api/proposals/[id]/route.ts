import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const updateProposalSchema = z.object({
  proposalStatus: z.enum(["accepted", "rejected"], {
    message: "Status must be 'accepted' or 'rejected'",
  }),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ proposalId: string }> }
) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "client") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can update proposals." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = updateProposalSchema.parse(body);

    // 3. Get proposalId from params
    const { proposalId } = await context.params;

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

    // 6. Verify the client owns the project
    const project = await ProjectModel.findById(proposal.projectId);
    if (!project || project.clientId.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You do not own this project." },
        { status: 403 }
      );
    }

    // 7. Update proposal status
    proposal.proposalStatus = validatedData.proposalStatus;
    proposal.updatedAt = new Date();
    await proposal.save();

    // 8. If accepted, update project status and assign talent
    if (validatedData.proposalStatus === "accepted") {
      project.status = "in-progress";
      project.talentId = proposal.talentId;
      await project.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: `Proposal ${validatedData.proposalStatus} successfully`,
        data: proposal,
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