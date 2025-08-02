import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "../auth/[...nextauth]/options";
import { createOrderSchema } from "@/schemas/createOrderSchema";



export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can request orders." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    // 3. Connect to the database
    await connectDB();

    // 4. Create new order
    const order = new OrderModel({
      talentId: validatedData.talentId,
      clientId: session.user._id,
      ratePlan: validatedData.ratePlan,
      projectDetails: validatedData.projectDetails,
      status: "pending",
    });

    // 5. Save order
    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: "Order requested successfully",
        data: order,
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
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to create order.",
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
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only clients can view orders." },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const talentId = searchParams.get("talentId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "clientId is required" },
        { status: 400 }
      );
    }

    // 3. Connect to the database
    await connectDB();

    // 4. Fetch orders
    const query: any = { clientId };
    if (talentId) {
      query.talentId = talentId;
    }
    if (status) {
      query.status = status;
    }

    const orders = await OrderModel.find(query).lean();

    return NextResponse.json(
      {
        success: true,
        message: "Orders fetched successfully",
        data: orders,
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