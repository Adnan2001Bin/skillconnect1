import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// GET handler to fetch a single talent by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
)  {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Await params to resolve the dynamic route parameter
    const { id } = await context.params;

    // Fetch talent by ID
    const talent = await UserModel.findOne({ _id: id, role: "talent" }).lean();
    if (!talent) {
      return NextResponse.json(
        { success: false, message: "Talent not found." },
        { status: 404 }
      );
    }

    // Return talent data
    return NextResponse.json({
      success: true,
      data: {
        _id: talent._id.toString(),
        userName: talent.userName,
        email: talent.email,
        role: talent.role,
        isVerified: talent.isVerified,
        isAdminApproved: talent.isAdminApproved,
        isEmailVerified: talent.isEmailVerified,
        profilePicture: talent.profilePicture || null,
        category: talent.category || null,
        location: talent.location || null,
        bio: talent.bio || null,
        aboutThisGig: talent.aboutThisGig || null,
        skills: talent.skills || [],
        portfolio: talent.portfolio || [],
        ratePlans: talent.ratePlans || [],
        socialLinks: talent.socialLinks || [],
      },
    });
  } catch (error) {
    console.error("Error fetching talent:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}