"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader, ArrowRight, Clock } from "lucide-react";
import { Images } from "@/lib/images";

interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  price: number;
  description: string;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

interface RevisionRequest {
  files: string[];
  note?: string;
  requestedAt: string;
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
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled" | "completed";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  clientUserName?: string;
  revisionRequest?: RevisionRequest;
}

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  recentOrders: Order[];
}

export default function TalentDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socket, setSocket] = useState<Socket | null>(null);

  const colors = {
    primaryColor: "#8DBCC7",
    secondaryColor: "#A4CCD9",
    accentColor: "#90D1CA",
    lightAccentColor: "#C4E1E6",
    darkTextColor: "#212121",
    grayTextColor: "#757575",
  };

  // Initialize Socket.IO
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        withCredentials: true,
      });
      setSocket(socketIo);

      socketIo.on("connect", () => {
        console.log("Connected to Socket.IO server");
        socketIo.emit("getDashboardData", { timeRange: "30" });
      });

      socketIo.on("dashboardUpdate", (data: DashboardData) => {
        setDashboardData(data);
        setIsLoading(false);
      });

      socketIo.on("orderCreated", () => {
        socketIo.emit("getDashboardData", { timeRange: "30" });
      });

      socketIo.on("orderStatusUpdated", () => {
        socketIo.emit("getDashboardData", { timeRange: "30" });
      });

      socketIo.on("error", (error: { message: string }) => {
        toast.error("Error", {
          description: error.message,
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      });

      return () => {
        socketIo.disconnect();
      };
    }
  }, [status, session]);

  // Update current time for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/talent/dashboard", {
            credentials: "include",
          });
          const data = await response.json();
          if (data.success) {
            setDashboardData(data.data);
          } else {
            throw new Error(data.message || "Failed to fetch dashboard data");
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          toast.error("Error", {
            description: error instanceof Error ? error.message : "Failed to fetch dashboard data",
            className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router]);

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
      case "completed":
        return { backgroundColor: "#17B169", color: "#FFFFFF" };
      default:
        return { backgroundColor: colors.grayTextColor, color: "#FFFFFF" };
    }
  };

  const getRemainingTime = (order: Order): string => {
    if (order.status !== "in-progress") return "N/A";
    const updatedAt = new Date(order.updatedAt).getTime();
    const deliveryHours = order.ratePlan.deliveryDays * 24 * 60 * 60 * 1000;
    const deadline = updatedAt + deliveryHours;
    const now = currentTime;
    const remainingMs = deadline - now;
    if (remainingMs <= 0) {
      return "Overdue";
    }
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    return `Delivery in ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`;
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
          Loading your dashboard...
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
          Access denied. Please sign in as a talent to view your dashboard.
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
      <div className="relative z-10">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: colors.darkTextColor }}
        >
          Talent Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white rounded-lg shadow-md p-6 border transition-transform transform hover:scale-105"
            style={{ borderColor: colors.primaryColor }}
          >
            <h2 className="text-lg font-semibold" style={{ color: colors.darkTextColor }}>
              Total Orders
            </h2>
            <p className="text-3xl font-bold mt-2" style={{ color: colors.accentColor }}>
              {dashboardData?.totalOrders || 0}
            </p>
          </div>
          <div
            className="bg-white rounded-lg shadow-md p-6 border transition-transform transform hover:scale-105"
            style={{ borderColor: colors.primaryColor }}
          >
            <h2 className="text-lg font-semibold" style={{ color: colors.darkTextColor }}>
              Pending Orders
            </h2>
            <p className="text-3xl font-bold mt-2" style={{ color: colors.accentColor }}>
              {dashboardData?.pendingOrders || 0}
            </p>
          </div>
          <div
            className="bg-white rounded-lg shadow-md p-6 border transition-transform transform hover:scale-105"
            style={{ borderColor: colors.primaryColor }}
          >
            <h2 className="text-lg font-semibold" style={{ color: colors.darkTextColor }}>
              In Progress
            </h2>
            <p className="text-3xl font-bold mt-2" style={{ color: colors.accentColor }}>
              {dashboardData?.inProgressOrders || 0}
            </p>
          </div>
          <div
            className="bg-white rounded-lg shadow-md p-6 border transition-transform transform hover:scale-105"
            style={{ borderColor: colors.primaryColor }}
          >
            <h2 className="text-lg font-semibold" style={{ color: colors.darkTextColor }}>
              Completed Orders
            </h2>
            <p className="text-3xl font-bold mt-2" style={{ color: colors.accentColor }}>
              {dashboardData?.completedOrders || 0}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => router.push("/talent/orders")}
            className="font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.secondaryColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accentColor)
            }
          >
            View All Orders
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            onClick={() => router.push("/talent/clients")}
            className="font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.secondaryColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accentColor)
            }
          >
            Manage Clients
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Recent Orders */}
        <div
          className="bg-white rounded-lg shadow-md border p-6"
          style={{ borderColor: colors.primaryColor }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: colors.darkTextColor }}
          >
            Recent Orders
          </h2>
          {dashboardData?.recentOrders.length === 0 ? (
            <p
              className="text-lg"
              style={{ color: colors.grayTextColor }}
            >
              No recent orders found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Client
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Project Title
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Status
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Delivery Deadline
                  </TableHead>
                  <TableHead style={{ color: colors.darkTextColor }}>
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData?.recentOrders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/talent/orders/${order._id}`)}
                  >
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {order.clientUserName || "Unknown"}
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
                          : order.status === "completed"
                          ? "Completed"
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      style={{
                        color:
                          order.status === "in-progress" && getRemainingTime(order) === "Overdue"
                            ? "#EF4444"
                            : colors.grayTextColor,
                      }}
                    >
                      <div className="flex items-center">
                        {order.status === "in-progress" && (
                          <Clock
                            className="h-4 w-4 mr-2"
                            style={{
                              color:
                                getRemainingTime(order) === "Overdue"
                                  ? "#EF4444"
                                  : colors.accentColor,
                            }}
                          />
                        )}
                        {getRemainingTime(order)}
                      </div>
                    </TableCell>
                    <TableCell style={{ color: colors.grayTextColor }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}