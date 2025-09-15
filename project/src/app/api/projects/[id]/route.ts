import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProjectModel, { IProject } from "@/models/projects.model";
import ProposalModel from "@/models/proposal.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import { io } from "socket.io-client";

const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  category: z.string().nonempty().optional(),
  services: z.array(z.string()).min(1).optional(),
  budget: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .refine((val) => !isNaN(val) && val >= 10 && val <= 100000, {
      message: "Budget must be a number between 10 and 100000",
    })
    .optional(),
  timeline: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 365, {
      message: "Timeline must be a number between 1 and 365",
    })
    .optional(),
  requirements: z.string().min(10).max(1000).optional(),
  files: z.array(z.string()).optional(),
  status: z.enum(["completed", "cancelled", "open", "delivered"]).optional(),
  paymentStatus: z.enum(["pending", "completed", "failed"]).optional(),
  review: z
    .object({
      rating: z.number().min(1).max(5),
      comment: z.string().max(500).optional(),
      reviewedAt: z.string().optional(),
    })
    .optional(),
});

// Correct interface for Next.js App Router
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Extract projectId from params (await the Promise)
    const params = await context.params;
    const projectId = params.id;
    
    const project = await ProjectModel.findById(projectId).lean<IProject>();
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: project,
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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "user" && session.user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients or admins can update projects." },
        { status: 401 }
      );
    }

    // 2. Extract projectId from params (await the Promise)
    const params = await context.params;
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // 4. Connect to the database
    await connectDB();

    // 5. Verify project exists
    const project = await ProjectModel.findById(projectId) as IProject | null;
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

    // 7. Initialize Socket.IO client
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

    // 8. Handle review submission
    if (validatedData.review) {
      project.review = {
        rating: validatedData.review.rating,
        comment: validatedData.review.comment || "",
        reviewedAt: new Date(validatedData.review.reviewedAt || Date.now()),
      };
      // Emit review event to socket
      socket.emit("projectReviewSubmitted", {
        projectId,
        review: project.review,
        message: `A review has been submitted for project ${project.title}`,
      });
    }

    // 9. Handle project updates
    Object.assign(project, validatedData);
    project.updatedAt = new Date();

    // 10. Handle status-specific logic
    if (validatedData.status === "completed") {
      const acceptedProposal = await ProposalModel.findOne({
        projectId,
        proposalStatus: { $in: ["accepted", "delivered", "revision-requested"] },
      });
      if (!acceptedProposal) {
        socket.disconnect();
        return NextResponse.json(
          {
            success: false,
            message: "Cannot mark project as completed without an accepted, delivered, or revision-requested proposal.",
          },
          { status: 400 }
        );
      }
      if (project.paymentStatus !== "funded" && validatedData.paymentStatus !== "completed") {
        socket.disconnect();
        return NextResponse.json(
          {
            success: false,
            message: "Cannot mark project as completed without a funded payment.",
          },
          { status: 400 }
        );
      }
      project.status = "completed";
      project.paymentStatus = "completed"; // Ensure paymentStatus is set to completed
      await ProposalModel.updateOne(
        { _id: acceptedProposal._id },
        { paymentStatus: "completed", updatedAt: new Date() }
      );
      await ProposalModel.deleteMany({ projectId, proposalStatus: "pending" });
      socket.emit("projectStatusUpdated", {
        projectId,
        status: "completed",
        message: `Project ${project.title} has been marked as completed.`,
      });
      socket.emit("paymentStatusUpdated", {
        projectId,
        paymentStatus: "completed",
        message: `Payment for project ${project.title} has been marked as completed.`,
      });
    } else if (validatedData.status === "cancelled") {
      await ProposalModel.deleteMany({ projectId });
      project.paymentStatus = "failed";
      socket.emit("projectStatusUpdated", {
        projectId,
        status: "cancelled",
        message: `Project ${project.title} has been cancelled and all proposals deleted.`,
      });
      socket.emit("paymentStatusUpdated", {
        projectId,
        paymentStatus: "failed",
        message: `Payment for project ${project.title} has been marked as failed.`,
      });
    } else if (validatedData.status === "open") {
      socket.emit("projectStatusUpdated", {
        projectId,
        status: "open",
        message: `Project ${project.title} has been reopened.`,
      });
    }

    await project.save();
    socket.disconnect();

    return NextResponse.json(
      {
        success: true,
        message: "Project updated successfully",
        data: project,
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only admins can delete projects." },
        { status: 401 }
      );
    }

    // Extract projectId from params (await the Promise)
    const params = await context.params;
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await ProjectModel.findById(projectId) as IProject | null;
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    await ProjectModel.findByIdAndDelete(projectId);
    await ProposalModel.deleteMany({ projectId });

    // Emit Socket.IO event
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
    socket.emit("projectDeleted", {
      projectId,
      message: `Project ${project.title} has been deleted.`,
    });
    socket.disconnect();

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