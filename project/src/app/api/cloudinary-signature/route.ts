import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SignatureResponse {
  signature?: string;
  timestamp?: number;
  folder?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignatureResponse>> {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "skillconnect"; 
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({ signature, timestamp, folder }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}