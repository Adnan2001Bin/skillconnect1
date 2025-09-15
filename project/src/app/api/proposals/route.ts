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

interface LeanProposal {
  _id: string;
  projectId: string;
  talentId: string;
  bid: number;
  proposalStatus: string;
  deliverables?: {
    files: string[];
    note?: string;
    submittedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectTitle {
  _id: string;
  title: string;
}

interface ProposalResponse {
  _id: string;
  projectTitle: string;
  projectId: string;
  talentId: string;
  bid: number;
  proposalStatus: string;
  deliverables?: {
    files: string[];
    note: string | null;
    submittedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

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

    // 4. Verify project exists and is open, and get clientId
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

    // 6. Create new proposal with clientId
    const newProposal = new ProposalModel({
      projectId: validatedData.projectId,
      talentId: validatedData.talentId,
      clientId: project.clientId, // ADD THIS LINE - get clientId from the project
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

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their proposals." },
        { status: 401 }
      );
    }

    // 2. Extract talentId from query params
    const { searchParams } = new URL(req.url);
    const talentId = searchParams.get("talentId");
    if (!talentId) {
      return NextResponse.json(
        { success: false, message: "Missing talentId" },
        { status: 400 }
      );
    }

    // 3. Connect to the database
    await connectDB();

    // 4. Fetch proposals for the talent
    const proposals = await ProposalModel.find({ talentId }).lean<LeanProposal[]>();

    // 5. Fetch project titles for each proposal
    const proposalsWithProjectTitles = await Promise.all(
      proposals.map(async (proposal) => {
        const project = await ProjectModel.findById(proposal.projectId)
          .select("title")
          .lean<ProjectTitle>();
        return {
          _id: proposal._id.toString(),
          projectTitle: project?.title || "Unknown",
          projectId: proposal.projectId.toString(),
          talentId: proposal.talentId.toString(),
          bid: proposal.bid,
          proposalStatus: proposal.proposalStatus,
          deliverables: proposal.deliverables
            ? {
                files: proposal.deliverables.files || [],
                note: proposal.deliverables.note || null,
                submittedAt: proposal.deliverables.submittedAt?.toISOString() || null,
              }
            : undefined,
          createdAt: proposal.createdAt.toISOString(),
          updatedAt: proposal.updatedAt.toISOString(),
        } as ProposalResponse;
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Proposals fetched successfully",
        data: proposalsWithProjectTitles,
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