"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  Briefcase,
  CalendarDays,
  DollarSign,
  Clock,
  FileText,
  Tag,
  AlertCircle,
  MessageSquareText,
  CreditCard,
  Star,
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { Images } from "@/lib/images";
import { toast } from "sonner";
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
import ProposalForm from "@/components/talent/proposals/ProposalForm";
import DeliverableForm from "@/components/talent/DeliverableForm";
import Loader from "@/components/Loader";
import { io } from "socket.io-client";

// Define interfaces for better type safety
interface ProjectFile {
  url: string;
  name?: string;
}

interface ProposalStatus {
  hasApplied: boolean;
  status?: "pending" | "accepted" | "rejected" | "delivered" | "revision-requested";
  proposalId?: string;
  revisionNote?: string | null;
  revisionCount?: number;
  paymentStatus?: "pending" | "completed" | "failed";
}

const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-[#34D399] text-white";
    case "in-progress":
      return "bg-[#3B82F6] text-white";
    case "completed":
      return "bg-[#6EE7B7] text-white";
    case "cancelled":
      return "bg-[#EF4444] text-white";
    default:
      return "bg-[#757575] text-white";
  }
};

const getProposalStatusBadgeColor = (status?: string) => {
  switch (status) {
    case "pending":
      return "bg-[#FBBF24] text-white";
    case "accepted":
      return "bg-[#34D399] text-white";
    case "rejected":
      return "bg-[#EF4444] text-white";
    case "delivered":
      return "bg-[#3B82F6] text-white";
    case "revision-requested":
      return "bg-[#F59E0B] text-white";
    default:
      return "bg-[#757575] text-white";
  }
};

