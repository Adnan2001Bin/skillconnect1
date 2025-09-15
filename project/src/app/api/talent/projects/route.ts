import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import ProjectModel, { IProject } from "@/models/projects.model";
import UserModel from "@/models/user.model";

export async function GET() {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please sign in as a talent.",
        },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch the talent's category
    const talent = await UserModel.findById(session.user._id)
      .select("category")
      .lean();
    if (!talent || !talent.category) {
      return NextResponse.json(
        {
          success: false,
          message: "Talent profile or category not found.",
        },
        { status: 404 }
      );
    }

    // Fetch projects matching the talent's category and status
    const projects = await ProjectModel.find({
      category: talent.category,
      status: { $in: ["open", "in-progress", "completed"] },
    })
      .select(
        "_id title description category services budget timeline requirements files clientId status paymentStatus review createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean<IProject[]>();

    // Transform projects to ensure IProject interface compliance
    const projectData = projects.map((project) => ({
      _id: project._id.toString(),
      title: project.title,
      description: project.description,
      category: project.category,
      services: project.services || [],
      budget: project.budget,
      timeline: project.timeline,
      requirements: project.requirements,
      files: project.files || [],
      clientId: project.clientId,
      status: project.status,
      paymentStatus: project.paymentStatus || "pending",
      review: project.review || undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: projectData,
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