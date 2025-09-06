import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/connectDB";
import ProjectModel from "@/models/projects.model";
import OrderModel from "@/models/order.model";
import { io } from "socket.io-client";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json(
        { success: false, message: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json(
        { success: false, message: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve metadata
      const { projectId, proposalId, clientId, orderId } = session.metadata || {};

      await connectDB();

      if (orderId) {
        // Handle Order payment
        const order = await OrderModel.findById(orderId);
        if (!order) {
          return NextResponse.json(
            { success: false, message: "Order not found" },
            { status: 404 }
          );
        }

        // Update order payment status
        order.paymentStatus = "completed";
        await order.save();

        // Emit Socket.IO event for order
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
        socket.emit("paymentStatusUpdated", {
          orderId,
          paymentStatus: "completed",
          message: `Payment for order ${order.projectDetails.title} has been completed.`,
        });
        socket.disconnect();

        return NextResponse.json(
          { success: true, message: "Order payment status updated successfully" },
          { status: 200 }
        );
      } else if (projectId && proposalId && clientId) {
        // Handle Project payment
        const project = await ProjectModel.findById(projectId);
        if (!project) {
          return NextResponse.json(
            { success: false, message: "Project not found" },
            { status: 404 }
          );
        }

        // Update project payment status
        project.paymentStatus = "funded";
        await project.save();

        // Emit Socket.IO event for project
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
        socket.emit("paymentStatusUpdated", {
          projectId,
          paymentStatus: "funded",
          message: `Payment for project ${project.title} has been funded.`,
        });
        socket.disconnect();

        return NextResponse.json(
          { success: true, message: "Project payment status updated successfully" },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: "Missing required metadata (projectId, proposalId, clientId, or orderId)" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Event received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling webhook:", error);
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

export const config = {
  api: {
    bodyParser: false,
  },
};