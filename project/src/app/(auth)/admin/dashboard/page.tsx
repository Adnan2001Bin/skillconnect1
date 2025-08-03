
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { Loader2, AlertCircle, Briefcase, FileText, AlertTriangle, Clock } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Images } from "@/lib/images";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardData {
  totalProjects: number;
  projectsByStatus: { open: number; inProgress: number; completed: number; cancelled: number };
  activeProposals: number;
  disputes: number;
  recentActivity: { id: string; title: string; type: string; timestamp: string }[];
  highPriorityIssues: { id: string; title: string; issue: string }[];
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

  const colors = {
    accentColor: "#17B169",
    activeTextColor: "#16423C",
    neutralTextColor: "#6A9C89",
    primary: "#D3F1DF",
    buttonHover: "hover:bg-[#2E7D32]",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      // Initialize Socket.IO connection
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      // Handle connection errors
      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to real-time updates.");
        toast.error("Connection Error", {
          description: "Failed to connect to real-time updates. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      // Listen for dashboard data updates
      socketInstance.on("dashboardUpdate", (data: DashboardData) => {
        setDashboardData(data);
        setLoading(false);
      });

      // Request initial dashboard data
      socketInstance.emit("getDashboardData", { timeRange });

      // Cleanup on unmount
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

  const chartData = {
    labels: ["Open", "In Progress", "Completed", "Cancelled"],
    datasets: [
      {
        label: "Projects by Status",
        data: dashboardData
          ? [
              dashboardData.projectsByStatus.open,
              dashboardData.projectsByStatus.inProgress,
              dashboardData.projectsByStatus.completed,
              dashboardData.projectsByStatus.cancelled,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          colors.accentColor,
          "#0288D1",
          "#2E7D32",
          "#F44336",
        ],
        borderColor: [colors.activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Projects by Status" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Projects" },
      },
    },
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">Loading dashboard...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F6F5] py-12 px-4 sm:px-6 lg:px-8 font-sans mt-17"
      style={{
        backgroundImage: `url(${Images.userViewbackground ? Images.userViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#16423C] mb-8 text-center">
          Admin Dashboard
        </h1>

        <div className="mb-8 flex justify-end">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-48 bg-white border-[#17B169]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="flex items-center text-red-600 mb-6">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {loading || !dashboardData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-10 w-10 text-[#17B169]" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-[#16423C] flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-[#17B169]" />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#17B169]">{dashboardData.totalProjects}</p>
                </CardContent>
              </Card>
              <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-[#16423C] flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-[#17B169]" />
                    Active Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#17B169]">{dashboardData.activeProposals}</p>
                </CardContent>
              </Card>
              <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-[#16423C] flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-[#17B169]" />
                    Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#17B169]">{dashboardData.disputes}</p>
                </CardContent>
              </Card>
              <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-[#16423C] flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-[#17B169]" />
                    High-Priority Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#17B169]">{dashboardData.highPriorityIssues.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Projects by Status Chart */}
            <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#16423C]">Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={chartData} options={chartOptions} />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#16423C] flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-[#17B169]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentActivity.length === 0 ? (
                  <p className="text-[#6A9C89]">No recent activity.</p>
                ) : (
                  <ul className="space-y-4">
                    {dashboardData.recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-[#16423C] font-semibold">{activity.title}</p>
                          <p className="text-[#6A9C89] text-sm">
                            {activity.type} - {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/management/projects/${activity.id}`)}
                          className={`px-4 py-1 rounded-full ${colors.buttonHover}`}
                          style={{ backgroundColor: colors.accentColor, color: colors.primary }}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* High-Priority Issues */}
            <Card className="bg-white bg-opacity-90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#16423C] flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-[#17B169]" />
                  High-Priority Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.highPriorityIssues.length === 0 ? (
                  <p className="text-[#6A9C89]">No high-priority issues.</p>
                ) : (
                  <ul className="space-y-4">
                    {dashboardData.highPriorityIssues.map((issue) => (
                      <li key={issue.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-[#16423C] font-semibold">{issue.title}</p>
                          <p className="text-[#6A9C89] text-sm">{issue.issue}</p>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/management/projects/${issue.id}`)}
                          className={`px-4 py-1 rounded-full ${colors.buttonHover}`}
                          style={{ backgroundColor: colors.accentColor, color: colors.primary }}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push("/admin/management/projects")}
                className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                style={{ backgroundColor: colors.accentColor, color: colors.primary }}
              >
                Manage Projects
              </Button>
              <Button
                onClick={() => router.push("/admin/management/projects")}
                className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                style={{ backgroundColor: colors.accentColor, color: colors.primary }}
              >
                Manage Proposals
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
