import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "../auth/[...nextauth]/options";

// Re-use the project schema from the frontend
const projectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().nonempty(),
  services: z.array(z.string()).min(1),
  budget: z.number().min(10).max(100000),
  timeline: z.number().min(1).max(365),
  requirements: z.string().min(10).max(1000),
  files: z.array(z.string()).optional(),
  clientId: z.string().nonempty(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can post projects." },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();
    console.log("Request body:", body); // Log the incoming request body for debugging

    const validatedData = projectSchema.parse({
      ...body,
      clientId: session.user._id,
    });

    const project = new ProjectModel({
      ...validatedData,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await project.save();

    return NextResponse.json(
      { success: true, data: project, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors); // Log validation errors
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating project:", error); // Log detailed error
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    await connectDB();
    const projects = await ProjectModel.find().lean();

    return NextResponse.json(
      { success: true, data: projects, message: "Projects fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
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