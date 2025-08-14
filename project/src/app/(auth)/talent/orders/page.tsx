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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader, ArrowLeft, User, Package, File, Paperclip, Eye } from "lucide-react";
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
  projectDetails: {
    title: string;
    description: string;
  };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  createdAt: string;
  clientUserName?: string;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
}

export default function TalentOrdersPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const colors = {
    primaryColor: "#8DBCC7",
    secondaryColor: "#A4CCD9",
    accentColor: "#90D1CA",
    lightAccentColor: "#C4E1E6",
    darkTextColor: "#212121",
    grayTextColor: "#757575",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const ordersResponse = await axios.get("/api/talent/orders", {
            params: { status: statusFilter },
          });
          if (ordersResponse.data.success) {
            setOrders(ordersResponse.data.data);
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
  }, [status, session, router, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/talent/orders/${orderId}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: newStatus as Order["status"] } : order
          )
        );
        toast.success("Success", {
          description: `Order status updated to ${newStatus}.`,
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update order status.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to update order status.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const getAvailableStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case "pending":
        return ["in-progress", "rejected"];
      case "in-progress":
        return ["cancelled"];
      case "delivered":
        return ["cancelled"];
      default:
        return [];
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return { backgroundColor: colors.grayTextColor, color: "#FFFFFF" };
      case "in-progress":
        return { backgroundColor: colors.accentColor, color: colors.darkTextColor };
      case "delivered":
        return { backgroundColor: colors.primaryColor, color: colors.darkTextColor };
      case "rejected":
      case "cancelled":
        return { backgroundColor: "#EF4444", color: "#FFFFFF" };
      default:
        return { backgroundColor: colors.grayTextColor, color: "#FFFFFF" };
    }
  };

  const getRevisionStatusBadgeColor = (revisionStatus: string) => {
    switch (revisionStatus) {
      case "requested":
        return { backgroundColor: "#F59E0B", color: "#FFFFFF" };
      case "submitted":
        return { backgroundColor: colors.secondaryColor, color: colors.darkTextColor };
      default:
        return { backgroundColor: colors.grayTextColor, color: "#FFFFFF" };
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: colors.darkTextColor }}
        >
          Loading your orders...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as a talent to view your orders.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-[94rem] mx-auto"
      style={{
        backgroundImage: `url(${
          Images.talentProfileBackground
            ? Images.talentProfileBackground.src
            : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push("/talent/dashboard")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colors.secondaryColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = colors.accentColor)
          }
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: colors.darkTextColor }}
        >
          Your Received Orders
        </h1>

        <div className="mb-6 flex items-center gap-4">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium"
            style={{ color: colors.darkTextColor }}
          >
            Filter by Status:
          </label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger
              id="status-filter"
              className="w-[180px]"
              style={{
                borderColor: colors.primaryColor,
                color: colors.darkTextColor,
              }}
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <div
            className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border text-center"
            style={{ borderColor: colors.primaryColor }}
          >
            <p
              className="text-lg"
              style={{ color: colors.grayTextColor }}
            >
              No {statusFilter === "all" ? "" : statusFilter} orders found.
            </p>
          </div>
        ) : (
          <div
            className="bg-transparent rounded-lg shadow-md shadow-[#212121] border"
            style={{ borderColor: colors.primaryColor }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Client
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Rate Plan
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Project Title
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Status
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Revision Status
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Revision Details
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Created At
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {order.clientUserName || "Unknown"}
                    </TableCell>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {order.ratePlan.type}
                    </TableCell>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {order.projectDetails.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={getStatusBadgeColor(order.status)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.status === "in-progress"
                          ? "In Progress"
                          : order.status === "delivered"
                          ? "Delivered"
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={getRevisionStatusBadgeColor(order.revisionStatus)}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {order.revisionStatus.charAt(0).toUpperCase() + order.revisionStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {order.revisionStatus === "requested" && order.revisionRequest ? (
                        <Dialog
                          open={openDialogId === order._id}
                          onOpenChange={(open) => setOpenDialogId(open ? order._id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              style={{
                                borderColor: colors.accentColor,
                                color: colors.accentColor,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = colors.lightAccentColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "transparent")
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Revision Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Revision Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {order.revisionRequest.note && (
                                <div>
                                  <div className="flex items-center">
                                    <Paperclip className="h-4 w-4 mr-2" style={{ color: colors.accentColor }} />
                                    <span className="font-semibold" style={{ color: colors.darkTextColor }}>
                                      Revision Note:
                                    </span>
                                  </div>
                                  <p
                                    className="mt-1 p-2 border rounded-lg"
                                    style={{ borderColor: colors.primaryColor, color: colors.grayTextColor }}
                                  >
                                    {order.revisionRequest.note}
                                  </p>
                                </div>
                              )}
                              {order.revisionRequest.files && order.revisionRequest.files.length > 0 && (
                                <div>
                                  <div className="flex items-center">
                                    <File className="h-4 w-4 mr-2" style={{ color: colors.accentColor }} />
                                    <span className="font-semibold" style={{ color: colors.darkTextColor }}>
                                      Revision Files:
                                    </span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {order.revisionRequest.files.map((file, index) => (
                                      <a
                                        key={index}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center px-2 py-1 rounded-full text-sm font-medium"
                                        style={{
                                          backgroundColor: colors.accentColor,
                                          color: colors.darkTextColor,
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.backgroundColor = colors.lightAccentColor)
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.backgroundColor = colors.accentColor)
                                        }
                                      >
                                        File {index + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <p className="text-sm" style={{ color: colors.grayTextColor }}>
                                Requested on {new Date(order.revisionRequest.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {getAvailableStatuses(order.status).length > 0 && (
                        <Select
                          onValueChange={(value) => handleStatusChange(order._id, value)}
                        >
                          <SelectTrigger
                            className="w-[120px]"
                            style={{
                              borderColor: colors.primaryColor,
                              color: colors.darkTextColor,
                            }}
                          >
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableStatuses(order.status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status === "in-progress"
                                  ? "In Progress"
                                  : status === "delivered"
                                  ? "Delivered"
                                  : status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/talent/clients/${order.clientId}`)}
                        style={{
                          borderColor: colors.accentColor,
                          color: colors.accentColor,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = colors.lightAccentColor)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Client
                      </Button>
                      {(order.status === "in-progress" || order.revisionStatus === "requested") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/talent/orders/${order._id}/deliver`)}
                          style={{
                            borderColor: colors.accentColor,
                            color: colors.accentColor,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = colors.lightAccentColor)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                          }
                        >
                          <Package className="h-4 w-4 mr-2" />
                          {order.revisionStatus === "requested" ? "Submit Revision" : "Deliver Project"}
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