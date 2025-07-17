import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { z } from "zod";

const verifySchema = z.object({
  userName: z.string().min(1, "Username is required"),
  code: z.string().min(1, "Verification code is required"),
});

export async function POST(request: Request) {
  await connectDB();

  try {
    const body = await request.json();
    const { userName, code } = verifySchema.parse(body);
    const decodedUserName = decodeURIComponent(userName);
    const user = await UserModel.findOne({ userName: decodedUserName });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isCodeValid = user.verificationCode === code;

    const isCodeNotExpired =
      new Date(user.verificationCodeExpires) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();

      return Response.json(
        { success: true, message: "Account verified successfully" },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      // Code has expired
      return Response.json(
        {
          success: false,
          message:
            "Verification code has expired. Please sign up again to get a new code.",
        },
        { status: 400 }
      );
    } else {
      // Code is incorrect
      return Response.json(
        { success: false, message: "Incorrect verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    return Response.json(
      { success: false, message: "Error verifying user" },
      { status: 500 }
    );
  }
}
