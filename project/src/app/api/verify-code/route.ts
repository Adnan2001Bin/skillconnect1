import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { z } from "zod";
import { sendVerificationEmail } from "@/emails/VerificationEmail";

const verifySchema = z.object({
  userName: z.string().min(1, "Username is required"),
  code: z.string().optional(), // Make code optional for resend functionality
  action: z.enum(["verify", "resend"]).default("verify"), // Add action type
});

export async function POST(request: Request) {
  await connectDB();

  try {
    const body = await request.json();
    const { userName, code, action } = verifySchema.parse(body);
    const decodedUserName = decodeURIComponent(userName);
    const user = await UserModel.findOne({ userName: decodedUserName });

    if (!user) {
      return Response.json(
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
        return Response.json(
          {
            success: false,
            message: emailResponse.message,
          },
          { status: 500 }
        );
      }

      return Response.json(
        {
          success: true,
          message: "New verification code sent successfully",
        },
        { status: 200 }
      );
    }

    // Original verification logic
    if (!code) {
      return Response.json(
        { success: false, message: "Verification code is required" },
        { status: 400 }
      );
    }

    const isCodeValid = user.verificationCode === code;
    const isCodeNotExpired = new Date(user.verificationCodeExpires) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();

      return Response.json(
        { success: true, message: "Account verified successfully" },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message:
            "Verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        { success: false, message: "Incorrect verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in verification process:", error);
    return Response.json(
      { success: false, message: "Error processing your request" },
      { status: 500 }
    );
  }
}