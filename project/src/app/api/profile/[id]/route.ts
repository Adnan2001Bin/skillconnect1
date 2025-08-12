import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

interface TalentResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    userName: string;
    email: string;
    profilePicture?: string | null;
    category?: string | null;
    location?: string | null;
    bio?: string | null;
    aboutThisGig?: string | null;
    skills?: string[];
    portfolio?: { title: string; description: string; imageUrl?: string | null; projectUrl?: string | null }[];
    ratePlans?: { type: string; price: number; description: string; whatsIncluded: string[]; deliveryDays: number; revisions: number }[];
    socialLinks?: { platform: string; url: string }[];
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<TalentResponse>> {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

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