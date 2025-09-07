"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  MessageSquareText,
  User,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw,
  CreditCard,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import axios from "axios";

interface PlainProposal {
  _id: string;
  projectId: string;
  talentId: string;
  bid: number;
  coverLetter: string;
  files?: string[];
  proposalStatus:
    | "pending"
    | "accepted"
    | "rejected"
    | "delivered"
    | "revision-requested";
  createdAt: string;
  updatedAt: string;
  revisionCount?: number;
  revisionNote?: string | null;
  talent?: {
    _id: string;
    userName: string;
    profilePicture?: string | null;
    category?: string | null;
    bio?: string | null;
    skills?: string[];
  };
  paymentStatus?: "pending" | "completed" | "failed";
}

interface Deliverable {
  files: string[];
  note: string | null;
  submittedAt: string | null;
  proposalStatus?: string;
  revisionCount?: number;
  revisionNote?: string | null;
}

interface ProjectActionsProps {
  project: IProject;
  isClient: boolean;
  id: string;
  deliverables: Deliverable | null;
  colors: {
    primary: string;
    accentColor: string;
    activeTextColor: string;
    neutralTextColor: string;
    white: string;
  };
  handleStatusUpdate: (newStatus: "completed" | "cancelled", reviewData?: { rating: number; comment: string }) => Promise<void>;
}

// Helper function to get category label
const getCategoryLabel = (categoryValue: string | null | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Helper function to get proposal status badge styles
const getProposalStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return {
        variant: "default" as const,
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        text: "Pending",
      };
    case "accepted":
      return {
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600 text-white",
        text: "Accepted",
      };
    case "rejected":
      return {
        variant: "destructive" as const,
        className: "bg-red-600 hover:bg-red-700 text-white",
        text: "Rejected",
      };
    case "delivered":
      return {
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
        text: "Delivered",
      };
    case "revision-requested":
      return {
        variant: "default" as const,
        className: "bg-yellow-600 hover:bg-yellow-700 text-white",
        text: "Revision Requested",
      };
    default:
      return {
        variant: "secondary" as const,
        className: "bg-gray-500 hover:bg-gray-600",
        text: "Unknown",
      };
  }
};

// Helper function to get payment status badge styles
const getPaymentStatusBadge = (status?: string) => {
  switch (status) {
    case "pending":
      return {
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        text: "Pending",
      };
    case "completed":
      return {
        className: "bg-green-500 hover:bg-green-600 text-white",
        text: "Completed",
      };
    case "failed":
      return {
        className: "bg-red-600 hover:bg-red-700 text-white",
        text: "Failed",
      };
    default:
      return {
        className: "bg-gray-500 hover:bg-gray-600",
        text: "Unknown",
      };
  }
};

