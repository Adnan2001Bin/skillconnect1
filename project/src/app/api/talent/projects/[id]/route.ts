import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import ProposalModel from "@/models/proposal.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const project = await ProjectModel.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (!["open", "in-progress"].includes(project.status)) {
      const hasRelevantProposal = await ProposalModel.findOne({
        projectId: id,
        talentId: session.user._id,
        proposalStatus: { $in: ["delivered", "revision-requested"] },
      });
      if (!hasRelevantProposal) {
        return NextResponse.json(
          { success: false, message: "Project is not available for viewing." },
          { status: 403 }
        );
      }
    }

    // Fetch latest proposal for payment status
    const latestProposal = await ProposalModel.findOne({
      projectId: id,
      talentId: session.user._id,
    }).sort({ updatedAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: project,
        paymentStatus: latestProposal?.paymentStatus || "pending",
        message: "Project fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}