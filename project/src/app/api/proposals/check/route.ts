import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import projectsModel from "@/models/projects.model";

const checkProposalSchema = z.object({
  projectId: z.string().nonempty({ message: "Project ID is required" }),
  talentId: z.string().nonempty({ message: "Talent ID is required" }),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can check proposals." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const talentId = searchParams.get("talentId");

    const validatedData = checkProposalSchema.parse({ projectId, talentId });

    await connectDB();

    const existingProposal = await ProposalModel.findOne({
      projectId: validatedData.projectId,
      talentId: validatedData.talentId,
    })
      .sort({ updatedAt: -1 })
      .exec();

    if (!existingProposal || existingProposal.proposalStatus === "rejected") {
      return NextResponse.json(
        {
          success: true,
          hasApplied: false,
          status: existingProposal ? existingProposal.proposalStatus : undefined,
          message: existingProposal
            ? "Previous proposal was rejected. You can submit a new proposal."
            : "No proposal found for this project.",
        },
        { status: 200 }
      );
    }

    // For talent view, set paymentStatus to "completed" if project status is "completed"
    const project = await projectsModel.findById(validatedData.projectId);
    const paymentStatus = project?.status === "completed" ? "completed" : existingProposal.paymentStatus || "pending";

    return NextResponse.json(
      {
        success: true,
        hasApplied: true,
        status: existingProposal.proposalStatus,
        proposalId: existingProposal._id.toString(),
        revisionCount: existingProposal.revisionCount || 0,
        revisionNote: existingProposal.revisionNote || null,
        paymentStatus: paymentStatus,
        message: "Proposal found for this project.",
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
    console.error("Error checking proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to check proposal status.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}