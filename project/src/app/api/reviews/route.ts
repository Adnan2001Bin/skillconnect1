import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import OrderModel from "@/models/order.model";
import UserModel from "@/models/user.model";

interface ReviewResponse {
  success: boolean;
  message: string;
  data?: Review[];
}

interface Review {
  _id: string;
  orderId: string;
  talentUserName: string;
  rating: number;
  comment?: string;
  reviewedAt: string;
}

export async function GET(): Promise<NextResponse<ReviewResponse>> {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Only clients can view their reviews" },
        { status: 401 }
      );
    }

    const clientId = session.user._id;
    const orders = await OrderModel.find({ clientId, review: { $exists: true } })
      .populate<{ talentId: { userName: string } }>({
        path: "talentId",
        model: UserModel,
        select: "userName",
      })

    const reviews: Review[] = orders.map((order) => ({
      _id: order._id.toString(),
      orderId: order._id.toString(),
      talentUserName: order.talentId.userName || "Unknown Talent", // Access populated field
      rating: order.review!.rating,
      comment: order.review!.comment,
      reviewedAt: order.review!.reviewedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Reviews retrieved successfully",
        data: reviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching reviews" },
      { status: 500 }
    );
  }
}