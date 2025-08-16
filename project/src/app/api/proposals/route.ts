import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import ProjectModel from "@/models/projects.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const createProposalSchema = z.object({
  projectId: z.string().nonempty({ message: "Project ID is required" }),
  talentId: z.string().nonempty({ message: "Talent ID is required" }),
  bid: z.number().min(10, { message: "Bid must be at least 10" }),
  coverLetter: z.string().min(10, { message: "Cover letter must be at least 10 characters" }).max(1000),
  files: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can submit proposals." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = createProposalSchema.parse(body);

    // 3. Connect to the database
    await connectDB();

    // 4. Verify project exists and is open
    const project = await ProjectModel.findById(validatedData.projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }
    if (project.status !== "open") {
      return NextResponse.json(
        { success: false, message: "Project is not open for proposals" },
        { status: 400 }
      );
    }

    // 5. Check for existing active proposal
    const existingProposal = await ProposalModel.findOne({
      projectId: validatedData.projectId,
      talentId: validatedData.talentId,
      proposalStatus: { $in: ["pending", "accepted"] },
    });
    if (existingProposal) {
      return NextResponse.json(
        {
          success: false,
          message: `You have already submitted a ${existingProposal.proposalStatus} proposal for this project.`,
        },
        { status: 400 }
      );
    }

    // 6. Create new proposal
    const newProposal = new ProposalModel({
      projectId: validatedData.projectId,
      talentId: validatedData.talentId,
      bid: validatedData.bid,
      coverLetter: validatedData.coverLetter,
      files: validatedData.files || [],
      proposalStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newProposal.save();

    return NextResponse.json(
      {
        success: true,
        message: "Proposal submitted successfully",
        data: newProposal,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to submit proposal.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}