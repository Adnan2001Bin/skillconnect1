import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendVerificationEmail } from "@/emails/VerificationEmail";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";

const verifySchema = z.object({
  userName: z.string().min(1, "Username is required"),
  code: z.string().optional(),
  action: z.enum(["verify", "resend"]).default("verify"),
});

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    const { userName, code, action } = verifySchema.parse(body);
    const decodedUserName = decodeURIComponent(userName);
    const user = await UserModel.findOne({ userName: decodedUserName });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (action === "resend") {
      // Generate new verification code
      const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Update user with new code
      user.verificationCode = newVerificationCode;
      user.verificationCodeExpires = expiryDate;
      await user.save();

      // Send new verification email
      const emailResponse = await sendVerificationEmail({
        email: user.email,
        userName: user.userName,
        verificationCode: newVerificationCode,
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
          message: "New verification code sent successfully",
        },
        { status: 200 }
      );
    }

    // Verification logic
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Verification code is required" },
        { status: 400 }
      );
    }

    const isCodeValid = user.verificationCode === code;
    const isCodeNotExpired = new Date(user.verificationCodeExpires) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isEmailVerified = true; // Set email verification flag
      if (user.role !== "talent" || user.isAdminApproved) {
        user.isVerified = true; // Set final verification only for non-talents or approved talents
      }
      await user.save();

      return NextResponse.json(
        {
          success: true,
          message: user.role === "talent" && !user.isAdminApproved
            ? "Email verified successfully. Awaiting admin approval."
            : "Account verified successfully",
        },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Incorrect verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in verification process:", error);
    return NextResponse.json(
      { success: false, message: "Error processing your request" },
      { status: 500 }
    );
  }
}