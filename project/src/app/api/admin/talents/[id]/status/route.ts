import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendApprovalEmail } from "@/emails/ApprovalEmail";
import { sendRejectionEmail } from "@/emails/RejectionEmail";
import { sendDeletionEmail } from "@/emails/DeletionEmail";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Parse request body
    const { action, rejectionReason, deletionReason } = await req.json();
    if (!["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action." },
        { status: 400 }
      );
    }

    // Fetch talent
    const talent = await UserModel.findOne({ _id: params.id, role: "talent" });
    if (!talent) {
      return NextResponse.json(
        { success: false, message: "Talent not found." },
        { status: 404 }
      );
    }

    if (action === "approve") {
      talent.isVerified = true;
      talent.rejectionReason = null;
      await talent.save();

      // Send approval email
      const emailResponse = await sendApprovalEmail({
        email: talent.email,
        userName: talent.userName,
      });

      if (!emailResponse.success) {
        return NextResponse.json(
          { success: false, message: "Failed to send approval email." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Talent approved successfully." },
        { status: 200 }
      );
    } else if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, message: "Rejection reason is required." },
          { status: 400 }
        );
      }

      talent.isVerified = false;
      talent.rejectionReason = rejectionReason;
      await talent.save();

      // Send rejection email
      const emailResponse = await sendRejectionEmail({
        email: talent.email,
        userName: talent.userName,
        rejectionReason,
      });

      if (!emailResponse.success) {
        return NextResponse.json(
          { success: false, message: "Failed to send rejection email." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Talent rejected successfully." },
        { status: 200 }
      );
    } else if (action === "delete") {
      if (!deletionReason) {
        return NextResponse.json(
          { success: false, message: "Deletion reason is required." },
          { status: 400 }
        );
      }

      
      // Delete the talent account
      await UserModel.deleteOne({ _id: params.id });

      // Send deletion email
      const emailResponse = await sendDeletionEmail({
        email: talent.email,
        userName: talent.userName,
        deletionReason,
      });

      if (!emailResponse.success) {
        return NextResponse.json(
          { success: false, message: "Failed to send deletion email." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Talent account deleted successfully." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating talent status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}