import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import proposalModel from "@/models/proposal.model";

const updateProjectSchema = z.object({
  status: z.enum(["completed", "cancelled"], {
    message: "Project status must be either 'completed' or 'cancelled'",
  }),
});


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

    return NextResponse.json(
      { success: true, data: project, message: "Project fetched successfully" },
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



export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "user" && session.user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients or admins can update projects." },
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

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    // 4. Connect to the database
    await connectDB();

    // 5. Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    // 6. Verify user has access
    if (session.user.role === "user" && project.clientId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only update your own projects." },
        { status: 403 }
      );
    }

    // 7. Validate project status transition
    if (project.status !== "open" && project.status !== "in-progress") {
      return NextResponse.json(
        { success: false, message: "Project cannot be updated from its current status." },
        { status: 400 }
      );
    }

    // 8. Handle project status update
    if (validatedData.status === "cancelled") {
      // Update project status
      project.status = validatedData.status;
      project.updatedAt = new Date();
      await project.save();

      // Delete all associated proposals
      await proposalModel.deleteMany({ projectId });

      return NextResponse.json(
        {
          success: true,
          message: "Project cancelled and all proposals deleted successfully",
          data: project,
        },
        { status: 200 }
      );
    } else if (validatedData.status === "completed") {
      // Check if there is an accepted proposal
      const acceptedProposal = await proposalModel.findOne({ projectId, proposalStatus: "accepted" });
      if (!acceptedProposal) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot mark project as completed without an accepted proposal.",
          },
          { status: 400 }
        );
      }

      // Update project status
      project.status = validatedData.status;
      project.updatedAt = new Date();
      await project.save();

      // Delete all pending proposals
      await proposalModel.deleteMany({ projectId, proposalStatus: "pending" });

      return NextResponse.json(
        {
          success: true,
          message: "Project marked as completed and pending proposals deleted successfully",
          data: project,
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
    console.error("Error updating project:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update project.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only admins can delete projects." },
        { status: 401 }
      );
    }

    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    await ProjectModel.findByIdAndDelete(projectId);
    await proposalModel.deleteMany({ projectId });

    return NextResponse.json(
      {
        success: true,
        message: "Project and associated proposals deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete project.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}