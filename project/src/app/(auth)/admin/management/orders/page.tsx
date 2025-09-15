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
import { Loader2 as Loader, ArrowLeft, Edit, Trash, Eye } from "lucide-react";
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
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
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

export default function AdminOrdersPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [revisionStatusFilter, setRevisionStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [searchQuery] = useState<string>("");

  // Consistent color theme
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";
  const errorColor = "#EF4444";
  const successColor = "#34D399";
  const warningColor = "#FBBF24";
  const infoColor = "#60A5FA";
  const deliveredColor = "#10B981"; // New color for delivered status
  const inProgressColor = "#3B82F6"; // New color for in-progress status

  useEffect(() => {
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (revisionStatusFilter !== "all") params.revisionStatus = revisionStatusFilter;
      if (timeRange !== "all") params.timeRange = timeRange;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get("/api/orders", { params });
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error("Error", {
          description: response.data.message || "Failed to fetch orders.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to fetch orders.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "authenticated" && session?.user?.role === "admin") {
    fetchOrders();
  } else if (status === "unauthenticated") {
    router.replace("/sign-in");
  }
}, [status, session, router, statusFilter, revisionStatusFilter, timeRange, searchQuery]);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await axios.delete("/api/admin/orders", {
        data: { orderId },
      });
      if (response.data.success) {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
        toast.success("Success", {
          description: "Order deleted successfully.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to delete order.");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete order.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
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
        return { backgroundColor: neutralTextColor, color: white };
      case "requested":
        return { backgroundColor: warningColor, color: primaryDarkGray };
      case "submitted":
        return { backgroundColor: successColor, color: white };
      default:
        return { backgroundColor: neutralTextColor, color: white };
    }
  };

  const getPaymentStatusBadgeColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "pending":
        return { backgroundColor: warningColor, color: primaryDarkGray };
      case "completed":
        return { backgroundColor: successColor, color: white };
      case "failed":
        return { backgroundColor: errorColor, color: white };
      case "cancelled":
        return { backgroundColor: neutralTextColor, color: white };
      default:
        return { backgroundColor: neutralTextColor, color: white };
    }
  };

  const filteredOrders = orders.filter((order) =>
    searchQuery
      ? order.projectDetails.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.projectDetails.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.revisionStatus.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-12 w-12 mr-4" style={{ color: accentColor }} />
        <p className="text-2xl font-semibold" style={{ color: activeTextColor }}>
          Loading orders...
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
          Access denied. Please sign in as an admin to view orders.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-15 max-w-7xl mx-auto shadow-xl rounded-lg overflow-hidden border border-gray-900 mt-17"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: activeTextColor }}
        >
          Manage Orders
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium"
              style={{ color: activeTextColor }}
            >
              Filter by Status:
            </label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger
                id="status-filter"
                className="w-[180px] border-2 focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
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
              style={{ color: activeTextColor }}
            >
              Filter by Revision Status:
            </label>
            <Select value={revisionStatusFilter} onValueChange={(value) => setRevisionStatusFilter(value)}>
              <SelectTrigger
                id="revision-status-filter"
                className="w-[180px] border-2 focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
              >
                <SelectValue placeholder="Select revision status" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="time-filter"
              className="text-sm font-medium"
              style={{ color: activeTextColor }}
            >
              Time Range:
            </label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
              <SelectTrigger
                id="time-filter"
                className="w-[180px] border-2 focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
              >
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
        </div>

        {filteredOrders.length === 0 ? (
          <div
            className="rounded-lg shadow-md border p-6 text-center"
            style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}
          >
            <p className="text-lg" style={{ color: neutralTextColor }}>
              No orders found.
            </p>
          </div>
        ) : (
          <div
            className="rounded-lg shadow-md border overflow-x-auto"
            style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}
          >
            <Table className="min-w-full divide-y divide-gray-700">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Talent</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project Title</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate Plan</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revision Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Updated At</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-800 divide-y divide-gray-700">
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 truncate">
                      {order._id}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.talentUserName || "Unknown"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.clientUserName || "Unknown"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Badge
                        style={getPaymentStatusBadgeColor(order.paymentStatus)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                      {order.projectDetails.title}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.ratePlan.type}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Badge
                        style={getStatusBadgeColor(order.status)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Badge
                        style={getRevisionStatusBadgeColor(order.revisionStatus)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.revisionStatus &&order.revisionStatus.charAt(0).toUpperCase() + order.revisionStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/management/orders/${order._id}`)}
                          className="flex items-center px-4 py-2 rounded-full transition-colors"
                          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/management/orders/${order._id}/edit`)}
                          className="flex items-center px-4 py-2 rounded-full transition-colors"
                          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteOrder(order._id)}
                          className="flex items-center px-4 py-2 rounded-full transition-colors"
                          style={{ backgroundColor: errorColor, color: white }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
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