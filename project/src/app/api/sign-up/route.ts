import { NextRequest, NextResponse } from "next/server";
import { signUpSchema } from "@/schemas/signUpSchema";
import { sendVerificationEmail } from "@/emails/VerificationEmail";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Interface for the response data
interface SignUpResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignUpResponse>> {
  await connectDB();

  try {
    // Parse and validate request body
    const body = await request.json();
    const parsedData = signUpSchema.parse(body); // Validate with Zod

    // Check for existing user by username (verified or unverified)
    const existingUserByUsername = await UserModel.findOne({
      userName: parsedData.userName,
    });
    if (existingUserByUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }

    // Check for existing user by email
    const existingUserByEmail = await UserModel.findOne({
      email: parsedData.email,
    });

    let user;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "User already exists with this email",
          },
          { status: 400 }
        );
      } else {
        // Update existing unverified user
        const hashedPassword = await bcrypt.hash(parsedData.password, 10);
        existingUserByEmail.userName = parsedData.userName;
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verificationCode = verificationCode;
        existingUserByEmail.verificationCodeExpires = expiryDate;
        user = await existingUserByEmail.save();
      }
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(parsedData.password, 10);
      user = new UserModel({
        ...parsedData,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires: expiryDate,
      });
      await user.save();
    }

    // Send verification email
    const emailResponse = await sendVerificationEmail({
      email: parsedData.email,
      userName: parsedData.userName,
      verificationCode,
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please verify your account.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error registering user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Error registering user";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}