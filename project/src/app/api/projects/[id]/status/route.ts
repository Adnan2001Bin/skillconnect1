import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProjectStatusSchema = z.object({
  status: z.enum(["open", "in-progress", "completed", "cancelled"]).optional(),
  revisionStatus: z.enum(["none", "requested", "submitted"]).optional(),
  revisionFiles: z.array(z.string().url()).optional().default([]),
  revisionNote: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id: projectId } = await context.params;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateProjectStatusSchema.parse(body);

    await connectDB();

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (session.user.role === "talent" && project.talentId !== session.user._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. You can only update your own projects.",
        },
        { status: 403 }
      );
    }

    if (session.user.role === "user" && project.clientId !== session.user._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. You can only request revisions or approve your own projects.",
        },
        { status: 403 }
      );
    }

    if (validatedData.revisionStatus) {
      if (session.user.role !== "user") {
        return NextResponse.json(
          { success: false, message: "Only clients can request revisions." },
          { status: 403 }
        );
      }
      if (project.status !== "in-progress") {
        return NextResponse.json(
          {
            success: false,
            message: "Revisions can only be requested for in-progress projects.",
          },
          { status: 400 }
        );
      }
      if (project.revisionCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum number of revisions reached.",
          },
          { status: 400 }
        );
      }
      if (validatedData.revisionStatus === "requested") {
        project.revisionStatus = "requested";
        project.revisionCount += 1;
        project.revisionRequest = {
          files: validatedData.revisionFiles || [],
          note: validatedData.revisionNote || null,
          requestedAt: new Date(),
        };
      }
    } else if (validatedData.status) {
      const validTransitions: { [key: string]: string[] } = {
        open: ["in-progress", "cancelled"],
        "in-progress": ["completed", "cancelled"],
      };

      if (
        validTransitions[project.status] &&
        !validTransitions[project.status].includes(validatedData.status)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status transition from ${project.status} to ${validatedData.status}`,
          },
          { status: 400 }
        );
      }

      if (validatedData.status === "completed" && session.user.role !== "user") {
        return NextResponse.json(
          { success: false, message: "Only clients can approve projects." },
          { status: 403 }
        );
      }

      project.status = validatedData.status;
    }

    await project.save();

    return NextResponse.json(
      {
        success: true,
        message: `Project updated successfully`,
        data: {
          _id: project._id.toString(),
          clientId: project.clientId,
          talentId: project.talentId,
          title: project.title,
          description: project.description,
          category: project.category,
          services: project.services,
          requirements: project.requirements,
          files: project.files,
          budget: project.budget,
          timeline: project.timeline,
          status: project.status,
          revisionStatus: project.revisionStatus,
          revisionCount: project.revisionCount,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          revisionRequest: project.revisionRequest
            ? {
                files: project.revisionRequest.files,
                note: project.revisionRequest.note,
                requestedAt: project.revisionRequest.requestedAt?.toISOString(),
              }
            : undefined,
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
    console.error("Error updating project status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update project status.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}