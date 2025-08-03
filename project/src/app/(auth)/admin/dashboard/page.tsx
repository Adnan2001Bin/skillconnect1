"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { Loader2 as Loader, AlertCircle, Briefcase, FileText, AlertTriangle, Clock } from "lucide-react";
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

  // Define color scheme consistent with AdminTalentView
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
        setDashboardData(data);
        setLoading(false);
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
          accentColor,
          "#60A5FA", // Light blue for in progress
          "#34D399", // Green for completed
          "#EF4444", // Red for cancelled
        ],
        borderColor: [activeTextColor],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: activeTextColor,
        },
      },
      title: {
        display: true,
        text: "Projects by Status",
        color: activeTextColor,
      },
    },
    scales: {
      x: {
        ticks: { color: activeTextColor },
        grid: { color: neutralTextColor },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Projects",
          color: activeTextColor,
        },
        ticks: { color: activeTextColor },
        grid: { color: neutralTextColor },
      },
    },
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-10 w-10 mr-3" style={{ color: accentColor }} />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-8 mt-17 relative max-w-7xl mx-auto"
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

        <div className="mb-8 flex justify-end">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger
              className="w-48 text-base rounded-lg p-3 h-auto border-2 focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: white,
                borderColor: inputBorderColor,
                color: primaryDarkGray,
                boxShadow: `0 0 0 2px ${accentColor}`,
              }}
            >
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent
              className="bg-white text-primaryDarkGray rounded-lg shadow-lg border"
              style={{ borderColor: accentColor }}
            >
              {timeRangeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-[#A4CCD9]/30 cursor-pointer p-3"
                >
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
            <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <FileText className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Active Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.activeProposals}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <AlertTriangle className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.disputes}</p>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                    <AlertCircle className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    High-Priority Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: accentColor }}>{dashboardData.highPriorityIssues.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle style={{ color: activeTextColor }}>Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={chartData} options={chartOptions} />
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                  <Clock className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentActivity.length === 0 ? (
                  <p style={{ color: neutralTextColor }}>No recent activity.</p>
                ) : (
                  <ul className="space-y-4">
                    {dashboardData.recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold" style={{ color: activeTextColor }}>{activity.title}</p>
                          <p className="text-sm" style={{ color: neutralTextColor }}>
                            {activity.type} - {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/management/projects/${activity.id}`)}
                          className="px-4 py-1 rounded-full"
                          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ color: activeTextColor }}>
                  <AlertCircle className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                  High-Priority Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.highPriorityIssues.length === 0 ? (
                  <p style={{ color: neutralTextColor }}>No high-priority issues.</p>
                ) : (
                  <ul className="space-y-4">
                    {dashboardData.highPriorityIssues.map((issue) => (
                      <li key={issue.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold" style={{ color: activeTextColor }}>{issue.title}</p>
                          <p className="text-sm" style={{ color: neutralTextColor }}>{issue.issue}</p>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/management/projects/${issue.id}`)}
                          className="px-4 py-1 rounded-full"
                          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push("/admin/management/projects")}
                className="px-6 py-2 rounded-full font-semibold"
                style={{ backgroundColor: accentColor, color: primaryDarkGray }}
              >
                Manage Projects
              </Button>
              <Button
                onClick={() => router.push("/admin/management/proposals")}
                className="px-6 py-2 rounded-full font-semibold"
                style={{ backgroundColor: accentColor, color: primaryDarkGray }}
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