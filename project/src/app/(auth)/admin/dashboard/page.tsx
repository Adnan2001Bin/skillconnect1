"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { Loader2 as Loader, Package, Clock, Briefcase, DollarSign } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Images } from "@/lib/images";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  clientUserName: string;
  talentUserName: string;
  ratePlan: {
    type: "Basic" | "Standard" | "Premium";
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
  status: string;
  revisionStatus: string;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  revisionRequest?: {
    files: string[];
    note?: string;
    requestedAt: string;
  };
}

interface DashboardData {
  totalOrders: number;
  ordersByStatus: {
    pending: number;
    inProgress: number;
    accepted: number;
    rejected: number;
    delivered: number;
    completed: number;
    cancelled: number;
  };
  revisionStatusCounts: {
    none: number;
    requested: number;
    submitted: number;
  };
  totalProjects: number;
  projectsByStatus: {
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  projectsByCategory: { [key: string]: number };
  totalRevenue: number;
  totalTransactions: number;
  transactionsByStatus: {
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  recentTransactions: {
    _id: string;
    orderId: string;
    clientId: string;
    clientUserName: string;
    talentId: string;
    talentUserName: string;
    amount: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  }[];
  recentOrders: {
    _id: string;
    talentId: string;
    clientId: string;
    clientUserName: string;
    talentUserName: string;
    paymentStatus:string
    ratePlan: {
      type: "Basic" | "Standard" | "Premium";
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
    status: string;
    revisionStatus: string;
    revisionCount: number;
    createdAt: string;
    updatedAt: string;
    revisionRequest?: {
      files: string[];
      note?: string;
      requestedAt: string;
    };
  }[];
  recentProjects: {
    _id: string;
    clientId: string;
    clientUserName: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

const timeRangeOptions = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

export default function AdminDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [socket, setSocket] = useState<Socket | null>(null);

  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to real-time updates.");
        toast.error("Connection Error", {
          description: "Failed to connect to real-time updates. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      socketInstance.on("dashboardUpdate", (data: DashboardData) => {
        console.log("Received dashboardUpdate:", JSON.stringify(data, null, 2));
        setDashboardData(data);
        setLoading(false);
      });

      socketInstance.on("paymentTransactionUpdated", () => {
        console.log("Payment transaction updated, fetching new data...");
        if (socket) {
          socket.emit("getDashboardData", { timeRange });
        }
      });

      socketInstance.emit("getDashboardData", { timeRange });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session, timeRange]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setLoading(true);
    if (socket) {
      socket.emit("getDashboardData", { timeRange: value });
    }
  };

  const exportData = () => {
    if (!dashboardData) return;

    const headers = [
      "Type,Client,Talent/Title,Rate Plan/Category,Status,Payment Status,Revision Status,Created At",
    ];
    const orderRows = dashboardData.recentOrders.map((order) => [
      "Order",
      order.clientUserName || "Unknown",
      order.talentUserName || "Unknown",
      order.ratePlan.type,
      order.status,
      order.paymentStatus || "pending",
      order.revisionStatus,
      new Date(order.createdAt).toLocaleDateString(),
    ].join(","));
    const transactionRows = dashboardData.recentTransactions.map((transaction) => [
      "Transaction",
      transaction.clientUserName || "Unknown",
      transaction.talentUserName || "Unknown",
      `$${transaction.amount.toFixed(2)}`,
      transaction.paymentStatus,
      "",
      "",
      new Date(transaction.createdAt).toLocaleDateString(),
    ].join(","));
    const projectRows = dashboardData.recentProjects.map((project) => [
      "Project",
      project.clientUserName || "Unknown",
      project.title,
      project.category,
      project.status,
      "",
      "",
      new Date(project.createdAt).toLocaleDateString(),
    ].join(","));
    const csvContent = [
      ...headers,
      ...orderRows,
      ...transactionRows,
      ...projectRows,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-data-${timeRange}-days.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Data Exported", {
      description: "Dashboard data has been exported as CSV.",
      className: "bg-green-600 text-white border-green-700 bg-opacity-80",
      duration: 3000,
    });
  };

  const chartData = {
    labels: ["Pending", "In Progress", "Accepted", "Rejected", "Delivered", "Completed", "Cancelled"],
    datasets: [
      {
        label: "Orders by Status",
        data: dashboardData?.ordersByStatus
          ? [
              dashboardData.ordersByStatus.pending,
              dashboardData.ordersByStatus.inProgress,
              dashboardData.ordersByStatus.accepted,
              dashboardData.ordersByStatus.rejected,
              dashboardData.ordersByStatus.delivered,
              dashboardData.ordersByStatus.completed,
              dashboardData.ordersByStatus.cancelled,
            ]
          : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          accentColor,
          "#EC4899",
          "#60A5FA",
          "#FBBF24",
          "#10B981",
          "#34D399",
          "#EF4444",
        ],
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
      {
        label: "Revision Status",
        data: dashboardData?.revisionStatusCounts
          ? [
              dashboardData.revisionStatusCounts.none,
              dashboardData.revisionStatusCounts.requested,
              dashboardData.revisionStatusCounts.submitted,
              0, 0, 0, 0,
            ]
          : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          "#6B7280",
          "#F59E0B",
          "#3B82F6",
        ],
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const projectChartData = {
    labels: ["Open", "In Progress", "Completed", "Cancelled"],
    datasets: [
      {
        label: "Projects by Status",
        data: dashboardData?.projectsByStatus
          ? [
              dashboardData.projectsByStatus.open || 0,
              dashboardData.projectsByStatus.inProgress || 0,
              dashboardData.projectsByStatus.completed || 0,
              dashboardData.projectsByStatus.cancelled || 0,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          "#34D399",
          "#3B82F6",
          "#6EE7B7",
          "#EF4444",
        ],
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: dashboardData?.projectsByCategory ? Object.keys(dashboardData.projectsByCategory) : [],
    datasets: [
      {
        label: "Projects by Category",
        data: dashboardData?.projectsByCategory
          ? Object.values(dashboardData.projectsByCategory)
          : [],
        backgroundColor: [
          "#34D399",
          "#3B82F6",
          "#FBBF24",
          "#EC4899",
          "#10B981",
          "#6EE7B7",
          "#EF4444",
        ].slice(0, dashboardData?.projectsByCategory ? Object.keys(dashboardData.projectsByCategory).length : 0),
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const transactionChartData = {
    labels: ["Pending", "Completed", "Failed", "Cancelled"],
    datasets: [
      {
        label: "Transactions by Status",
        data: dashboardData?.transactionsByStatus
          ? [
              dashboardData.transactionsByStatus.pending,
              dashboardData.transactionsByStatus.completed,
              dashboardData.transactionsByStatus.failed,
              dashboardData.transactionsByStatus.cancelled,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          "#FBBF24", // Pending (Yellow)
          "#34D399", // Completed (Green)
          "#EF4444", // Failed (Red)
          "#6B7280", // Cancelled (Gray)
        ],
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const, labels: { color: activeTextColor } },
      title: { display: true, text: "Orders and Revision Status", color: activeTextColor },
    },
    scales: {
      x: { ticks: { color: activeTextColor }, grid: { color: neutralTextColor } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Orders", color: activeTextColor },
        ticks: { color: activeTextColor },
        grid: { color: neutralTextColor },
      },
    },
  };

  const projectChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const, labels: { color: activeTextColor } },
      title: { display: true, text: "Projects by Status", color: activeTextColor },
    },
    scales: {
      x: { ticks: { color: activeTextColor }, grid: { color: neutralTextColor } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Projects", color: activeTextColor },
        ticks: { color: activeTextColor },
        grid: { color: neutralTextColor },
      },
    },
  };

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const, labels: { color: activeTextColor } },
      title: { display: true, text: "Projects by Category", color: activeTextColor },
    },
  };

  const transactionChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const, labels: { color: activeTextColor } },
      title: { display: true, text: "Transactions by Status", color: activeTextColor },
    },
    scales: {
      x: { ticks: { color: activeTextColor }, grid: { color: neutralTextColor } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Transactions", color: activeTextColor },
        ticks: { color: activeTextColor },
        grid: { color: neutralTextColor },
      },
    },
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <Loader className="animate-spin h-10 w-10 mr-3" style={{ color: accentColor }} />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>Loading dashboard...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>Access denied. Please sign in as an admin.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-13 mt-17 relative max-w-7xl mx-auto"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center" style={{ color: activeTextColor }}>
          <span style={{ color: accentColor }}>Admin</span> Dashboard
        </h1>

