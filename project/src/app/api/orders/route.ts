import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";
import { authOptions } from "../auth/[...nextauth]/options";
import { createOrderSchema } from "@/schemas/createOrderSchema";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-07-30.basil",
});

// Define response type for GET
interface OrderResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    talentId: string;
    clientId: string;
    talentUserName: string;
    clientUserName: string;
    ratePlan: {
      type: "Basic" | "Standard" | "Premium";
      description: string;
      price: number;
      whatsIncluded: string[];
      deliveryDays: number;
      revisions: number;
    };
    projectDetails: {
      title: string;
      description: string;
    };
    status: string;
    paymentStatus: string; // Added to response type
    createdAt: string;
  }[];
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<OrderResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const talentId = searchParams.get("talentId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const timeRange = searchParams.get("timeRange");
    const search = searchParams.get("search");

    await connectDB();

    const query: any = {};
    if (session.user.role !== "admin") {
      if (session.user.role === "user") {
        query.clientId = session.user._id;
      } else if (session.user.role === "talent") {
        query.talentId = session.user._id;
      }
    }

    if (talentId) query.talentId = talentId;
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;

    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "7":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "30":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case "90":
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
      }
      query.createdAt = { $gte: startDate };
    }

    if (search) {
      query.$or = [
        { "projectDetails.title": { $regex: search, $options: "i" } },
        { "projectDetails.description": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await OrderModel.find(query).lean();

    const ordersWithUserNames = await Promise.all(
      orders.map(async (order: any) => {
        const [talent, client] = await Promise.all([
          UserModel.findById(order.talentId).select("userName").lean(),
          UserModel.findById(order.clientId).select("userName").lean(),
        ]);
        return {
          ...order,
          talentUserName: talent?.userName || "Unknown",
          clientUserName: client?.userName || "Unknown",
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Orders fetched successfully",
        data: ordersWithUserNames,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch orders.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can request orders." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    await connectDB();

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${validatedData.ratePlan.type} Plan - ${validatedData.projectDetails.title}`,
              description: validatedData.projectDetails.description,
            },
            unit_amount: Math.round(validatedData.ratePlan.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_CANCEL_URL}`,
      metadata: {
        talentId: validatedData.talentId,
        clientId: session.user._id,
        ratePlan: JSON.stringify(validatedData.ratePlan),
        projectDetails: JSON.stringify(validatedData.projectDetails),
      },
    });

    const order = new OrderModel({
      talentId: validatedData.talentId,
      clientId: session.user._id,
      ratePlan: validatedData.ratePlan,
      projectDetails: validatedData.projectDetails,
      status: "pending",
      paymentStatus: "pending", // Initial payment status
    });

    await order.save();
    return NextResponse.json(
      {
        success: true,
        message: "Checkout session created and Order requested successfully",
        sessionId: checkoutSession.id,
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
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to create checkout session.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}