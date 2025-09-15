import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    userName: string;
    email?: string;
    role?: string;
    bio?: string | null;
    profilePicture?: string | null;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Change this line
): Promise<NextResponse<ProfileResponse>> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "talent"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Only admins and talents can view profiles." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    // Await the params first
    const params = await context.params;
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await UserModel.findById(id)
      .select("userName email role bio profilePicture")
      .lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User profile retrieved successfully",
        data: {
          userName: user.userName,
          email: user.email,
          role: user.role,
          bio: user.bio,
          profilePicture: user.profilePicture,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Error fetching user profile";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}