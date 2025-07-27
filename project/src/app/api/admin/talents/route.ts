import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
export async function GET() {
  try {
    await connectDB();
    const talents = await UserModel.find({ role: "talent" }).lean();
    return NextResponse.json({ success: true, data: talents });
  } catch (error) {
    console.error("Error fetching talents:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch talents" },
      { status: 500 }
    );
  }
}
