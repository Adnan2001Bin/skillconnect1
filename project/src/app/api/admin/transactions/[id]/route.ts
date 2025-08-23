import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/connectDB";
import TransactionModel from "@/models/transaction.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTransactionSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "refunded"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { transactionId } = await context.params;
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    await connectDB();

    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    transaction.status = validatedData.status;
    transaction.updatedAt = new Date();
    await transaction.save();

    return NextResponse.json(
      {
        success: true,
        message: `Transaction ${validatedData.status.toLowerCase()} successfully`,
        data: {
          _id: transaction._id.toString(),
          orderId: transaction.orderId,
          talentId: transaction.talentId,
          clientId: transaction.clientId,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
          talentUserName: transaction.talentUserName,
          clientUserName: transaction.clientUserName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update transaction.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}