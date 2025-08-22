
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";

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

      // Retrieve the order ID or clientId/talentId from metadata to find the order
      const { clientId, talentId } = session.metadata || {};
      if (!clientId || !talentId) {
        return NextResponse.json(
          { success: false, message: "Missing required metadata (clientId or talentId)" },
          { status: 400 }
        );
      }

      await connectDB();

      // Find the existing order based on clientId and talentId
      const order = await OrderModel.findOne({ clientId, talentId, status: "pending" }).exec();
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      // Update the order with payment status
      order.paymentStatus = "completed"; // Set to "completed" on successful payment
      await order.save();

      return NextResponse.json(
        { success: true, message: "Order payment status updated successfully" },
        { status: 200 }
      );
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

// Disable body parsing to get raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};