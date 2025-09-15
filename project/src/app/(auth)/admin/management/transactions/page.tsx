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
import { Loader2 as Loader, ArrowLeft } from "lucide-react";
import { Images } from "@/lib/images";

interface Transaction {
  _id: string;
  orderId: string;
  clientId: string;
  talentId: string;
  clientUserName?: string;
  talentUserName?: string;
  amount: number;
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  relatedTo: "order" | "project";
}

export default function AdminTransactionsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<{
    orderTransactions: Transaction[];
    projectTransactions: Transaction[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [searchQuery] = useState<string>("");

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

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Fix: Replace 'any' with proper type
        const params: Record<string, string> = {};
        if (statusFilter !== "all") params.paymentStatus = statusFilter;
        if (timeRange !== "all") params.timeRange = timeRange;
        if (searchQuery) params.search = searchQuery;

        const response = await axios.get("/api/admin/transactions", { params });
        if (response.data.success) {
          setTransactions(response.data.data);
        } else {
          toast.error("Error", {
            description:
              response.data.message || "Failed to fetch transactions.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch transactions.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchTransactions();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router, statusFilter, timeRange, searchQuery]);

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

  const filteredOrderTransactions =
    transactions?.orderTransactions.filter((transaction) =>
      searchQuery
        ? transaction.clientUserName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.talentUserName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    ) || [];

  const filteredProjectTransactions =
    transactions?.projectTransactions.filter((transaction) =>
      searchQuery
        ? transaction.clientUserName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.talentUserName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    ) || [];

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: activeTextColor }}
        >
          Loading transactions...
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
          Access denied. Please sign in as an admin to view transactions.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-15 max-w-7xl mx-auto shadow-xl rounded-lg overflow-hidden border border-gray-900 mt-17"
      style={{
        backgroundImage: `url(${
          Images.adminViewbackground ? Images.adminViewbackground.src : ""
        })`,
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
          Manage Transactions
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium"
              style={{ color: activeTextColor }}
            >
              Filter by Payment Status:
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger
                id="status-filter"
                className="w-[180px] border-2 focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                  boxShadow: `0 0 0 2px ${accentColor}`,
                }}
              >
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                }}
              >
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value)}
            >
              <SelectTrigger
                id="time-filter"
                className="w-[180px] border-2 focus:ring-2 focus:ring-offset-2"
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
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                }}
              >
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="search"
              className="text-sm font-medium"
              style={{ color: activeTextColor }}
            >
              Search:
            </label>
            
          </div>
        </div>

        {/* Order Transactions Section */}
        <div className="mb-8">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: activeTextColor }}
          >
            Order-Related Transactions
          </h2>
          {filteredOrderTransactions.length === 0 ? (
            <div
              className="rounded-lg shadow-md border p-6 text-center"
              style={{
                backgroundColor: secondaryDarkGray,
                borderColor: accentColor,
              }}
            >
              <p className="text-lg" style={{ color: neutralTextColor }}>
                No order-related transactions found.
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg shadow-md border overflow-x-auto"
              style={{
                backgroundColor: secondaryDarkGray,
                borderColor: accentColor,
              }}
            >
              <Table className="min-w-full divide-y divide-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Transaction ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Client
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Talent
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created At
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Updated At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredOrderTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 truncate">
                        {transaction._id}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.clientUserName || "Unknown"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.talentUserName || "Unknown"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate">
                        {transaction.orderId}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <Badge
                          style={getPaymentStatusBadgeColor(
                            transaction.paymentStatus
                          )}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {transaction.paymentStatus.charAt(0).toUpperCase() +
                            transaction.paymentStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(transaction.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Project Transactions Section */}
        <div className="mb-8">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: activeTextColor }}
          >
            Project-Related Transactions
          </h2>
          {filteredProjectTransactions.length === 0 ? (
            <div
              className="rounded-lg shadow-md border p-6 text-center"
              style={{
                backgroundColor: secondaryDarkGray,
                borderColor: accentColor,
              }}
            >
              <p className="text-lg" style={{ color: neutralTextColor }}>
                No project-related transactions found.
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg shadow-md border overflow-x-auto"
              style={{
                backgroundColor: secondaryDarkGray,
                borderColor: accentColor,
              }}
            >
              <Table className="min-w-full divide-y divide-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Transaction ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Client
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Talent
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Project ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created At
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Updated At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredProjectTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 truncate">
                        {transaction._id}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.clientUserName || "Unknown"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.talentUserName || "Unknown"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate">
                        {transaction.orderId}{" "}
                        {/* Using orderId as Project ID */}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <Badge
                          style={getPaymentStatusBadgeColor(
                            transaction.paymentStatus
                          )}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {transaction.paymentStatus.charAt(0).toUpperCase() +
                            transaction.paymentStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(transaction.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
