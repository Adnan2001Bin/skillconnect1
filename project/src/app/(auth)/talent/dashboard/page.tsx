"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Briefcase, CalendarDays, DollarSign, FileText, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { io } from "socket.io-client";
import Image from "next/image";
import { Images } from "@/lib/images";

interface Order {
  _id: string;
  clientId: string;
  clientUserName: string;
  ratePlan: {
    type: string;
    price: number;
    description: string;
    whatsIncluded: string[];
    deliveryDays: number;
    revisions: number;
  };
  projectDetails: {
    title: string;
    description: string;
  };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled" | "completed";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
}

interface Project {
  _id: string;
  title: string;
  description: string;
  budget: number;
  timeline: number;
  category: string;
  status: "open" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
}

interface Proposal {
  _id: string;
  projectId: string;
  projectTitle: string;
  talentId: string;
  bid: number;
  proposalStatus: "pending" | "accepted" | "rejected" | "delivered" | "revision-requested";
  createdAt: string;
  updatedAt: string;
  deliverables?: {
    files: string[];
    note?: string;
    submittedAt: string;
  };
}

interface Transaction {
  _id: string;
  orderId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
}

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  recentOrders: Order[];
  totalProjects: number;
  openProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  recentProjects: Project[];
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  deliveredProposals: number;
  recentProposals: Proposal[];
  totalEarnings: number;
  pendingPayments: number;
  recentTransactions: Transaction[];
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
    case "pending":
      return "bg-[#FBBF24] text-white";
    case "in-progress":
    case "accepted":
      return "bg-[#3B82F6] text-white";
    case "completed":
    case "delivered":
      return "bg-[#34D399] text-white";
    case "cancelled":
    case "rejected":
      return "bg-[#EF4444] text-white";
    case "revision-requested":
      return "bg-[#F59E0B] text-white";
    default:
      return "bg-[#757575] text-white";
  }
};

