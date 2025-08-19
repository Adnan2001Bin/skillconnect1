"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";

// UI Components & Icons
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
import { Dialog } from "@/components/ui/dialog";
import Loader from "@/components/Loader";
import { ArrowLeft, User, Package } from "lucide-react";

// Utilities & Types
import { Images } from "@/lib/images";
import type { Order } from "@/types/order"; // Import Order type

// Import the new dialog component
import ViewDeliverablesDialog from "@/components/userView/ViewDeliverablesDialog";

export default function ClientOrdersPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [revisionStatusFilter, setRevisionStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const colors = {
    primary: "#D3F1DF",
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

  const fetchOrders = useCallback(async () => {
    if (status === "authenticated" && session?.user?.role === "user") {
      setIsLoading(true);
      try {
        const res = await axios.get("/api/orders", {
          params: {
            clientId: session.user._id,
            status: statusFilter !== "all" ? statusFilter : undefined,
            revisionStatus:
              revisionStatusFilter !== "all" ? revisionStatusFilter : undefined,
          },
        });
        if (res.data.success) {
          setOrders(res.data.data);
        } else {
          toast.error("Failed to fetch orders.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching your orders.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [session, status, statusFilter, revisionStatusFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, router, fetchOrders]);

  const handleOrderUpdate = () => {
    setSelectedOrder(null);
    fetchOrders();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return { backgroundColor: colors.warningColor, color: colors.white };
      case "in-progress":
        return { backgroundColor: colors.inProgressColor, color: colors.white };
      case "delivered":
        return { backgroundColor: colors.deliveredColor, color: colors.white };
      case "completed":
        return { backgroundColor: colors.infoColor, color: colors.white };
      default:
        return { backgroundColor: colors.errorRed, color: colors.white };
    }
  };

  const getRevisionStatusBadgeColor = (revisionStatus: string) => {
    switch (revisionStatus) {
      case "requested":
        return { backgroundColor: colors.warningColor, color: colors.white };
      case "submitted":
        return { backgroundColor: colors.successColor, color: colors.white };
      default:
        return {
          backgroundColor: colors.neutralTextColor,
          color: colors.white,
        };
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse bg-emerald-50">
        <Loader text="Loading your orders..." color="#000000" bgColor="#90D1CA" />
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-[94rem] mx-auto"
        style={{
          backgroundImage: `url(${Images.userViewbackground?.src || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="relative z-10 mb-8 mt-20 p-5 rounded-2xl"
          style={{ backgroundColor: "rgba(163,209,198, 0.2)" }}
        >
          <Button
            onClick={() => router.push("/user/talents")}
            className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
            style={{ backgroundColor: colors.accentColor, color: colors.white }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Talents
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: colors.activeTextColor }}>
            Your Orders
          </h1>

          {/* Filters and Table remain the same... */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" style={{ borderColor: colors.inputBorderColor, color: colors.neutralTextColor }}>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={revisionStatusFilter} onValueChange={setRevisionStatusFilter}>
              <SelectTrigger className="w-[180px]" style={{ borderColor: colors.inputBorderColor, color: colors.neutralTextColor }}>
                <SelectValue placeholder="Filter by Revision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revisions</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {orders.length === 0 ? (
            <div className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border text-center" style={{ borderColor: colors.inputBorderColor }}>
              <p className="text-lg" style={{ color: colors.neutralTextColor }}>
                No matching orders found.
              </p>
            </div>
          ) : (
            <div className="bg-transparent rounded-lg shadow-md shadow-[#16423C] border overflow-x-auto" style={{ borderColor: colors.inputBorderColor }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: colors.activeTextColor }}>Talent</TableHead>
                    <TableHead style={{ color: colors.activeTextColor }}>Project</TableHead>
                    <TableHead style={{ color: colors.activeTextColor }}>Status</TableHead>
                    <TableHead style={{ color: colors.activeTextColor }}>Revision</TableHead>
                    <TableHead style={{ color: colors.activeTextColor }}>Created</TableHead>
                    <TableHead style={{ color: colors.activeTextColor }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell style={{ color: colors.neutralTextColor }}>{order.talentUserName || "N/A"}</TableCell>
                      <TableCell style={{ color: colors.neutralTextColor }}>{order.projectDetails.title}</TableCell>
                      <TableCell><Badge style={getStatusBadgeColor(order.status)}>{order.status}</Badge></TableCell>
                      <TableCell><Badge style={getRevisionStatusBadgeColor(order.revisionStatus)}>{order.revisionStatus}</Badge></TableCell>
                      <TableCell style={{ color: colors.neutralTextColor }}>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/talentList/${order.talentId}`)} style={{ borderColor: colors.accentColor, color: colors.accentColor }}>
                          <User className="h-4 w-4 mr-2" /> View Talent
                        </Button>
                        {(order.status === "delivered" || order.status === "completed") && (
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} style={{ borderColor: colors.accentColor, color: colors.accentColor }}>
                            <Package className="h-4 w-4 mr-2" /> View Deliverables
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

      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
        <ViewDeliverablesDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={handleOrderUpdate}
        />
      </Dialog>
    </>
  );
}