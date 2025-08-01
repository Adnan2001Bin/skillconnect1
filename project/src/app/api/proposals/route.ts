import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProposalModel from "@/models/proposal.model";
import { authOptions } from "../auth/[...nextauth]/options";

// Define the schema for proposal validation, matching the frontend form
const proposalSchema = z.object({
  projectId: z.string().nonempty({ message: "Project ID is required" }),
  talentId: z.string().nonempty({ message: "Talent ID is required" }),
  bid: z.number().min(10, { message: "Bid must be at least $10" }).max(100000, { message: "Bid must not exceed $100,000" }),
  coverLetter: z.string().min(50, { message: "Cover letter must be at least 50 characters" }).max(1000, { message: "Cover letter must not exceed 1000 characters" }),
  files: z.array(z.string().url()).optional(),
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

    // 2. Connect to the database
    await connectDB();
    const body = await req.json();

    // 3. Validate the request body with Zod
    const validatedData = proposalSchema.parse({
      ...body,
      talentId: session.user._id, // Ensure talentId comes from the session for security
    });

    // 4. Check if the talent has already submitted a proposal for this project
    const existingProposal = await ProposalModel.findOne({
      projectId: validatedData.projectId,
      talentId: validatedData.talentId,
    });

    if (existingProposal) {
      return NextResponse.json(
        { success: false, message: "You have already submitted a proposal for this project." },
        { status: 409 }
      );
    }

    // 5. Create a new proposal document
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

    // 6. Save the new proposal to the database
    await newProposal.save();

    // 7. Return success response
    return NextResponse.json(
      { success: true, message: "Proposal submitted successfully!", data: newProposal },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors from Zod
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error submitting proposal:", error);
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

