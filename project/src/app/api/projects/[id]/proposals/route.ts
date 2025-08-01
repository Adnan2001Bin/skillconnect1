
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "user" && session.user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients or admins can view proposals." },
        { status: 401 }
      );
    }

    // 2. Extract projectId from params
    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      );
    }

    // 3. Connect to the database
    await connectDB();

    // 4. Verify project exists and user has access
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }
    if (session.user.role === "user" && project.clientId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only view proposals for your own projects." },
        { status: 403 }
      );
    }

    // 5. Fetch proposals for the project
    const proposals = await ProposalModel.find({ projectId }).lean();

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        message: "Proposals fetched successfully",
        data: proposals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch proposals.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
