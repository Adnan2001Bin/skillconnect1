import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import ProposalModel from "@/models/proposal.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Stripe from "stripe";
import { io } from "socket.io-client";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-07-30.basil",
});

const initiatePaymentSchema = z.object({
  projectId: z.string().nonempty(),
  amount: z.number().min(10),
  proposalId: z.string().nonempty(),
});


export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can initiate payments." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = initiatePaymentSchema.parse(body);

    // 3. Connect to database
    await connectDB();

    // 4. Verify project and proposal
    const project = await ProjectModel.findById(validatedData.projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.clientId !== session.user._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You can only initiate payments for your own projects." },
        { status: 403 }
      );
    }

    const proposal = await ProposalModel.findById(validatedData.proposalId);
    if (!proposal || proposal.projectId !== validatedData.projectId || proposal.proposalStatus !== "accepted") {
      return NextResponse.json(
        { success: false, message: "Invalid or non-accepted proposal" },
        { status: 400 }
      );
    }

    // 5. Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Project: ${project.title}`,
              description: `Payment for accepted proposal`,
            },
            unit_amount: Math.round(validatedData.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&project_id=${validatedData.projectId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_CANCEL_URL}?project_id=${validatedData.projectId}`,
      metadata: {
        projectId: validatedData.projectId,
        proposalId: validatedData.proposalId,
        clientId: session.user._id,
      },
    });

    // 6. Update project payment status to "funded" (will be finalized in webhook)
    project.paymentStatus = "funded";
    await project.save();

    // 7. Emit Socket.IO event
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
    socket.emit("paymentStatusUpdated", {
      projectId: validatedData.projectId,
      paymentStatus: "funded",
      message: `Payment initiated for project ${project.title}.`,
    });
    socket.disconnect();

    return NextResponse.json({
      success: true,
      message: "Payment initiated successfully",
      gatewayPageURL: checkoutSession.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to initiate payment.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}