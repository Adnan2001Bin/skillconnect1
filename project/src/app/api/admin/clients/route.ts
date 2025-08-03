import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

interface ClientResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function GET(request: NextRequest): Promise<NextResponse<ClientResponse>> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Only admins can access this endpoint." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const clients = await UserModel.find({ role: "user" })
      .select("userName email role bio profilePicture")
      .lean();
    return NextResponse.json(
      {
        success: true,
        message: "Clients retrieved successfully",
        data: clients,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    const errorMessage = error instanceof Error ? error.message : "Error fetching clients";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ClientResponse>> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Only admins can access this endpoint." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const { clientId } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, message: "Invalid client ID" },
        { status: 400 }
      );
    }

    const client = await UserModel.findByIdAndDelete(clientId);
    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    const errorMessage = error instanceof Error ? error.message : "Error deleting client";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}