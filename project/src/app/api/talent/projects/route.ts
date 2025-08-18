import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import { projectSchema } from "@/schemas/projectSchema";
import connectDB from "@/lib/connectDB";
import Project from "@/models/projects.model";
import projectsModel from "@/models/projects.model";

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
    const projects = await projectsModel
      .find({ 
        status: { $in: ["open", "in-progress" ,"completed"] }
      })
      .sort({ createdAt: -1 });
    return NextResponse.json(
      {
        success: true,
        data: projects,
        message: "Projects fetched successfully",
      },
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
