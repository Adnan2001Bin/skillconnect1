import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
  timeRange: z.enum(["7", "30", "90"]).transform((val) => parseInt(val, 10)).optional(),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const validatedQuery = querySchema.parse(query);

    let filter: any = {};

    // Apply payment status filter
    if (validatedQuery.paymentStatus) {
      filter.paymentStatus = validatedQuery.paymentStatus;
    }

    // Apply time range filter
    if (validatedQuery.timeRange) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - validatedQuery.timeRange);
      filter.createdAt = { $gte: daysAgo };
    }

    // Apply search filter (case-insensitive search on client/talent usernames or order ID)
    if (validatedQuery.search) {
      filter.$or = [
        { "clientUserName": { $regex: validatedQuery.search, $options: "i" } },
        { "talentUserName": { $regex: validatedQuery.search, $options: "i" } },
        { _id: { $regex: validatedQuery.search, $options: "i" } },
      ];
    }

    const orders = await OrderModel.find(filter)
      .select("_id clientId talentId clientUserName talentUserName ratePlan paymentStatus createdAt updatedAt")
      .lean();

    // Transform orders into transactions
    const transactions = orders.map((order) => ({
      _id: order._id,
      orderId: order._id,
      clientId: order.clientId,
      talentId: order.talentId,
      clientUserName: order.clientUserName || "Unknown",
      talentUserName: order.talentUserName || "Unknown",
      amount: order.ratePlan.price || 0, // Assuming price is in ratePlan
      paymentStatus: order.paymentStatus || "pending",
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json(
      { success: true, data: transactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch transactions.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}