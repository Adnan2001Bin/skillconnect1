"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, User, Package } from "lucide-react";
import Loader from "@/components/Loader";
import { Images } from "@/lib/images";

interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  description: string;
  price: number;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: RatePlan;
  projectDetails: {
    title: string;
    description: string;
  };
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
}

export default function ClientOrdersPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [revisionStatusFilter, setRevisionStatusFilter] = useState<string>("all");

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#D3ECCD",
    white: "#FFFFFF",
    inputBorderColor: "#FFFFFF",
    errorRed: "#EF4444",
    successColor: "#34D399",
    warningColor: "#FBBF24",
    infoColor: "#60A5FA",
    deliveredColor: "#10B981",
    inProgressColor: "#3B82F6",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const ordersResponse = await axios.get("/api/orders", {
            params: { 
              clientId: session.user._id,
              status: statusFilter !== "all" ? statusFilter : undefined,
              revisionStatus: revisionStatusFilter !== "all" ? revisionStatusFilter : undefined,
            },
          });
          if (ordersResponse.data.success) {
            const fetchedOrders: Order[] = ordersResponse.data.data;
            setOrders(fetchedOrders);
          } else {
            toast.error("Error", {
              description:
                ordersResponse.data.message || "Failed to fetch orders.",
              className:
                "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
              duration: 4000,
            });
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast.error("Error", {
            description: "An error occurred while fetching your orders.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrders();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router, statusFilter, revisionStatusFilter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return { backgroundColor: colors.warningColor, color: colors.white };
      case "in-progress":
        return { backgroundColor: colors.inProgressColor, color: colors.white };
      case "accepted":
        return { backgroundColor: colors.successColor, color: colors.white };
      case "delivered":
        return { backgroundColor: colors.deliveredColor, color: colors.white };
      case "completed":
        return { backgroundColor: colors.infoColor, color: colors.white };
      case "rejected":
      case "cancelled":
        return { backgroundColor: colors.errorRed, color: colors.white };
      default:
        return { backgroundColor: colors.neutralTextColor, color: colors.white };
    }
  };

  const getRevisionStatusBadgeColor = (revisionStatus: string) => {
    switch (revisionStatus) {
      case "none":
        return { backgroundColor: colors.neutralTextColor, color: colors.white };
      case "requested":
        return { backgroundColor: colors.warningColor, color: colors.white };
      case "submitted":
        return { backgroundColor: colors.successColor, color: colors.white };
      default:
        return { backgroundColor: colors.neutralTextColor, color: colors.white };
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse bg-emerald-50">
        <Loader
          text="Loading your orders..."
          color="#000000"
          bgColor="#90D1CA"
          size="large"
        />
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "user") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <p className="text-xl font-bold" style={{ color: colors.errorRed }}>
          Access denied. Please sign in as a client to view your orders.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-[94rem] mx-auto"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        
      }}
    >
      <div className="relative z-10 mb-8 mt-20 p-5 rounded-2xl" style={{ backgroundColor: "rgba(163,209,198, 0.2)" }}>
        <Button
          onClick={() => router.push("/user/talents")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: colors.accentColor, color: colors.white }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = colors.accentColor)
          }
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Talents
        </Button>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: colors.activeTextColor }}
        >
          Your Orders
        </h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium"
              style={{ color: colors.neutralTextColor }}
            >
              Filter by Status:
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                id="status-filter"
                className="w-[180px]"
                style={{
                  borderColor: colors.inputBorderColor, 
                  color: colors.neutralTextColor, 
                }}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: colors.white, color: colors.accentColor /* Changed text color for dropdown */ }}>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="revision-status-filter"
              className="text-sm font-medium"
              style={{ color: colors.neutralTextColor /* Changed for better contrast */ }}
            >
              Filter by Revision Status:
            </label>
            <Select value={revisionStatusFilter} onValueChange={setRevisionStatusFilter}>
              <SelectTrigger
                id="revision-status-filter"
                className="w-[180px]"
                style={{
                  borderColor: colors.inputBorderColor,
                  color: colors.neutralTextColor, 
                }}
              >
                <SelectValue placeholder="Select revision status" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: colors.white, color: colors.accentColor /* Changed text color for dropdown */ }}>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div
            className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border text-center"
            style={{ borderColor: colors.inputBorderColor }}
          >
            <p className="text-lg" style={{ color: colors.neutralTextColor }}>
              No {statusFilter === "all" && revisionStatusFilter === "all" ? "" : "matching"} orders found.
            </p>
          </div>
        ) : (
          <div
            className="bg-transparent rounded-lg shadow-md shadow-[#16423C] border"
            style={{ borderColor: colors.inputBorderColor }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Talent
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Rate Plan
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Project Title
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Status
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Revision Status
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Created At
                  </TableHead>
                  <TableHead style={{ color: colors.activeTextColor }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell style={{ color: colors.neutralTextColor }}>
                      {order.talentUserName || "Unknown"}
                    </TableCell>
                    <TableCell style={{ color: colors.neutralTextColor }}>
                      {order.ratePlan.type}
                    </TableCell>
                    <TableCell style={{ color: colors.neutralTextColor }}>
                      {order.projectDetails.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={getStatusBadgeColor(order.status)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={getRevisionStatusBadgeColor(order.revisionStatus)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.revisionStatus.charAt(0).toUpperCase() +
                          order.revisionStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: colors.neutralTextColor }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/talentList/${order.talentId}`)
                        }
                        style={{
                          borderColor: colors.accentColor,
                          color: colors.accentColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary;
                          e.currentTarget.style.color = colors.white; // Ensure text is readable on hover
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = colors.accentColor;
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Talent
                      </Button>
                      {order.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/orders/${order._id}/deliverables`)
                          }
                          style={{
                            borderColor: colors.accentColor,
                            color: colors.accentColor,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.primary;
                            e.currentTarget.style.color = colors.white; // Ensure text is readable on hover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = colors.accentColor;
                          }}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          View Deliverables
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}