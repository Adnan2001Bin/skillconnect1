"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
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
import { ArrowLeft, Briefcase, ShoppingCart } from "lucide-react";

interface Transaction {
  _id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  clientName: string;
  relatedTo: "order" | "project";
}

export default function TalentPaymentsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [projectTransactions, setProjectTransactions] = useState<Transaction[]>([]);
  const [orderTransactions, setOrderTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get("/api/talent/payments");
          if (response.data.success) {
            // Separate transactions by type
            const transactions = response.data.data;
            setProjectTransactions(transactions.filter((t: Transaction) => t.relatedTo === "project"));
            setOrderTransactions(transactions.filter((t: Transaction) => t.relatedTo === "order"));
          } else {
            toast.error("Failed to fetch transactions.");
          }
        } catch (error) {
          console.error("Error fetching transactions:", error);
          toast.error("An error occurred while fetching transactions.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactions();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return { backgroundColor: "#34D399", color: "#FFFFFF" };
      case "pending":
        return { backgroundColor: "#FBBF24", color: "#FFFFFF" };
      case "failed":
        return { backgroundColor: "#EF4444", color: "#FFFFFF" };
      case "cancelled":
        return { backgroundColor: "#9CA3AF", color: "#FFFFFF" };
      default:
        return { backgroundColor: "#9CA3AF", color: "#FFFFFF" };
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading transactions...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-bold text-red-600">
          Access denied. Please sign in as a talent.
        </p>
      </div>
    );
  }

  const renderTransactionTable = (transactions: Transaction[], title: string, icon: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 px-6 pt-6 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {transactions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-lg text-gray-600">No {title.toLowerCase()} found.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-700">ID</TableHead>
              <TableHead className="text-gray-700">Client</TableHead>
              <TableHead className="text-gray-700">Amount</TableHead>
              <TableHead className="text-gray-700">Currency</TableHead>
              <TableHead className="text-gray-700">Status</TableHead>
              <TableHead className="text-gray-700">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell className="text-gray-600">{transaction.orderId}</TableCell>
                <TableCell className="text-gray-600">{transaction.clientName}</TableCell>
                <TableCell className="text-gray-600">
                  {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-gray-600">{transaction.currency}</TableCell>
                <TableCell>
                  <Badge
                    style={getStatusBadgeColor(transaction.status)}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-[94rem] mx-auto bg-gray-50 mt-17">
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push("/talent/dashboard")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-800">
          Your Payment Transactions
        </h1>

        {/* Project Payments Section */}
        {renderTransactionTable(
          projectTransactions,
          "Project Payments",
          <Briefcase className="h-6 w-6 text-blue-600" />
        )}

        {/* Order Payments Section */}
        {renderTransactionTable(
          orderTransactions,
          "Order Payments",
          <ShoppingCart className="h-6 w-6 text-blue-600" />
        )}
      </div>
    </div>
  );
}