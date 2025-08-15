"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 as Loader, ArrowLeft } from "lucide-react";
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

export default function EditOrderPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    status: Order["status"];
    revisionStatus: Order["revisionStatus"];
    revisionCount: number;
    revisionRequest?: Order["revisionRequest"];
    projectDetails: Order["projectDetails"];
    ratePlan: RatePlan;
  }>({
    status: "pending",
    revisionStatus: "none",
    revisionCount: 0,
    revisionRequest: undefined,
    projectDetails: { title: "", description: "" },
    ratePlan: {
      type: "Basic",
      price: 0,
      description: "",
      whatsIncluded: [],
      deliveryDays: 0,
      revisions: 0,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consistent color theme
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";
  const errorColor = "#EF4444";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchOrder();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, router, id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/orders/${id}`);
      if (response.data.success) {
        const fetchedOrder = response.data.data;
        setOrder(fetchedOrder);
        setFormData({
          status: fetchedOrder.status,
          revisionStatus: fetchedOrder.revisionStatus || "none",
          revisionCount: fetchedOrder.revisionCount || 0,
          revisionRequest: fetchedOrder.revisionRequest
            ? {
                files: fetchedOrder.revisionRequest.files || [],
                note: fetchedOrder.revisionRequest.note || "",
                requestedAt: fetchedOrder.revisionRequest.requestedAt || new Date().toISOString(),
              }
            : undefined,
          projectDetails: fetchedOrder.projectDetails,
          ratePlan: fetchedOrder.ratePlan,
        });
      } else {
        toast.error("Error", {
          description: response.data.message || "Failed to fetch order details.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error", {
        description: "An error occurred while fetching order details.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.patch(`/api/admin/orders/${id}`, formData);
      if (response.data.success) {
        toast.success("Success", {
          description: "Order updated successfully.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        router.push(`/admin/management/orders/${id}`);
      } else {
        throw new Error(response.data.message || "Failed to update order.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update order.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | Order["projectDetails"] | RatePlan | Order["revisionRequest"]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatePlanChange = (key: keyof RatePlan, value: string | number | string[]) => {
    setFormData((prev) => ({
      ...prev,
      ratePlan: { ...prev.ratePlan, [key]: value },
    }));
  };

  const handleProjectDetailsChange = (key: keyof Order["projectDetails"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      projectDetails: { ...prev.projectDetails, [key]: value },
    }));
  };

  const handleRevisionRequestChange = (
    key: keyof NonNullable<Order["revisionRequest"]>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      revisionRequest: {
        ...prev.revisionRequest,
        [key]: value,
        files: prev.revisionRequest?.files || [],
        requestedAt: prev.revisionRequest?.requestedAt || new Date().toISOString(),
      },
    }));
  };

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
          Loading order details...
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
          Access denied. Please sign in as an admin to edit orders.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: errorColor }}>
          Order not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-15 max-w-7xl mx-auto mt-17"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push(`/admin/management/orders/${id}`)}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Order Details
        </Button>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-6"
          style={{ color: activeTextColor }}
        >
          Edit Order
        </h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg shadow-md border p-6"
          style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: activeTextColor }}
              >
                Order Information
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleInputChange("status", value as Order["status"])
                  }
                >
                  <SelectTrigger
                    id="status"
                    className="border-2 focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
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
              <div className="mb-4">
                <label
                  htmlFor="revisionStatus"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Revision Status
                </label>
                <Select
                  value={formData.revisionStatus}
                  onValueChange={(value) =>
                    handleInputChange("revisionStatus", value as Order["revisionStatus"])
                  }
                >
                  <SelectTrigger
                    id="revisionStatus"
                    className="border-2 focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  >
                    <SelectValue placeholder="Select revision status" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="revisionCount"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Revision Count
                </label>
                <Input
                  id="revisionCount"
                  type="number"
                  min="0"
                  value={formData.revisionCount}
                  onChange={(e) => handleInputChange("revisionCount", Number(e.target.value))}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter revision count"
                />
              </div>
            </div>
            <div>
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: activeTextColor }}
              >
                Project Details
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Title
                </label>
                <Input
                  id="title"
                  value={formData.projectDetails.title}
                  onChange={(e) => handleProjectDetailsChange("title", e.target.value)}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter project title"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.projectDetails.description}
                  onChange={(e) => handleProjectDetailsChange("description", e.target.value)}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <div>
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: activeTextColor }}
              >
                Rate Plan
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="ratePlanType"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Type
                </label>
                <Select
                  value={formData.ratePlan.type}
                  onValueChange={(value) =>
                    handleRatePlanChange("type", value as RatePlan["type"])
                  }
                >
                  <SelectTrigger
                    id="ratePlanType"
                    className="border-2 focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  >
                    <SelectValue placeholder="Select rate plan type" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Price
                </label>
                <Input
                  id="price"
                  type="number"
                  value={formData.ratePlan.price}
                  onChange={(e) => handleRatePlanChange("price", Number(e.target.value))}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter price"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="ratePlanDescription"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Description
                </label>
                <Textarea
                  id="ratePlanDescription"
                  value={formData.ratePlan.description}
                  onChange={(e) => handleRatePlanChange("description", e.target.value)}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter rate plan description"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="deliveryDays"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Delivery Days
                </label>
                <Input
                  id="deliveryDays"
                  type="number"
                  value={formData.ratePlan.deliveryDays}
                  onChange={(e) => handleRatePlanChange("deliveryDays", Number(e.target.value))}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter delivery days"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="revisions"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Revisions Allowed
                </label>
                <Input
                  id="revisions"
                  type="number"
                  min="0"
                  value={formData.ratePlan.revisions}
                  onChange={(e) => handleRatePlanChange("revisions", Number(e.target.value))}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter number of revisions"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="whatsIncluded"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  What’s Included (comma-separated)
                </label>
                <Textarea
                  id="whatsIncluded"
                  value={formData.ratePlan.whatsIncluded.join(", ")}
                  onChange={(e) => handleRatePlanChange("whatsIncluded", e.target.value.split(", ").filter(Boolean))}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter included items, separated by commas"
                />
              </div>
            </div>
            <div>
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: activeTextColor }}
              >
                Revision Information
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="revisionNote"
                  className="block text-sm font-medium mb-1"
                  style={{ color: activeTextColor }}
                >
                  Revision Request Note
                </label>
                <Textarea
                  id="revisionNote"
                  value={formData.revisionRequest?.note || ""}
                  onChange={(e) => handleRevisionRequestChange("note", e.target.value)}
                  className="border-2 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray, boxShadow: `0 0 0 2px ${accentColor}` }}
                  placeholder="Enter revision request note"
                />
              </div>
              {order.revisionRequest?.files && order.revisionRequest.files.length > 0 && (
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: activeTextColor }}
                  >
                    Revision Request Files
                  </label>
                  <div>
                    {order.revisionRequest.files.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline block"
                        style={{ color: "#60A5FA" }}
                      >
                        File {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {order.revisionRequest?.requestedAt && (
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: activeTextColor }}
                  >
                    Revision Requested At
                  </label>
                  <Input
                    value={new Date(order.revisionRequest.requestedAt).toLocaleString()}
                    disabled
                    className="border-2"
                    style={{ backgroundColor: white, borderColor: inputBorderColor, color: primaryDarkGray }}
                  />
                </div>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
          >
            {isSubmitting ? (
              <Loader className="animate-spin h-5 w-5 mr-2" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}