import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";



export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "talent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only talents can view their orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await connectDB();

    const query: any = { talentId: session.user._id };
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
    console.error("Error fetching talent orders:", error);
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

