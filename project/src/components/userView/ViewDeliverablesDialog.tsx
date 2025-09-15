"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import {
  Loader2,
  File,
  Paperclip,
  RefreshCcw,
  XCircle,
  CheckCircle,
  Star,
} from "lucide-react";

// Utilities & Types
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/lib/uploadthing";

// Interface Definitions
interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  description: string;
  price: number;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

interface Deliverables {
  files: string[];
  note: string | null;
  submittedAt: string;
}

export interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: RatePlan;
  projectDetails: {
    title: string;
    description: string;
  };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled" | "completed";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
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
  deliverables?: Deliverables;
  review?: {
    rating: number;
    comment: string;
    reviewedAt: string;
  };
}

// Zod Schema for Revision Form
const revisionRequestSchema = z.object({
  revisionNote: z.string().max(1000).optional(),
  revisionFiles: z.array(z.string().url()).optional(),
});

// Zod Schema for Review Form
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

type RevisionRequestFormData = z.infer<typeof revisionRequestSchema>;
type ReviewFormData = z.infer<typeof reviewSchema>;

// Component Props
interface ViewDeliverablesDialogProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdate: () => void;
}

export default function ViewDeliverablesDialog({
  order,
  onOrderUpdate,
}: ViewDeliverablesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [revisionFiles, setRevisionFiles] = useState<string[]>([]);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const revisionForm = useForm<RevisionRequestFormData>({
    resolver: zodResolver(revisionRequestSchema),
    defaultValues: {
      revisionNote: "",
      revisionFiles: [],
    },
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  useEffect(() => {
    if (order) {
      revisionForm.reset();
      setRevisionFiles([]);
    }
  }, [order, revisionForm]);

  if (!order) return null;

  const handleFileUploadComplete = (res: { url: string }[]) => {
    if (res) {
      const newFiles = res.map((file) => file.url);
      setRevisionFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFiles];
        revisionForm.setValue("revisionFiles", updatedFiles, { shouldValidate: true });
        return updatedFiles;
      });
      toast.success("File Uploaded Successfully!");
    }
    setIsUploading(false);
  };

  const handleFileRemove = (index: number) => {
    setRevisionFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      revisionForm.setValue("revisionFiles", updatedFiles, { shouldValidate: true });
      return updatedFiles;
    });
  };

  const handleRequestRevision = async (data: RevisionRequestFormData) => {
    if (order.revisionCount >= order.ratePlan.revisions) return;

    setIsSubmitting(true);
    try {
      await axios.patch(`/api/orders/${order._id}/status`, {
        revisionStatus: "requested",
        revisionFiles: revisionFiles.length > 0 ? revisionFiles : undefined,
        revisionNote: data.revisionNote || undefined,
      });
      toast.success("Revision requested successfully.");
      onOrderUpdate();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Failed to request revision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveProject = async (data: ReviewFormData) => {
    setIsApproving(true);
    try {
      const response = await axios.patch(`/api/orders/${order._id}/status`, {
        status: "completed",
        review: {
          rating: data.rating,
          comment: data.comment || "",
          reviewedAt: new Date().toISOString(),
        },
      });
      if (response.data.success) {
        toast.success("Project approved and review submitted successfully.");
        setOpenApproveDialog(false);
        setOpenReviewDialog(false);
        onOrderUpdate();
      }
    } catch (error) {
      console.error("Error approving project:", error);
      toast.error("Failed to approve project or submit review. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const getDeadlineInfo = () => {
    let deadline = null;
    let daysLeft = 0;
    let hoursLeft = 0;

    if (order.status === "delivered" && order.deliverables?.submittedAt) {
      const deliveredAt = new Date(order.deliverables.submittedAt);
      deadline = new Date(deliveredAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days timer
    } else if (order.revisionStatus === "requested" && order.revisionRequest?.requestedAt) {
      const requestedAt = new Date(order.revisionRequest.requestedAt);
      deadline = new Date(requestedAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days timer
    }

    if (deadline) {
      const now = new Date();
      const timeLeft = Math.max(0, deadline.getTime() - now.getTime());
      daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    }

    return { deadline, daysLeft, hoursLeft };
  };

  const deadlineInfo = getDeadlineInfo();

  if (!order.deliverables) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Deliverables for {order.projectDetails.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center">
          <p>No deliverables have been submitted for this order yet.</p>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-3xl bg-black/30 backdrop-blur-md border-none text-white">
      <DialogHeader>
        <DialogTitle className="text-2xl text-white">
          Deliverables for {order.projectDetails.title}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
        {/* Actions: Approve & Revise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-white/10">
          {/* Project Approval */}
          <div>
            <h3 className="font-semibold flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-[#17B169]" /> Project
              Approval
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {order.status === "completed"
                ? "This project has been approved."
                : "Approve if you are satisfied."}
              {deadlineInfo.deadline && order.status === "delivered" && (
                <span className="block text-sm">
                  Deadline: {deadlineInfo.daysLeft}d {deadlineInfo.hoursLeft}h left
                </span>
              )}
            </p>
            <Button
              onClick={() => setOpenApproveDialog(true)}
              disabled={
                isApproving ||
                order.status !== "delivered" ||
                order.revisionStatus === "requested" ||
                (deadlineInfo.deadline !== null && deadlineInfo.daysLeft === 0 && deadlineInfo.hoursLeft === 0)
              }
              className="mt-3 bg-[#17B169] hover:bg-[#14995a] text-white"
            >
              {isApproving ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              Approve Project
            </Button>
          </div>
          {/* Revisions */}
          <div>
            <h3 className="font-semibold flex items-center">
              <RefreshCcw className="h-5 w-5 mr-2 text-[#17B169]" /> Revisions
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Used: {order.revisionCount} / {order.ratePlan.revisions}
              {deadlineInfo.deadline && order.revisionStatus === "requested" && (
                <span className="block">
                  Deadline: {deadlineInfo.daysLeft}d {deadlineInfo.hoursLeft}h left
                </span>
              )}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    isSubmitting ||
                    order.status !== "delivered" ||
                    order.revisionCount >= order.ratePlan.revisions ||
                    order.revisionStatus === "requested" ||
                    (deadlineInfo.deadline !== null && deadlineInfo.daysLeft === 0 && deadlineInfo.hoursLeft === 0)
                  }
                  className="mt-3 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <RefreshCcw className="h-5 w-5 mr-2" /> Request Revision
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request Revision</DialogTitle>
                </DialogHeader>
                <Form {...revisionForm}>
                  <form
                    onSubmit={revisionForm.handleSubmit(handleRequestRevision)}
                    className="space-y-4"
                  >
                    <FormField
                      control={revisionForm.control}
                      name="revisionNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revision Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the changes needed."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel>Attach Files (Optional)</FormLabel>
                      <UploadDropzone<OurFileRouter, "projectFileUploader">
                        endpoint="projectFileUploader"
                        onClientUploadComplete={handleFileUploadComplete}
                        onUploadError={() => {
                          setIsUploading(false);
                          toast.error("Upload Failed");
                        }}
                        onUploadBegin={() => setIsUploading(true)}
                        className="ut-button:bg-[#17B169] ut-upload-icon:text-[#17B169] mt-2"
                      />
                      {revisionFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {revisionFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center px-2 py-1 rounded-full text-xs bg-[#17B169] text-white"
                            >
                              File {index + 1}
                              <button
                                type="button"
                                className="ml-2"
                                onClick={() => handleFileRemove(index)}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="w-full bg-[#17B169] hover:bg-[#14995a]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      ) : (
                        <RefreshCcw className="h-5 w-5 mr-2" />
                      )}
                      Submit Revision Request
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Deliverables Details */}
        <div className="space-y-4">
          {order.deliverables.note && (
            <div>
              <h3 className="font-semibold flex items-center mb-2">
                <Paperclip className="h-5 w-5 mr-2" /> Submission Note
              </h3>
              <p className="p-3 rounded-lg bg-white/10 text-gray-300">
                {order.deliverables.note}
              </p>
            </div>
          )}
          {order.deliverables.files.length > 0 && (
            <div>
              <h3 className="font-semibold flex items-center mb-2">
                <File className="h-5 w-5 mr-2" /> Attached Files
              </h3>
              <div className="flex flex-wrap gap-3">
                {order.deliverables.files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1 rounded-full bg-[#17B169] hover:bg-[#14995a] text-white transition-colors"
                  >
                    <File className="h-4 w-4 mr-2" /> File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-gray-400 pt-4">
            Submitted on{" "}
            {new Date(order.deliverables.submittedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Confirmation Dialog for Approval with Review */}
        <Dialog open={openApproveDialog} onOpenChange={setOpenApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Project Approval</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to approve this project? Please provide a review and rating before approving.
            </p>
            <Button
              onClick={() => setOpenReviewDialog(true)}
              disabled={isApproving}
              className="mt-4 bg-[#17B169] hover:bg-[#14995a] text-white"
            >
              {isApproving ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              Proceed to Review
            </Button>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Rate & Review {order.talentUserName}
              </DialogTitle>
            </DialogHeader>
            <Form {...reviewForm}>
              <form
                onSubmit={reviewForm.handleSubmit(handleApproveProject)}
                className="space-y-6"
              >
                {/* Custom Star Rating */}
                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-300">
                        Your Rating
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          {Array(5)
                            .fill(0)
                            .map((_, index) => {
                              const starValue = index + 1;
                              const isFilled = hoverRating !== null
                                ? starValue <= hoverRating
                                : starValue <= field.value;
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => field.onChange(starValue)}
                                  onMouseEnter={() => setHoverRating(starValue)}
                                  onMouseLeave={() => setHoverRating(null)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className="h-8 w-8 cursor-pointer transition-colors duration-200"
                                    style={{
                                      color: isFilled
                                        ? "linear-gradient(90deg, #17B169, #D3F1DF)"
                                        : "#D3ECCD",
                                      fill: isFilled ? "#17B169" : "none",
                                    }}
                                  />
                                </button>
                              );
                            })}
                        </div>
                      </FormControl>
                      <p className="text-sm text-gray-400">
                        {hoverRating !== null
                          ? `Rating: ${hoverRating} stars`
                          : `Rating: ${field.value} stars`}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Comment Section */}
                <FormField
                  control={reviewForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-300">
                        Your Feedback (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Share your thoughts about the talent's work..."
                          className="resize-vertical min-h-[100px] bg-white/5 border border-gray-600 text-Black placeholder-gray-400"
                        />
                      </FormControl>
                      <p className="text-sm text-gray-400 text-right">
                        {field.value?.length || 0}/1000 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview Section */}
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Review Preview
                  </h4>
                  <p className="text-sm">
                    <strong>Rating:</strong>{" "}
                    {hoverRating !== null ? hoverRating : reviewForm.getValues("rating")} stars
                  </p>
                  {reviewForm.getValues("comment") && (
                    <p className="text-sm mt-1">
                      <strong>Comment:</strong> {reviewForm.getValues("comment")}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isApproving}
                  className="w-full bg-gradient-to-r from-[#17B169] to-[#14995a] hover:from-[#14995a] hover:to-[#17B169] text-white font-semibold py-2 rounded-lg transition-all duration-200"
                >
                  {isApproving ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    "Submit Review & Approve"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DialogContent>
  );
}