export default function TalentProjectDetailsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmittingDeliverables, setIsSubmittingDeliverables] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>({
    hasApplied: false,
  });
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

  // useCallback memoizes the function to prevent it from being recreated on every render.
  const fetchProjectAndProposal = useCallback(async () => {
    try {
      setLoading(true);

      const projectResponse = await axios.get(`/api/talent/projects/${id}`);
      if (projectResponse.status !== 200) {
        throw new Error("Failed to fetch project");
      }
      const projectData = projectResponse.data.data;
      if (projectData.status === "completed") {
        setProposalStatus((prev) => ({
          ...prev,
          paymentStatus: "completed",
        }));
      }
      setProject(projectData);

      if (session?.user?._id) {
        try {
          const proposalResponse = await axios.get(`/api/proposals/check`, {
            params: { projectId: id, talentId: session.user._id },
          });
          setProposalStatus({
            hasApplied: proposalResponse.data.hasApplied || false,
            status: proposalResponse.data.status,
            proposalId: proposalResponse.data.proposalId,
            revisionCount: proposalResponse.data.revisionCount || 0,
            revisionNote: proposalResponse.data.revisionNote || null,
            paymentStatus: proposalResponse.data.status === "completed" ? "completed" : proposalResponse.data.paymentStatus || "pending",
          });
        } catch (err) {
          console.error("Error fetching proposal status:", err);
          setProposalStatus({ hasApplied: false });
        }
      }
    } catch (err) {
      setError("Failed to load project details. Please try again later.");
      console.error("Error fetching project or proposal:", err);
      toast.error("Error", {
        description: "Failed to load project details. Please try again.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [id, session]); // Dependencies for useCallback

  useEffect(() => {
    if (id) {
      fetchProjectAndProposal();
    }
  }, [id, fetchProjectAndProposal]); // Updated dependency array

  useEffect(() => {
    if (!session?.user?._id) return;

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      {
        auth: { userId: session.user._id },
      }
    );

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session.user._id);
    });

    socket.on(
      "revisionRequested",
      (data: {
        proposalId: string;
        projectId: string;
        revisionCount: number;
        revisionNote: string;
      }) => {
        if (data.projectId === id) {
          setProposalStatus((prev) => ({
            ...prev,
            status: "revision-requested",
            revisionCount: data.revisionCount,
            revisionNote: data.revisionNote,
          }));
          toast.info("Revision Requested", {
            description:
              "The client has requested a revision for your deliverables.",
            className:
              "bg-yellow-600 text-white border-yellow-700 bg-opacity-80",
            duration: 4000,
          });
        }
      }
    );

    socket.on(
      "projectStatusUpdated",
      (data: { projectId: string; status: string }) => {
        if (data.projectId === id) {
          setProject((prev) =>
            prev ? ({ ...prev, status: data.status } as IProject) : null
          );
          if (data.status === "completed") {
            setProposalStatus((prev) => ({
              ...prev,
              paymentStatus: "completed",
              hasApplied: prev.hasApplied,
              status: prev.status,
              proposalId: prev.proposalId,
              revisionNote: prev.revisionNote,
              revisionCount: prev.revisionCount,
            }));
            toast.success("Project Completed", {
              description: "The client has marked this project as completed.",
              className:
                "bg-green-600 text-white border-green-700 bg-opacity-80",
              duration: 4000,
            });
          } else if (data.status === "cancelled") {
            toast.error("Project Cancelled", {
              description: "The client has cancelled this project.",
              className: "bg-red-600 text-white border-red-700 bg-opacity-80",
              duration: 4000,
            });
            setTimeout(() => router.push("/talent/projects"), 4000);
          }
        }
      }
    );

    socket.on(
      "paymentCompleted",
      (data: { projectId: string; paymentStatus: "pending" | "completed" | "failed" }) => {
        if (data.projectId === id) {
          setProposalStatus((prev) => ({
            ...prev,
            paymentStatus: data.paymentStatus,
            hasApplied: prev.hasApplied,
            status: prev.status,
            proposalId: prev.proposalId,
            revisionNote: prev.revisionNote,
            revisionCount: prev.revisionCount,
          }));
          toast.success("Payment Processed", {
            description: `Payment status updated to ${data.paymentStatus}.`,
            className: "bg-green-600 text-white border-green-700 bg-opacity-80",
            duration: 4000,
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id, id, router, setProject, setProposalStatus]); 

  const handleFileDownload = (file: ProjectFile) => {
    try {
      if (!file.url) {
        throw new Error("Invalid file URL");
      }
      window.open(file.url, "_blank");
    } catch (err) {
      console.log(err);
      toast.error("Error", {
        description: "Failed to open file. The URL may be invalid.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handleCancelProposal = () => {
    setIsApplying(false);
  };

  const handleProposalSuccess = () => {
    setIsApplying(false);
    setProposalStatus({ hasApplied: true, status: "pending" });
    toast.success("Proposal Submitted", {
      description: "Your proposal has been submitted and is pending review.",
      className: "bg-[#8DBCC7] text-white border-[#90D1CA] bg-opacity-80",
      duration: 4000,
    });
    fetchProjectAndProposal();
  };

  const handleCancelDeliverables = () => {
    setIsSubmittingDeliverables(false);
  };

  const handleDeliverableSuccess = () => {
    setIsSubmittingDeliverables(false);
    setProposalStatus((prev) => ({ ...prev, status: "delivered" }));
    toast.success("Deliverables Submitted", {
      description: "Your deliverables have been submitted successfully.",
      className: "bg-[#8DBCC7] text-white border-[#90D1CA] bg-opacity-80",
      duration: 4000,
    });
    fetchProjectAndProposal();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <Loader
          text="Loading project..."
          color="#000000"
          bgColor="#90D1CA"
          size="large"
        />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#e4e0ff] px-4">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p className="text-base sm:text-lg font-semibold text-center">
            {error || "Project not found."}
          </p>
        </div>
      </div>
    );
  }

  const formattedCreatedAt = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const projectFiles: ProjectFile[] = (project.files || []).map((file) =>
    typeof file === "string" ? { url: file } : file
  );

  const isTalent = session?.user?.role === "talent";

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
      <div
        className="relative z-10 max-w-4xl mx-auto rounded-lg shadow-md shadow-[#8DBCC7] overflow-hidden"
        style={{ backgroundColor: colors.containerBg }}
      >
        <div className="p-4 sm:p-6" style={{ backgroundColor: colors.headerBg }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white line-clamp-2">
            {project.title}
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 gap-2 sm:gap-4">
            <p className="text-[#90D1CA] text-sm sm:text-base">
              {getCategoryLabel(project.category)}
            </p>
            <Badge className={getStatusBadgeColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
              style={{ color: colors.activeTextColor }}
            >
              Description
            </h2>
            <p
              className="leading-relaxed text-sm sm:text-base"
              style={{ color: colors.neutralTextColor }}
            >
              {project.description}
            </p>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
              style={{ color: colors.activeTextColor }}
            >
              Project Details
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8fafc]">
                    <TableHead
                      className="text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      Attribute
                    </TableHead>
                    <TableHead
                      className="text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      <DollarSign
                        className="h-5 w-5"
                        style={{ color: colors.iconColor }}
                      />
                      Budget
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{ color: colors.neutralTextColor }}
                    >
                      ${project.budget.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      <Clock
                        className="h-5 w-5"
                        style={{ color: colors.iconColor }}
                      />
                      Timeline
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{ color: colors.neutralTextColor }}
                    >
                      {project.timeline} days
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      <Briefcase
                        className="h-5 w-5"
                        style={{ color: colors.iconColor }}
                      />
                      Category
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{ color: colors.neutralTextColor }}
                    >
                      {getCategoryLabel(project.category)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      <CalendarDays
                        className="h-5 w-5"
                        style={{ color: colors.iconColor }}
                      />
                      Posted On
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{ color: colors.neutralTextColor }}
                    >
                      {formattedCreatedAt}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: colors.activeTextColor }}
                    >
                      <Tag
                        className="h-5 w-5"
                        style={{ color: colors.iconColor }}
                      />
                      Project Status
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{ color: colors.neutralTextColor }}
                    >
                      <Badge className={getStatusBadgeColor(project.status)}>
                        {project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {proposalStatus.status && (
                    <TableRow>
                      <TableCell
                        className="flex items-center gap-2 text-sm font-semibold"
                        style={{ color: colors.activeTextColor }}
                      >
                        <FileText
                          className="h-5 w-5"
                          style={{ color: colors.iconColor }}
                        />
                        Your Proposal Status
                      </TableCell>
                      <TableCell
                        className="text-sm"
                        style={{ color: colors.neutralTextColor }}
                      >
                        <Badge
                          className={getProposalStatusBadgeColor(
                            proposalStatus.status
                          )}
                        >
                          {proposalStatus.status.charAt(0).toUpperCase() +
                            proposalStatus.status.slice(1)}
                        </Badge>
                        {proposalStatus.status === "rejected" && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: colors.neutralTextColor }}
                          >
                            Your previous proposal was rejected. You can submit
                            a new proposal.
                          </p>
                        )}
                        {proposalStatus.status === "delivered" && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: colors.neutralTextColor }}
                          >
                            Your deliverables have been submitted.
                          </p>
                        )}
                        {proposalStatus.status === "revision-requested" && (
                          <div className="mt-2">
                            <p
                              className="text-sm font-semibold flex items-center gap-2"
                              style={{ color: colors.activeTextColor }}
                            >
                              <MessageSquareText
                                className="h-5 w-5"
                                style={{ color: colors.iconColor }}
                              />
                              Revision Request Note
                            </p>
                            <blockquote className="border-l-4 border-yellow-500 pl-4 py-2 mt-1 bg-gray-100 rounded-r-md">
                              <p
                                className="text-sm italic"
                                style={{ color: colors.neutralTextColor }}
                              >
                                &ldquo;
                                {proposalStatus.revisionNote ||
                                  "No note provided"}
                                &rdquo;
                              </p>
                            </blockquote>
                            <p
                              className="text-sm mt-1"
                              style={{ color: colors.neutralTextColor }}
                            >
                              Revision attempt {proposalStatus.revisionCount} of
                              2
                            </p>
                          </div>
                        )}
                        {proposalStatus.paymentStatus && (
                          <div className="mt-2">
                            <p
                              className="text-sm font-semibold flex items-center gap-2"
                              style={{ color: colors.activeTextColor }}
                            >
                              <CreditCard
                                className="h-5 w-5"
                                style={{ color: colors.iconColor }}
                              />
                              Payment Status
                            </p>
                            <Badge
                              className={
                                proposalStatus.paymentStatus === "completed"
                                  ? "bg-green-600 text-white"
                                  : proposalStatus.paymentStatus === "failed"
                                  ? "bg-red-600 text-white"
                                  : "bg-yellow-600 text-white"
                              }
                            >
                              {proposalStatus.paymentStatus.charAt(0).toUpperCase() +
                                proposalStatus.paymentStatus.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
              style={{ color: colors.activeTextColor }}
            >
              Services Required
            </h2>
            <ul
              className="list-disc list-inside text-sm sm:text-base"
              style={{ color: colors.neutralTextColor }}
            >
              {project.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
              style={{ color: colors.activeTextColor }}
            >
              Requirements
            </h2>
            <p
              className="leading-relaxed text-sm sm:text-base"
              style={{ color: colors.neutralTextColor }}
            >
              {project.requirements}
            </p>
          </div>

          {projectFiles.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2
                className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
                style={{ color: colors.activeTextColor }}
              >
                Attached Files
              </h2>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {projectFiles.map((file, index) => (
                  <Button
                    key={index}
                    onClick={() => handleFileDownload(file)}
                    className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 text-white rounded-full transition-colors text-sm sm:text-base ${colors.buttonHover}`}
                    style={{ backgroundColor: colors.accentColor }}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="line-clamp-1">
                      {file.name || `File ${index + 1}`}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Client Review Section */}
          {project.review && (
            <div className="mb-6 sm:mb-8 p-6 rounded-lg border"
              style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
              <h2
                className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2"
                style={{ color: colors.activeTextColor }}
              >
                <Star className="h-5 w-5" style={{ color: colors.iconColor }} />
                Client Review
              </h2>
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-5 w-5 ${
                        index < (project.review?.rating ?? 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.activeTextColor }}
                  >
                    {project.review?.rating}/5
                  </span>
                </div>
                {/* Comment */}
                {project.review?.comment && (
                  <div>
                    <blockquote className="border-l-4 border-yellow-500 pl-4 py-2 bg-gray-100 rounded-r-md">
                      <p
                        className="text-sm italic"
                        style={{ color: colors.neutralTextColor }}
                      >
                        &ldquo;{project.review.comment}&rdquo;
                      </p>
                    </blockquote>
                  </div>
                )}
                {/* Review Date */}
                <p
                  className="text-sm"
                  style={{ color: colors.neutralTextColor }}
                >
                  Reviewed on{" "}
                  {new Date(project.review.reviewedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {isTalent &&
              project.status === "open" &&
              !proposalStatus.hasApplied && (
                <Button
                  onClick={() => setIsApplying(true)}
                  className={`px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-white text-sm sm:text-base ${colors.buttonHover}`}
                  style={{ backgroundColor: colors.accentColor }}
                >
                  Submit Proposal
                </Button>
              )}
            {isTalent &&
              (proposalStatus.status === "accepted" ||
                proposalStatus.status === "revision-requested") &&
              proposalStatus.proposalId && (
                <Button
                  onClick={() => setIsSubmittingDeliverables(true)}
                  className={`px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-white text-sm sm:text-base ${colors.buttonHover}`}
                  style={{ backgroundColor: colors.accentColor }}
                  disabled={project.status !== "in-progress"}
                >
                  {proposalStatus.status === "revision-requested"
                    ? "Resubmit Deliverables"
                    : "Submit Deliverables"}
                </Button>
              )}
            <Button
              onClick={() => router.push("/talent/projects")}
              className={`px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-white text-sm sm:text-base ${colors.buttonHover}`}
              style={{ backgroundColor: colors.accentColor }}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </div>

      {isApplying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 sm:mx-6 lg:mx-8 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <ProposalForm
              projectId={id as string}
              onCancel={handleCancelProposal}
              onSuccess={handleProposalSuccess}
            />
          </div>
        </div>
      )}

      {isSubmittingDeliverables && proposalStatus.proposalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 sm:mx-6 lg:mx-8 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <DeliverableForm
              proposalId={proposalStatus.proposalId}
              onCancel={handleCancelDeliverables}
              onSuccess={handleDeliverableSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}