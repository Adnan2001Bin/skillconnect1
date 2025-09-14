import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";

export async function GET() {
  try {
    await connectDB();
    const talents = await UserModel.find({ 
      role: "talent",
      isVerified: true 
    }).select(
      "_id userName email role profilePicture category services skills bio location aboutThisGig ratePlans socialLinks"
    ).lean();
    
    // Transform the data to match the Talent interface
    const talentData = talents.map(talent => ({
      _id: talent._id.toString(),
      userName: talent.userName,
      email: talent.email,
      role: talent.role,
      profilePicture: talent.profilePicture || null,
      category: talent.category || null,
      services: talent.services || [],
      skills: talent.skills || [],
      bio: talent.bio || null,
      location: talent.location || null,
      aboutThisGig: talent.aboutThisGig || null,
      ratePlans: talent.ratePlans || [],
      socialLinks: talent.socialLinks || [],
    }));

    return NextResponse.json({ 
      success: true, 
      data: talentData 
    });
  } catch (error) {
    console.error("Error fetching talents:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch talents",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}