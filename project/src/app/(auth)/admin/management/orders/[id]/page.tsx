"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 as Loader, ArrowLeft } from "lucide-react";
import { Images } from "@/lib/images";

interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  price: number;
  description: string;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: RatePlan;
  projectDetails: { title: string; description: string };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "completed" | "cancelled";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  talentUserName?: string;
  clientUserName?: string;
}

export default function OrderDetailsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consistent color theme
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const errorColor = "#EF4444";
  const successColor = "#34D399";
  const warningColor = "#FBBF24";
  const infoColor = "#60A5FA";
  const inProgressColor = "#EC4899"; // Pink for in-progress
  const deliveredColor = "#10B981"; // Emerald for delivered

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchOrder();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router, id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/orders/${id}`);
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        toast.error("Error", {
          description: response.data.message || "Failed to fetch order details.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error", {
        description: "An error occurred while fetching order details.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return { backgroundColor: warningColor, color: primaryDarkGray };
      case "in-progress":
        return { backgroundColor: inProgressColor, color: white };
      case "accepted":
        return { backgroundColor: successColor, color: white };
      case "delivered":
        return { backgroundColor: deliveredColor, color: white };
      case "completed":
        return { backgroundColor: infoColor, color: white };
      case "rejected":
      case "cancelled":
        return { backgroundColor: errorColor, color: white };
      default:
        return { backgroundColor: neutralTextColor, color: white };
    }
  };

  const getRevisionStatusBadgeColor = (revisionStatus: string) => {
    switch (revisionStatus) {
      case "none":
        return { backgroundColor: "#6B7280", color: white }; // Gray
      case "requested":
        return { backgroundColor: "#F59E0B", color: white }; // Amber
      case "submitted":
        return { backgroundColor: "#3B82F6", color: white }; // Blue
      default:
        return { backgroundColor: neutralTextColor, color: white };
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-12 w-12 mr-4" style={{ color: accentColor }} />
        <p className="text-2xl font-semibold" style={{ color: activeTextColor }}>
          Loading order details...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: errorColor }}>
          Access denied. Please sign in as an admin to view order details.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: errorColor }}>
          Order not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-8 px-4 sm:px-6 lg:px-15 max-w-7xl mx-auto mt-17"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push("/admin/management/orders")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </Button>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: activeTextColor }}
        >
          Order Details
        </h1>

        <div
          className="rounded-lg shadow-md border p-6"
          style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: activeTextColor }}>
                Order Information
              </h2>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Order ID:</strong> {order._id}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Status:</strong>{" "}
                <Badge
                  style={getStatusBadgeColor(order.status)}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Created At:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Updated At:</strong>{" "}
                {new Date(order.updatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: activeTextColor }}>
                Project Details
              </h2>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Title:</strong> {order.projectDetails.title}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Description:</strong> {order.projectDetails.description}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: activeTextColor }}>
                Rate Plan
              </h2>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Type:</strong> {order.ratePlan.type}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Price:</strong> ${order.ratePlan.price}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Description:</strong> {order.ratePlan.description}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Delivery Days:</strong> {order.ratePlan.deliveryDays}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Revisions Allowed:</strong> {order.ratePlan.revisions}
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>What’s Included:</strong>{" "}
                {order.ratePlan.whatsIncluded.join(", ")}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: activeTextColor }}>
                Associated Users
              </h2>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Talent:</strong> {order.talentUserName || "Unknown"} (ID: {order.talentId})
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Client:</strong> {order.clientUserName || "Unknown"} (ID: {order.clientId})
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: activeTextColor }}>
                Revision Information
              </h2>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Revision Status:</strong>{" "}
                <Badge
                  style={getRevisionStatusBadgeColor(order.revisionStatus || "none")}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                >
                  {(order.revisionStatus || "none").charAt(0).toUpperCase() + (order.revisionStatus || "none").slice(1)}
                </Badge>
              </p>
              <p className="mb-2" style={{ color: neutralTextColor }}>
                <strong>Revision Count:</strong> {order.revisionCount}
              </p>
              {order.revisionRequest && (
                <>
                  <p className="mb-2" style={{ color: neutralTextColor }}>
                    <strong>Revision Request Note:</strong>{" "}
                    {order.revisionRequest.note || "No note provided"}
                  </p>
                  <p className="mb-2" style={{ color: neutralTextColor }}>
                    <strong>Revision Requested At:</strong>{" "}
                    {new Date(order.revisionRequest.requestedAt).toLocaleString()}
                  </p>
                  <p className="mb-2" style={{ color: neutralTextColor }}>
                    <strong>Revision Request Files:</strong>{" "}
                    {order.revisionRequest.files.length > 0
                      ? order.revisionRequest.files.map((file, index) => (
                          <a
                            key={index}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline block"
                            style={{ color: infoColor }}
                          >
                            File {index + 1}
                          </a>
                        ))
                      : "No files uploaded"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}