        <div className="mb-8 flex justify-end gap-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger
              className="w-48 text-base rounded-lg p-3 h-auto border-2 focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
            >
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="bg-white text-primaryDarkGray rounded-lg shadow-lg border" style={{ borderColor: accentColor }}>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="hover:bg-[#A4CCD9]/30 cursor-pointer p-3">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={exportData}
            className="px-6 py-2 rounded-full font-semibold"
            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
            disabled={!dashboardData}
          >
            Export Data
          </Button>
        </div>

        {error && (
          <div className="flex items-center text-red-600 mb-6">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {loading || !dashboardData ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <Package className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.totalOrders}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <Briefcase className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.totalProjects}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <DollarSign className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Total Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.totalTransactions}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <DollarSign className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>${dashboardData.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle style={{ color: activeTextColor }}>Orders and Revision Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle style={{ color: activeTextColor }}>Projects by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={projectChartData} options={projectChartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle style={{ color: activeTextColor }}>Projects by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.projectsByCategory && Object.keys(dashboardData.projectsByCategory).length > 0 ? (
                  <div className="h-80">
                    <Pie data={categoryChartData} options={categoryChartOptions} />
                  </div>
                ) : (
                  <p style={{ color: neutralTextColor }}>No category data available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle style={{ color: activeTextColor }}>Transactions by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={transactionChartData} options={transactionChartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                  <Clock className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentOrders?.length === 0 ? (
                  <p style={{ color: neutralTextColor }}>No recent orders found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: activeTextColor }}>Client</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Talent</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Project Title</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Rate Plan</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Status</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Payment Status</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Revision Status</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Created At</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recentOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell style={{ color: neutralTextColor }}>{order.clientUserName || "Unknown"}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{order.talentUserName || "Unknown"}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{order.projectDetails.title}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{order.ratePlan.type}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>
                            {(order.status || 'N/A').charAt(0).toUpperCase() + (order.status || 'N/A').slice(1)}
                          </TableCell>
                          <TableCell style={{ color: neutralTextColor }}>
                            {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                          </TableCell>
                          <TableCell style={{ color: neutralTextColor }}>
                            {(order.revisionStatus || 'none').charAt(0).toUpperCase() + (order.revisionStatus || 'none').slice(1)}
                          </TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => router.push(`/admin/management/orders/${order._id}`)}
                              className="px-4 py-1 rounded-full"
                              style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                  <Clock className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentTransactions?.length === 0 ? (
                  <p style={{ color: neutralTextColor }}>No recent transactions found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: activeTextColor }}>Client</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Talent</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Order ID</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Amount</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Payment Status</TableHead>
                        <TableHead style={{ color: activeTextColor }}>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recentTransactions && dashboardData.recentTransactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell style={{ color: neutralTextColor }}>{transaction.clientUserName || "Unknown"}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{transaction.talentUserName || "Unknown"}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{transaction.orderId}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell style={{ color: neutralTextColor }}>
                            {(transaction.paymentStatus || 'N/A').charAt(0).toUpperCase() + (transaction.paymentStatus || 'N/A').slice(1)}
                          </TableCell>
                          <TableCell style={{ color: neutralTextColor }}>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push("/admin/management/orders")}
                className="px-6 py-2 rounded-full font-semibold"
                style={{ backgroundColor: accentColor, color: primaryDarkGray }}
              >
                Manage Orders
              </Button>
              <Button
                onClick={() => router.push("/admin/management/projects")}
                className="px-6 py-2 rounded-full font-semibold"
                style={{ backgroundColor: accentColor, color: primaryDarkGray }}
              >
                Manage Projects
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}