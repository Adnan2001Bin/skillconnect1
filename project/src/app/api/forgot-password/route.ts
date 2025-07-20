import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { resetPasswordSchema } from "@/schemas/resetPasswordSchema";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/emails/PasswordResetEmail";
import { z } from "zod";
import bcrypt from "bcryptjs";

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ResetPasswordResponse>> {
  await connectDB();

  try {
    const body = await request.json();
    const parsedData = resetPasswordSchema.parse(body);

    if (parsedData.action === "request") {
      if (!parsedData.email) {
        return NextResponse.json(
          { success: false, message: "Email is required" },
          { status: 400 }
        );
      }

      const user = await UserModel.findOne({email:parsedData.email})

      if (!user || !user.isVerified) {
        return NextResponse.json(
          { success: false, message: "User not found or not verified" },
          { status: 404 }
        );
      }

      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      const emailResponse = await sendPasswordResetEmail({
        email: user.email,
        userName: user.userName,
        resetToken,
      })

      if (!emailResponse.success) {
        return NextResponse.json(
          { success: false, message: emailResponse.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Password reset email sent successfully." },
        { status: 200 }
      );
    } else if (parsedData.action === "reset") {
      if (!parsedData.token || !parsedData.password) {
        return NextResponse.json(
          { success: false, message: "Token and new password are required" },
          { status: 400 }
        );
      }

      const user = await UserModel.findOne({
        resetPasswordToken: parsedData.token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired reset token" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(parsedData.password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return NextResponse.json(
        { success: true, message: "Password reset successfully." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error in password reset process:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Error processing password reset";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}