export default function TalentDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    accentColor: "#8DBCC7",
    activeTextColor: "#212121",
    neutralTextColor: "#757575",
    primary: "#90D1CA",
    buttonHover: "hover:bg-[#90D1CA]",
    containerBg: "bg-white bg-opacity-90 backdrop-blur-sm",
    headerBg: "#212121",
    iconColor: "#8DBCC7",
    border: "#90D1CA30",
  };

  // Initialize Socket.IO
  useEffect(() => {
    if (!session?.user?._id || session?.user?.role !== "talent") return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session.user._id);
    });

    socket.on("orderCreated", () => {
      fetchDashboardData();
      toast.info("New Order", {
        description: "A new order has been created.",
        className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("orderStatusUpdated", () => {
      fetchDashboardData();
      toast.info("Order Status Updated", {
        description: "An order status has been updated.",
        className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("projectStatusUpdated", (data: { projectId: string; status: string }) => {
      fetchDashboardData();
      toast.info("Project Status Updated", {
        description: `Project status changed to ${data.status}.`,
        className: `bg-${data.status === "completed" ? "green" : "red"}-600 text-white border-${data.status === "completed" ? "green" : "red"}-700 bg-opacity-80`,
        duration: 4000,
      });
    });

    socket.on("proposalDeliverablesSubmitted", (data: { proposalId: string; projectId: string; message: string }) => {
      fetchDashboardData();
      toast.info("Deliverables Submitted", {
        description: data.message,
        className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("proposalAccepted", (data: { proposalId: string; projectId: string; message: string }) => {
      fetchDashboardData();
      toast.success("Proposal Accepted", {
        description: data.message,
        className: "bg-green-600 text-white border-green-700 bg-opacity-80",
        duration: 4000,
        action: {
          label: "View Project",
          onClick: () => router.push(`/talent/projects/${data.projectId}`),
        },
      });
    });

    socket.on("proposalRejected", (data: { proposalId: string; projectId: string; message: string }) => {
      fetchDashboardData();
      toast.error("Proposal Rejected", {
        description: data.message,
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
        action: {
          label: "View Project",
          onClick: () => router.push(`/talent/projects/${data.projectId}`),
        },
      });
    });

    socket.on("paymentStatusUpdated", () => {
      fetchDashboardData();
      toast.info("Payment Status Updated", {
        description: "A payment status has been updated.",
        className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id, session?.user?.role, router]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [orderResponse, projectResponse, proposalResponse, paymentResponse] = await Promise.all([
        axios.get("/api/talent/dashboard"),
        axios.get("/api/talent/projects"),
        axios.get("/api/proposals", { params: { talentId: session?.user?._id } }),
        axios.get("/api/talent/payments"),
      ]);

      if (!orderResponse.data.success || !projectResponse.data.success || !proposalResponse.data.success || !paymentResponse.data.success) {
        throw new Error("Failed to fetch dashboard data");
      }

      const orderData = orderResponse.data.data;
      const projectData = projectResponse.data.data;
      const proposalData = proposalResponse.data.data;
      const paymentData = paymentResponse.data.data;

      const acceptedProposalIds = proposalData
        .filter((p: Proposal) => ["accepted", "delivered", "revision-requested"].includes(p.proposalStatus))
        .map((p: Proposal) => p.projectId);

      const relevantProjects = projectData.filter((p: Project) => acceptedProposalIds.includes(p._id));

      const totalEarnings = paymentData
        .filter((t: Transaction) => t.status === "completed")
        .reduce((sum: any, t: { amount: any; }) => sum + t.amount, 0);
      const pendingPayments = paymentData
        .filter((t: Transaction) => t.status === "pending")
        .reduce((sum: any, t: { amount: any; }) => sum + t.amount, 0);

      setDashboardData({
        totalOrders: orderData.totalOrders,
        pendingOrders: orderData.pendingOrders,
        inProgressOrders: orderData.inProgressOrders,
        completedOrders: orderData.completedOrders,
        recentOrders: orderData.recentOrders,
        totalProjects: relevantProjects.length,
        openProjects: relevantProjects.filter((p: Project) => p.status === "open").length,
        inProgressProjects: relevantProjects.filter((p: Project) => p.status === "in-progress").length,
        completedProjects: relevantProjects.filter((p: Project) => p.status === "completed").length,
        recentProjects: relevantProjects.slice(0, 5),
        totalProposals: proposalData.length,
        pendingProposals: proposalData.filter((p: Proposal) => p.proposalStatus === "pending").length,
        acceptedProposals: proposalData.filter((p: Proposal) => p.proposalStatus === "accepted").length,
        deliveredProposals: proposalData.filter((p: Proposal) => p.proposalStatus === "delivered").length,
        recentProposals: proposalData.slice(0, 5),
        totalEarnings,
        pendingPayments,
        recentTransactions: paymentData.slice(0, 5),
      });
    } catch (err) {
      setError("Failed to load dashboard data. Please try again later.");
      console.error("Error fetching dashboard data:", err);
      toast.error("Error", {
        description: "Failed to load dashboard data. Please try again.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      fetchDashboardData();
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <Loader text="Loading dashboard..." color="#000000" bgColor="#90D1CA" size="large" />
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
        <p className="text-red-600 text-base sm:text-lg font-semibold text-center">
          Unauthorized. Only talents can access this dashboard.
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
        <p className="text-red-600 text-base sm:text-lg font-semibold text-center">
          {error || "Failed to load dashboard data."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 font-sans relative mt-15"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto" style={{ backgroundColor: colors.containerBg }}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#212121] mb-6 sm:mb-8 text-center sm:text-left">
          Talent Dashboard
        </h1>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Order Stats */}
          <div className="p-4 sm:p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.headerBg }}>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Orders</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#90D1CA]">Total Orders</p>
                <p className="text-2xl font-bold text-white">{dashboardData.totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Pending</p>
                <p className="text-2xl font-bold text-white">{dashboardData.pendingOrders}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">In Progress</p>
                <p className="text-2xl font-bold text-white">{dashboardData.inProgressOrders}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Completed</p>
                <p className="text-2xl font-bold text-white">{dashboardData.completedOrders}</p>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="p-4 sm:p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.headerBg }}>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Projects</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#90D1CA]">Total Projects</p>
                <p className="text-2xl font-bold text-white">{dashboardData.totalProjects}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Open</p>
                <p className="text-2xl font-bold text-white">{dashboardData.openProjects}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">In Progress</p>
                <p className="text-2xl font-bold text-white">{dashboardData.inProgressProjects}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Completed</p>
                <p className="text-2xl font-bold text-white">{dashboardData.completedProjects}</p>
              </div>
            </div>
          </div>

          {/* Proposal Stats */}
          <div className="p-4 sm:p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.headerBg }}>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Proposals</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#90D1CA]">Total Proposals</p>
                <p className="text-2xl font-bold text-white">{dashboardData.totalProposals}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Pending</p>
                <p className="text-2xl font-bold text-white">{dashboardData.pendingProposals}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Accepted</p>
                <p className="text-2xl font-bold text-white">{dashboardData.acceptedProposals}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Delivered</p>
                <p className="text-2xl font-bold text-white">{dashboardData.deliveredProposals}</p>
              </div>
            </div>
          </div>

          {/* Payment Stats */}
          <div className="p-4 sm:p-6 rounded-lg shadow-md" style={{ backgroundColor: colors.headerBg }}>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Payments</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#90D1CA]">Total Earnings</p>
                <p className="text-2xl font-bold text-white">${dashboardData.totalEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-[#90D1CA]">Pending Payments</p>
                <p className="text-2xl font-bold text-white">${dashboardData.pendingPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: colors.activeTextColor }}>
            Recent Orders
          </h2>
          {dashboardData.recentOrders.length === 0 ? (
            <p className="text-[#757575] text-base sm:text-lg text-center">
              No recent orders available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc]">
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Order Title
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Client
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Price
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Created
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {order.projectDetails.title}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {order.clientUserName}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        ${order.ratePlan.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => router.push(`/orders/${order._id}/deliverables`)}
                          className={`text-sm ${colors.buttonHover}`}
                          style={{ backgroundColor: colors.accentColor, color: "#FFFFFF" }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Recent Projects Table */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: colors.activeTextColor }}>
            Recent Projects
          </h2>
          {dashboardData.recentProjects.length === 0 ? (
            <p className="text-[#757575] text-base sm:text-lg text-center">
              No recent projects available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc]">
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Project Title
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Budget
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Created
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {project.title}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        ${project.budget.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => router.push(`/talent/projects/${project._id}`)}
                          className={`text-sm ${colors.buttonHover}`}
                          style={{ backgroundColor: colors.accentColor, color: "#FFFFFF" }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Recent Proposals Table */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: colors.activeTextColor }}>
            Recent Proposals
          </h2>
          {dashboardData.recentProposals.length === 0 ? (
            <p className="text-[#757575] text-base sm:text-lg text-center">
              No recent proposals available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc]">
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Project Title
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Bid
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Created
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentProposals.map((proposal) => (
                    <TableRow key={proposal._id}>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {proposal.projectTitle}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        ${proposal.bid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        <Badge className={getStatusBadgeColor(proposal.proposalStatus)}>
                          {proposal.proposalStatus.charAt(0).toUpperCase() + proposal.proposalStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => router.push(`/talent/projects/${proposal.projectId}`)}
                          className={`text-sm ${colors.buttonHover}`}
                          style={{ backgroundColor: colors.accentColor, color: "#FFFFFF" }}
                        >
                          View Project
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: colors.activeTextColor }}>
            Recent Transactions
          </h2>
          {dashboardData.recentTransactions.length === 0 ? (
            <p className="text-[#757575] text-base sm:text-lg text-center">
              No recent transactions available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc]">
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Order ID
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Client
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Amount
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-semibold" style={{ color: colors.activeTextColor }}>
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {transaction.orderId}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {transaction.clientName}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        ${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        <Badge className={getStatusBadgeColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: colors.neutralTextColor }}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => router.push("/talent/projects")}
            className={`px-6 py-2 rounded-full font-semibold text-white text-sm sm:text-base ${colors.buttonHover}`}
            style={{ backgroundColor: colors.accentColor }}
          >
            View All Projects
          </Button>
        </div>
      </div>
    </div>
  );
}