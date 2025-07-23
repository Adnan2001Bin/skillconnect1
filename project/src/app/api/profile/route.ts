import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import UserModel, { IPortfolioItem, IRatePlan, IUser } from "@/models/user.model";
import { z } from "zod";
import { userProfileSchema, talentProfileSchema } from "@/schemas/profileSchema";


interface IUserModelSchema {
  userName: string;
  email: string;
  password: string;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
  industry?: string | null;
  preferences?: string[];
  role: "user" | "talent" | "admin";
  skills?: string[];
  portfolio?: IPortfolioItem[];
  ratePlans?: IRatePlan[];
  aboutThisGig?: string | null;
  whatIOffer?: string[];
  education?: string[];
  experience?: string[];
  socialLinks?: { platform: string; url: string }[];
  languageProficiency?: string[];
  verificationCode: string;
  verificationCodeExpires: Date;
  isVerified: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    userName: string;
    profilePicture?: string | null;
    bio?: string | null;
    location?: string | null;
    industry?: string | null;
    preferences?: string[];
    skills?: string[];
    portfolio?: { title: string; description: string; imageUrl?: string | null; projectUrl?: string | null }[]; // Updated to allow null
    ratePlans?: { type: string; price: number; description: string; whatsIncluded: string[]; deliveryDays: number }[];
    aboutThisGig?: string | null;
    whatIOffer?: string[];
    socialLinks?: { platform: string; url: string }[];
    languageProficiency?: string[];
  };
}


export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    const user = await UserModel.findOne({ email: session.user.email }).select(
      "userName profilePicture bio location industry preferences skills portfolio ratePlans aboutThisGig whatIOffer socialLinks languageProficiency"
    );
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile retrieved successfully",
        data: {
          userName: user.userName,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          industry: user.industry,
          preferences: user.preferences,
          skills: user.skills,
          portfolio: user.portfolio,
          ratePlans: user.ratePlans,
          aboutThisGig: user.aboutThisGig,
          whatIOffer: user.whatIOffer,
          socialLinks: user.socialLinks,
          languageProficiency: user.languageProficiency,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Error fetching profile";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const isTalent = session.user.role === "talent";
    const schema = isTalent ? talentProfileSchema : userProfileSchema;

    // Use a try-catch block for Zod parsing to catch validation errors
    let parsedData;
    try {
      parsedData = schema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: validationError.errors.map((e) => e.message).join(", "),
          },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a Zod error
    }

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const updateData: Partial<IUser> = {}; // Use the extended IUserModelSchema for better type safety


    if ("profilePicture" in parsedData && parsedData.profilePicture !== undefined) updateData.profilePicture = parsedData.profilePicture;
    if ("bio" in parsedData && parsedData.bio !== undefined) updateData.bio = parsedData.bio;
    if ("location" in parsedData && parsedData.location !== undefined) updateData.location = parsedData.location;
    if ("languageProficiency" in parsedData && parsedData.languageProficiency !== undefined) updateData.languageProficiency = parsedData.languageProficiency;

    // User-specific fields
    if (!isTalent) {
      const userData = parsedData as z.infer<typeof userProfileSchema>;
      if (userData.industry !== undefined) updateData.industry = userData.industry;
      if (userData.preferences !== undefined) updateData.preferences = userData.preferences;
    }

    // Talent-specific fields
    if (isTalent) {
      const talentData = parsedData as z.infer<typeof talentProfileSchema>;
      if (talentData.skills !== undefined) updateData.skills = talentData.skills;
      if (talentData.portfolio !== undefined) updateData.portfolio = talentData.portfolio;
      if (talentData.ratePlans !== undefined) updateData.ratePlans = talentData.ratePlans;
      if (talentData.aboutThisGig !== undefined) updateData.aboutThisGig = talentData.aboutThisGig;
      if (talentData.whatIOffer !== undefined) updateData.whatIOffer = talentData.whatIOffer;
      if (talentData.socialLinks !== undefined) updateData.socialLinks = talentData.socialLinks; // Moved inside talent-specific block
      if (talentData.education !== undefined) updateData.education = talentData.education; // Assuming these are talent-specific
      if (talentData.experience !== undefined) updateData.experience = talentData.experience; // Assuming these are talent-specific
    }

    await UserModel.updateOne(
      { email: session.user.email },
      { $set: updateData }
    );

    return NextResponse.json(
      { success: true, message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Error updating profile";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}