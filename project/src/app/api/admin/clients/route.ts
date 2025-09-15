import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserModel from "@/models/user.model";
import ProjectModel from "@/models/projects.model";
import OrderModel from "@/models/order.model";
import ProposalModel from "@/models/proposal.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendDeletionEmail } from "@/emails/DeletionEmail";

interface Response {
  success: boolean;
  message: string;
  error?: string;
}

export async function GET(): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Only admins can access client data.",
        },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectDB();

    // Fetch all users with role "user"
    const clients = await UserModel.find({ role: "user" })
      .select("_id userName email bio")
      .lean();

    // Transform the data to ensure only necessary fields are returned
    const clientData = clients.map((client) => ({
      _id: client._id.toString(),
      userName: client.userName,
      email: client.email,
      bio: client.bio || null,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Clients retrieved successfully",
        data: clientData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch clients.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<Response>> {
  try {
    // Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Only admins can delete client accounts.",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const { clientId } = await request.json();
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          message: "Client ID is required.",
        },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Fetch client to get email and userName for the deletion email
    const client = await UserModel.findOne({ _id: clientId, role: "user" });
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found.",
        },
        { status: 404 }
      );
    }

    // Delete associated data
    await ProjectModel.deleteMany({ clientId });
    await OrderModel.deleteMany({ clientId });
    await ProposalModel.deleteMany({ clientId });

    // Delete the client account
    await UserModel.deleteOne({ _id: clientId });

    // Send deletion email
    const emailResponse = await sendDeletionEmail({
      email: client.email,
      userName: client.userName,
      deletionReason: "Your client account has been removed by an admin.",
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send deletion email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client account and associated data deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete client.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}