export default function ProjectActions({
  project,
  isClient,
  id,
  deliverables,
  colors,
  handleStatusUpdate,
}: ProjectActionsProps) {
  const router = useRouter();
  const [proposals, setProposals] = useState<PlainProposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch proposals and talent details for the project
  const fetchProposals = async () => {
    try {
      setProposalsLoading(true);
      const response = await axios.get(`/api/projects/${id}/proposals`);
      if (response.status !== 200) {
        throw new Error("Failed to fetch proposals");
      }

      const proposalsWithTalent = await Promise.all(
        response.data.data.map(async (proposal: PlainProposal) => {
          try {
            const talentResponse = await axios.get(
              `/api/profile/${proposal.talentId}`
            );
            if (talentResponse.data.success) {
              return { ...proposal, talent: talentResponse.data.data };
            }
            return proposal;
          } catch (error) {
            console.error(`Error fetching talent ${proposal.talentId}:`, error);
            return proposal;
          }
        })
      );

      setProposals(proposalsWithTalent);
    } catch (err) {
      setProposalsError("Failed to load proposals. Please try again later.");
      console.error("Error fetching proposals:", err);
      toast.error("Error fetching proposals.");
    } finally {
      setProposalsLoading(false);
    }
  };

  // Handle file download
  const handleFileDownload = (file: string) => {
    try {
      if (!file) throw new Error("Invalid file URL");
      window.open(file, "_blank");
    } catch (err) {
      toast.error("Failed to open file. The URL may be invalid.");
    }
  };

  // Handle proposal status update
  const handleProposalStatusUpdate = async (
    proposalId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    try {
      const response = await axios.put(`/api/proposals/${proposalId}`, {
        proposalStatus: newStatus,
      });

      if (response.data.success) {
        setProposals((prev) =>
          prev.map((p) =>
            p._id === proposalId ? { ...p, proposalStatus: newStatus } : p
          )
        );

        toast.success(`Proposal has been ${newStatus}.`);

        if (newStatus === "rejected") {
          setTimeout(() => {
            setProposals((prev) => prev.filter((p) => p._id !== proposalId));
          }, 2000);
        }
      } else {
        throw new Error(
          response.data.message || "Failed to update proposal status"
        );
      }
    } catch (error) {
      toast.error("Failed to update proposal status.");
    }
  };

  // Handle payment initiation
  const handleInitiatePayment = async (proposalId: string) => {
    try {
      const response = await axios.post(`/api/payments/initiate`, {
        proposalId,
        projectId: id,
      });

      if (response.data.success) {
        setProposals((prev) =>
          prev.map((p) =>
            p._id === proposalId ? { ...p, paymentStatus: "pending" } : p
          )
        );
        toast.success("Payment initiation successful. Redirecting to payment gateway...");
        // Assuming the API returns a payment URL, redirect to it
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        }
      } else {
        throw new Error(response.data.message || "Failed to initiate payment");
      }
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  // Check if project can be marked as completed
  const canMarkAsCompleted =
    isClient &&
    project.status === "in-progress" &&
    deliverables &&
    (deliverables.proposalStatus === "delivered" ||
      deliverables.proposalStatus === "revision-requested");

  const handleMarkAsCompletedWithReview = async () => {
    if (comment.trim() && rating > 0) {
      setIsSubmittingReview(true);
      try {
        // Call handleStatusUpdate with review data, which will also update paymentStatus to "completed"
        await handleStatusUpdate("completed", { rating, comment });
        // Fetch the accepted proposal to update its payment status
        const proposalResponse = await axios.get(`/api/projects/${id}/proposals`);
        const acceptedProposal = proposalResponse.data.data.find(
          (proposal: PlainProposal) => proposal.proposalStatus === "accepted" || 
          proposal.proposalStatus === "delivered" || 
          proposal.proposalStatus === "revision-requested"
        );
        if (acceptedProposal) {
          await axios.put(`/api/proposals/${acceptedProposal._id}`, {
            paymentStatus: "completed",
          });
          setProposals((prev) =>
            prev.map((p) =>
              p._id === acceptedProposal._id ? { ...p, paymentStatus: "completed" } : p
            )
          );
        }
        setReviewDialogOpen(false);
        setRating(5);
        setComment("");
        toast.success("Project completed and payment status updated.");
      } catch (error) {
        toast.error("Failed to submit review or update payment status. Please try again.");
      } finally {
        setIsSubmittingReview(false);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {isClient && (
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className={`px-6 py-2 rounded-full font-semibold transition-colors`}
              style={{
                backgroundColor: canMarkAsCompleted ? colors.accentColor : "#6B7280",
                color: colors.white,
              }}
              disabled={!canMarkAsCompleted}
            >
              Mark as Completed
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Rate Your Experience</DialogTitle>
              <DialogDescription className="text-center">
                Please share your feedback about the talent's work
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Star Rating */}
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className="h-8 w-8 cursor-pointer transition-colors"
                        style={{
                          color: star <= (hoverRating || rating) ? "#F59E0B" : "#D1D5DB",
                          fill: star <= (hoverRating || rating) ? "#F59E0B" : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {rating} star{rating !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback (Optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this talent..."
                  className="min-h-[100px] resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewDialogOpen(false);
                    setRating(5);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsCompletedWithReview}
                  disabled={isSubmittingReview || rating === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmittingReview ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Submit Review & Complete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isClient &&
        (project.status === "open" || project.status === "in-progress") && (
          <Button
            onClick={() => handleStatusUpdate("cancelled")}
            variant="outline"
            className="px-6 py-2 rounded-full font-semibold"
            style={{
              borderColor: colors.accentColor,
              color: colors.accentColor,
            }}
          >
            Cancel Project
          </Button>
        )}
      {isClient &&
        (project.status === "open" || project.status === "in-progress") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className={`px-6 py-2 rounded-full font-semibold transition-colors`}
                style={{
                  backgroundColor: colors.accentColor,
                  color: colors.white,
                }}
                onClick={fetchProposals}
              >
                View Proposals
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquareText className="text-green-600" />
                  Project Proposals
                </DialogTitle>
                <DialogDescription>
                  Review and manage proposals submitted for your project.
                </DialogDescription>
              </DialogHeader>
              {proposalsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-10 w-10 text-green-600" />
                </div>
              ) : proposalsError ? (
                <div className="flex items-center justify-center py-12 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <p className="text-lg font-semibold">{proposalsError}</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquareText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No proposals yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Wait for talented individuals to submit their proposals.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[150px] font-semibold text-gray-700">
                          Talent
                        </TableHead>
                        <TableHead className="w-[150px] font-semibold text-gray-700">
                          Bid Amount
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Cover Letter
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Files
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Revision Info
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Payment Status
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => {
                        const statusInfo = getProposalStatusBadge(
                          proposal.proposalStatus
                        );
                        const paymentStatusInfo = getPaymentStatusBadge(
                          proposal.paymentStatus
                        );
                        return (
                          <TableRow key={proposal._id} className="group">
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                  >
                                    <User className="h-4 w-4" />
                                    {proposal.talent?.userName || "View Talent"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[625px]">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <User className="text-green-600" />
                                      Talent Profile
                                    </DialogTitle>
                                  </DialogHeader>
                                  {proposal.talent ? (
                                    <div className="flex flex-col gap-4">
                                      <div className="flex items-center gap-4">
                                        {proposal.talent.profilePicture ? (
                                          <Image
                                            src={proposal.talent.profilePicture}
                                            alt="Profile Picture"
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover border-2"
                                            style={{
                                              borderColor: colors.accentColor,
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                                            style={{
                                              backgroundColor: colors.primary,
                                              borderColor: colors.accentColor,
                                            }}
                                          >
                                            <User
                                              className="h-10 w-10"
                                              style={{
                                                color: colors.activeTextColor,
                                              }}
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <h3
                                            className="text-lg font-semibold"
                                            style={{ color: colors.primary }}
                                          >
                                            {proposal.talent.userName}
                                          </h3>
                                          <p
                                            className="text-sm"
                                            style={{
                                              color: colors.neutralTextColor,
                                            }}
                                          >
                                            {getCategoryLabel(
                                              proposal.talent.category
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      {proposal.talent.bio && (
                                        <div>
                                          <h4
                                            className="text-sm font-semibold"
                                            style={{ color: colors.primary }}
                                          >
                                            Bio
                                          </h4>
                                          <p
                                            className="text-sm"
                                            style={{
                                              color: colors.neutralTextColor,
                                            }}
                                          >
                                            {proposal.talent.bio}
                                          </p>
                                        </div>
                                      )}
                                      {proposal.talent.skills &&
                                        proposal.talent.skills.length > 0 && (
                                          <div>
                                            <h4
                                              className="text-sm font-semibold"
                                              style={{ color: colors.primary }}
                                            >
                                              Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                              {proposal.talent.skills.map(
                                                (skill, index) => (
                                                  <Badge
                                                    key={index}
                                                    className="px-2 py-1 text-xs"
                                                    style={{
                                                      backgroundColor:
                                                        colors.accentColor,
                                                      color:
                                                        colors.activeTextColor,
                                                    }}
                                                  >
                                                    {skill}
                                                  </Badge>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      <Button
                                        onClick={() =>
                                          router.push(
                                            `/talentList/${proposal.talentId}`
                                          )
                                        }
                                        className="mt-4"
                                        style={{
                                          backgroundColor: colors.accentColor,
                                          color: colors.activeTextColor,
                                        }}
                                      >
                                        View Full Profile
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      Talent details not available.
                                    </p>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell className="font-medium text-gray-800">
                              ${proposal.bid.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusInfo.className}>
                                {statusInfo.text}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    style={{
                                      borderColor: colors.accentColor,
                                      color: colors.accentColor,
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                    View Letter
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-left">
                                      <MessageSquareText
                                        className="h-5 w-5"
                                        style={{ color: colors.accentColor }}
                                      />
                                      Cover Letter from{" "}
                                      {proposal.talent?.userName || "Talent"}
                                    </DialogTitle>
                                  </DialogHeader>

                                  <div className="flex-1 overflow-y-auto pr-2 mt-2">
                                    <div
                                      className="p-6 rounded-lg border"
                                      style={{
                                        backgroundColor: `${colors.primary}08`,
                                        borderColor: `${colors.accentColor}20`,
                                      }}
                                    >
                                      <div className="flex items-start gap-3 mb-4">
                                        {proposal.talent?.profilePicture ? (
                                          <Image
                                            src={proposal.talent.profilePicture}
                                            alt="Profile Picture"
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                          />
                                        ) : (
                                          <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{
                                              backgroundColor: colors.primary,
                                            }}
                                          >
                                            <User
                                              className="h-5 w-5"
                                              style={{ color: colors.white }}
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <h3
                                            className="font-semibold"
                                            style={{ color: colors.primary }}
                                          >
                                            {proposal.talent?.userName ||
                                              "Unknown Talent"}
                                          </h3>
                                          <p
                                            className="text-sm"
                                            style={{
                                              color: colors.neutralTextColor,
                                            }}
                                          >
                                            {proposal.talent
                                              ? getCategoryLabel(
                                                  proposal.talent.category
                                                )
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mb-4 p-4 rounded-md bg-white border">
                                        <h4
                                          className="text-sm font-medium mb-2 flex items-center gap-2"
                                          style={{ color: colors.primary }}
                                        >
                                          <FileText className="h-4 w-4" />
                                          Proposal Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p
                                              className="font-medium"
                                              style={{
                                                color: colors.neutralTextColor,
                                              }}
                                            >
                                              Bid Amount
                                            </p>
                                            <p
                                              className="font-semibold"
                                              style={{ color: colors.primary }}
                                            >
                                              ${proposal.bid.toLocaleString()}
                                            </p>
                                          </div>
                                          <div>
                                            <p
                                              className="font-medium"
                                              style={{
                                                color: colors.neutralTextColor,
                                              }}
                                            >
                                              Submitted On
                                            </p>
                                            <p
                                              className="font-semibold"
                                              style={{ color: colors.primary }}
                                            >
                                              {new Date(
                                                proposal.createdAt
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4
                                          className="text-sm font-medium mb-3 flex items-center gap-2"
                                          style={{ color: colors.primary }}
                                        >
                                          <MessageSquareText className="h-4 w-4" />
                                          Message
                                        </h4>
                                        <div
                                          className="p-4 bg-white rounded-md border overflow-auto max-h-60"
                                          style={{
                                            borderColor: `${colors.accentColor}20`,
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                          }}
                                        >
                                          <p
                                            className="whitespace-pre-wrap break-words"
                                            style={{ color: colors.primary }}
                                          >
                                            {proposal.coverLetter}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end pt-4 border-t mt-4">
                                    <Button
                                      onClick={() =>
                                        handleProposalStatusUpdate(
                                          proposal._id,
                                          "accepted"
                                        )
                                      }
                                      size="sm"
                                      className="mr-2"
                                      style={{
                                        backgroundColor: colors.accentColor,
                                        color: colors.white,
                                      }}
                                      disabled={
                                        proposal.proposalStatus !== "pending"
                                      }
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Accept Proposal
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleProposalStatusUpdate(
                                          proposal._id,
                                          "rejected"
                                        )
                                      }
                                      size="sm"
                                      variant="outline"
                                      style={{
                                        borderColor: colors.accentColor,
                                        color: colors.accentColor,
                                      }}
                                      disabled={
                                        proposal.proposalStatus !== "pending"
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell>
                              {proposal.files && proposal.files.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {proposal.files.map((file, index) => (
                                    <Button
                                      key={index}
                                      onClick={() => handleFileDownload(file)}
                                      size="sm"
                                      variant="ghost"
                                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                    >
                                      <FileText className="h-4 w-4" />
                                      File {index + 1}
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  None
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {proposal.proposalStatus ===
                                "revision-requested" ||
                              proposal.proposalStatus === "delivered" ? (
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm text-gray-700">
                                    Revision Attempts:{" "}
                                    {proposal.revisionCount || 0}/2
                                  </p>
                                  {proposal.revisionNote && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                        >
                                          <RefreshCcw className="h-4 w-4" />
                                          View Revision Note
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[625px]">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <RefreshCcw className="text-yellow-600" />
                                            Revision Request Note
                                          </DialogTitle>
                                          <DialogDescription className="pt-4 text-left text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {proposal.revisionNote}
                                          </DialogDescription>
                                        </DialogHeader>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  N/A
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={paymentStatusInfo.className}>
                                {paymentStatusInfo.text}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {proposal.proposalStatus === "pending" && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleProposalStatusUpdate(
                                        proposal._id,
                                        "accepted"
                                      )
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleProposalStatusUpdate(
                                        proposal._id,
                                        "rejected"
                                      )
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {proposal.proposalStatus === "accepted" &&
                                proposal.paymentStatus === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleInitiatePayment(proposal._id)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
                                    style={{ backgroundColor: colors.accentColor }}
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Initiate Payment
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      <Button
        onClick={() => router.push("/projects")}
        className="px-6 py-2 rounded-full font-semibold"
        style={{
          backgroundColor: colors.accentColor,
          color: colors.white,
        }}
      >
        Back to Projects
      </Button>
    </div>
  );
}