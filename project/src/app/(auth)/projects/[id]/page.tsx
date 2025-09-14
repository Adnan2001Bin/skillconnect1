"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  Loader2,
  Briefcase,
  CalendarDays,
  DollarSign,
  Clock,
  FileText,
  Tag,
  UserCircle,
  PackageCheck,
  CalendarCheck,
  MessageSquareText,
  Paperclip,
  Download,
  RefreshCcw,
  CreditCard,
  Star,
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { Images } from "@/lib/images";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import ProjectActions from "@/components/userView/ProjectActions";
import { io } from "socket.io-client";
import Loader from "@/components/Loader";

// Define interface for project files
interface ProjectFile {
  url: string;
  name?: string;
}

// Define interface for deliverables
interface Deliverable {
  files: string[];
  note: string | null;
  submittedAt: string | null;
  proposalStatus?: string;
  revisionCount?: number;
  revisionNote?: string | null;
}

// Helper function to capitalize the first letter of a string
const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to get category label from value
const getCategoryLabel = (categoryValue: string | undefined | null) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Helper function to get status badge color
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
    case "pending":
      return "bg-green-500/80 border-green-400 text-white";
    case "in-progress":
    case "accepted":
      return "bg-blue-500/80 border-blue-400 text-white";
    case "completed":
    case "delivered":
      return "bg-emerald-600/80 border-emerald-500 text-white";
    case "cancelled":
    case "rejected":
      return "bg-red-600/80 border-red-500 text-white";
    case "revision-requested":
      return "bg-yellow-500/80 border-yellow-400 text-white";
    default:
      return "bg-gray-500/80 border-gray-400 text-white";
  }
};

export default function ProjectDetailsPage() {
  const { status: authStatus, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<IProject | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState<string>("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const colors = {
    primary: "#16423C",
    secondaryDarkGray: "rgba(106,156,137, 0)",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#6A9C89",
    white: "#FFFFFF",
    inputBorderColor: "#6A9C89",
    errorRed: "#EF4444",
  };

  // Initialize Socket.IO and fetch data on component mount
  useEffect(() => {
    if (!id) return;
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated") {
      router.replace("/sign-in");
      return;
    }

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      {
        auth: { userId: session?.user?._id },
      }
    );

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session?.user?._id);
    });

    socket.on(
      "proposalDeliverablesSubmitted",
      (data: {
        proposalId: string;
        projectId: string;
        message: string;
        projectStatus: string;
      }) => {
        if (data.projectId === id) {
          setProject((prev) =>
            prev ? ({ ...prev, status: data.projectStatus } as IProject) : null
          );
          toast.success("Project Status Updated", {
            description: `The project has been marked as ${data.projectStatus}.`,
            className: "bg-green-600 text-white border-green-700 bg-opacity-80",
            duration: 4000,
          });
        }
      }
    );

    socket.on(
      "revisionRequested",
      (data: {
        proposalId: string;
        projectId: string;
        revisionCount: number;
        revisionNote: string;
      }) => {
        if (data.projectId === id) {
          setDeliverables((prev) =>
            prev
              ? {
                  ...prev,
                  proposalStatus: "revision-requested",
                  revisionCount: data.revisionCount,
                  revisionNote: data.revisionNote,
                }
              : null
          );
          toast.info("Revision Requested", {
            description: "A revision has been requested for the deliverables.",
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
          toast.success("Project Status Updated", {
            description: `The project has been marked as ${data.status}.`,
            className: "bg-green-600 text-white border-green-700 bg-opacity-80",
            duration: 4000,
          });
        }
      }
    );

    socket.on(
      "paymentStatusUpdated",
      (data: { projectId: string; paymentStatus: string }) => {
        if (data.projectId === id) {
          setProject((prev) =>
            prev
              ? ({ ...prev, paymentStatus: data.paymentStatus } as IProject)
              : null
          );
          toast.success("Payment Status Updated", {
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

    const fetchProjectAndDeliverables = async () => {
      try {
        setLoading(true);
        const [projectResponse, proposalResponse] = await Promise.all([
          axios.get(`/api/projects/${id}`),
          axios.get(`/api/projects/${id}/proposals`),
        ]);

        if (projectResponse.status !== 200) {
          throw new Error("Failed to fetch project");
        }
        const projectData = projectResponse.data.data;
        setProject(projectData);

        if (proposalResponse.status === 200) {
          const relevantProposal = proposalResponse.data.data.find(
            (proposal: any) =>
              proposal.proposalStatus === "delivered" ||
              proposal.proposalStatus === "accepted" ||
              proposal.proposalStatus === "revision-requested"
          );
          if (relevantProposal) {
            setDeliverables({
              files: relevantProposal.deliverables?.files || [],
              note: relevantProposal.deliverables?.note || null,
              submittedAt: relevantProposal.deliverables?.submittedAt || null,
              proposalStatus: relevantProposal.proposalStatus || "unknown",
              revisionCount: relevantProposal.revisionCount || 0,
              revisionNote: relevantProposal.revisionNote || null,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load project details. Please try again later.");
        toast.error("Error", {
          description: "Failed to load project details.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndDeliverables();

    return () => {
      socket.disconnect();
    };
  }, [id, authStatus, router, session?.user?._id]);

  // Handle file download
  const handleFileDownload = (file: ProjectFile | string) => {
    try {
      const url = typeof file === "string" ? file : file.url;
      if (!url) throw new Error("Invalid file URL");
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Failed to open file. The URL may be invalid.");
    }
  };

  // Handle status update with validation
  const handleStatusUpdate = async (
    newStatus: "completed" | "cancelled",
    reviewData?: { rating: number; comment: string }
  ) => {
    try {
      if (
        newStatus === "completed" &&
        (!deliverables ||
          (deliverables.proposalStatus !== "delivered" &&
            deliverables.proposalStatus !== "revision-requested"))
      ) {
        throw new Error(
          "Cannot mark project as completed without delivered or revision-requested deliverables."
        );
      }

      const response = await axios.put(`/api/projects/${id}`, {
        status: newStatus,
        paymentStatus: newStatus === "completed" ? "completed" : undefined,
        ...(reviewData && {
          review: { ...reviewData, reviewedAt: new Date().toISOString() },
        }),
      });

      if (response.data.success) {
        setProject((prev) =>
          prev
            ? ({
                ...prev,
                status: newStatus,
                paymentStatus:
                  newStatus === "completed" ? "completed" : prev.paymentStatus,
                review: reviewData
                  ? { ...reviewData, reviewedAt: new Date().toISOString() }
                  : prev.review,
              } as unknown as IProject)
            : null
        );
        toast.success(
          `Project marked as ${newStatus}${reviewData ? " with review" : ""}.`
        );
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update project status."
      );
    }
  };

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    if (!deliverables || !project) return;

    try {
      setIsInitiatingPayment(true);
      const proposalResponse = await axios.get(`/api/projects/${id}/proposals`);
      const acceptedProposal = proposalResponse.data.data.find(
        (proposal: any) => proposal.proposalStatus === "accepted"
      );

      if (!acceptedProposal) {
        throw new Error("No accepted proposal found for payment");
      }

      const response = await axios.post(`/api/payments/initiate-project`, {
        projectId: id,
        amount: project.budget,
        proposalId: acceptedProposal._id,
      });

      if (response.data.success && response.data.gatewayPageURL) {
        window.location.href = response.data.gatewayPageURL;
      } else {
        throw new Error(response.data.message || "Failed to initiate payment");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate payment."
      );
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  // Handle revision request
  const handleRequestRevision = async () => {
    if (
      !deliverables ||
      !deliverables.proposalStatus ||
      deliverables.revisionCount === undefined
    )
      return;

    try {
      setIsRequestingRevision(true);
      const proposalResponse = await axios.get(`/api/projects/${id}/proposals`);
      const relevantProposal = proposalResponse.data.data.find(
        (proposal: any) =>
          proposal.proposalStatus === "delivered" ||
          proposal.proposalStatus === "revision-requested"
      );

      if (!relevantProposal) {
        throw new Error("No relevant proposal found for revision");
      }

      const response = await axios.post(
        `/api/proposals/${relevantProposal._id}/request-revision`,
        {
          revisionNote,
        }
      );

      if (response.data.success) {
        setDeliverables((prev) =>
          prev
            ? {
                ...prev,
                proposalStatus: "revision-requested",
                revisionCount: (prev.revisionCount || 0) + 1,
                revisionNote,
              }
            : null
        );
        setRevisionNote("");
        toast.success("Revision Requested", {
          description: "Your revision request has been sent to the talent.",
          className: "bg-yellow-600 text-white border-yellow-700 bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to request revision");
      }
    } catch (error) {
      toast.error("Failed to request revision. Please try again.");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse bg-emerald-50">
        <Loader
          text="Loading Project Details"
          color="#000000"
          bgColor="#90D1CA"
          size="large"
        />
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#16423C]">
        <p className="text-red-400 text-base font-semibold">
          Access denied. Please sign in to view project details.
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#16423C]">
        <p className="text-red-400 text-base font-semibold">
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  const formattedCreatedAt = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const projectFiles: ProjectFile[] = (project.files || []).map((file) =>
    typeof file === "string" ? { url: file } : file
  );

  const isClient =
    session?.user?.role === "user" && session?.user?._id === project.clientId;

  return (
    <div
      className="min-h-screen py-6 md:py-10 px-4 font-sans"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground1 ? Images.userViewbackground1.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="max-w-5xl mx-auto rounded-lg shadow-2xl overflow-hidden
                           border border-white/20 bg-black/20 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#16423C] to-[#1a534a] px-4 md:px-6 py-4 md:py-5 border-b border-white/20">
          <Badge
            variant="outline"
            className={getStatusBadgeColor(project.status)}
          >
            {capitalize(project.status)}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
            {project.title}
          </h1>
          <p className="text-base text-emerald-300 mt-2">
            {getCategoryLabel(project.category)}
          </p>
        </div>

        {/* Content Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-8 text-white">
            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b-2 border-emerald-500 pb-2">
                Project Description
              </h2>
              <p className="leading-relaxed text-sm text-gray-200">
                {project.description}
              </p>
            </div>
            {/* Services */}
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b-2 border-emerald-500 pb-2">
                Services Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.services.map((service, index) => (
                  <Badge
                    key={index}
                    className="text-sm bg-white/10 text-emerald-300 border border-emerald-500/50"
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b-2 border-emerald-500 pb-2">
                Requirements
              </h2>
              <p className="leading-relaxed text-sm text-gray-200">
                {project.requirements}
              </p>
            </div>
            {/* Files */}
            {projectFiles.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 border-b-2 border-emerald-500 pb-2">
                  Attached Files
                </h2>
                <div className="flex flex-wrap gap-3">
                  {projectFiles.map((file, index) => (
                    <Button
                      key={index}
                      onClick={() => handleFileDownload(file)}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-emerald-500/50 text-white hover:bg-emerald-500/20 hover:text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {file.name || `File ${index + 1}`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {/* Deliverables and Payment */}
            {isClient && (
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-emerald-500 pb-2">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <PackageCheck className="h-6 w-6 text-emerald-400" />
                    <span>Project Delivery</span>
                  </h2>
                  {deliverables?.proposalStatus && (
                    <Badge
                      variant="outline"
                      className={getStatusBadgeColor(
                        deliverables.proposalStatus
                      )}
                    >
                      {capitalize(deliverables.proposalStatus)}
                    </Badge>
                  )}
                </div>

                {/* Payment Initiation */}
                {isClient &&
                  deliverables?.proposalStatus === "accepted" &&
                  project.paymentStatus === "pending" && (
                    <div className="mt-4 p-5 rounded-lg bg-emerald-900/30 border border-emerald-500/50 shadow-lg">
                      <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-400" />
                        Initiate Payment
                      </h3>
                      <p className="text-sm text-gray-300 mb-4">
                        The proposal has been accepted. Please initiate the
                        payment of ${project.budget.toLocaleString()} to proceed.
                      </p>
                      <Button
                        onClick={handleInitiatePayment}
                        disabled={isInitiatingPayment}
                        className="bg-[#17B169] hover:bg-[#14995a] text-white"
                      >
                        {isInitiatingPayment ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Pay Now
                      </Button>
                    </div>
                  )}

                {deliverables && deliverables.files.length > 0 ? (
                  <div className="mt-4 p-5 rounded-lg bg-emerald-900/30 border border-emerald-500/50 shadow-lg space-y-6">
                    {/* Submission Date */}
                    {deliverables.submittedAt && (
                      <div className="flex items-center text-sm text-gray-300 border-b border-white/10 pb-4">
                        <CalendarCheck className="h-5 w-5 mr-3 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-white">
                            Submitted On
                          </p>
                          <p>
                            {new Date(
                              deliverables.submittedAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Note from Talent */}
                    {deliverables.note && (
                      <div>
                        <h3 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                          <MessageSquareText className="h-5 w-5 text-emerald-400" />
                          Note from Talent
                        </h3>
                        <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 bg-black/20 rounded-r-md">
                          <p className="text-sm text-gray-200 italic">
                            &ldquo;{deliverables.note}&rdquo;
                          </p>
                        </blockquote>
                      </div>
                    )}

                    {/* Revision Note */}
                    {deliverables.revisionNote && (
                      <div>
                        <h3 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                          <MessageSquareText className="h-5 w-5 text-yellow-400" />
                          Revision Request Note
                        </h3>
                        <blockquote className="border-l-4 border-yellow-500 pl-4 py-2 bg-black/20 rounded-r-md">
                          <p className="text-sm text-gray-200 italic">
                            &ldquo;{deliverables.revisionNote}&rdquo;
                          </p>
                        </blockquote>
                      </div>
                    )}

                    {/* File List */}
                    <div>
                      <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-emerald-400" />
                        Submitted Files
                      </h3>
                      <ul className="space-y-2">
                        {deliverables.files.map((fileUrl, index) => {
                          const fileName =
                            fileUrl.split("/").pop()?.split("?")[0] ||
                            `Deliverable ${index + 1}`;
                          return (
                            <li
                              key={index}
                              className="flex items-center justify-between p-3 rounded-md bg-black/20 hover:bg-black/40 transition-colors duration-200"
                            >
                              <div className="flex items-center gap-3 truncate">
                                <FileText className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <span
                                  className="text-sm text-gray-200 truncate"
                                  title={decodeURIComponent(fileName)}
                                >
                                  {decodeURIComponent(fileName)}
                                </span>
                              </div>
                              <Button
                                onClick={() => handleFileDownload(fileUrl)}
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-white hover:bg-emerald-500/30 flex-shrink-0"
                                aria-label={`Download ${decodeURIComponent(
                                  fileName
                                )}`}
                              >
                                <Download className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">
                                  Download
                                </span>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Revision Request Section */}
                    {isClient &&
                      deliverables.proposalStatus === "delivered" &&
                      (deliverables.revisionCount || 0) < 2 && (
                        <div>
                          <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5 text-yellow-400" />
                            Request Revision (
                            {2 - (deliverables.revisionCount || 0)} attempts
                            remaining)
                          </h3>
                          <Textarea
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                            placeholder="Provide feedback for the revision..."
                            className="mb-3 bg-white/10 border-emerald-500/50 text-white placeholder-gray-400"
                          />
                          <Button
                            onClick={handleRequestRevision}
                            disabled={
                              isRequestingRevision || !revisionNote.trim()
                            }
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            {isRequestingRevision ? (
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            ) : (
                              <RefreshCcw className="h-4 w-4 mr-2" />
                            )}
                            Request Revision
                          </Button>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="mt-4 p-6 rounded-lg bg-white/5 border border-white/20 text-center">
                    <p className="text-sm text-gray-300">
                      No deliverables have been submitted for this project yet.
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Review Section */}
            {project.review && (
              <div className="mt-6 p-6 rounded-lg bg-emerald-900/30 border border-emerald-500/50">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-400" />
                  Client Review
                </h3>
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
                    <span className="text-white font-semibold">
                      {project.review?.rating}/5
                    </span>
                  </div>
                  {/* Comment */}
                  {project.review?.comment && (
                    <div>
                      <p className="text-white text-sm italic">
                        "{project.review.comment}"
                      </p>
                    </div>
                  )}
                  {/* Review Date */}
                  <p className="text-emerald-300 text-xs">
                    Reviewed on{" "}
                    {new Date(project.review.reviewedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-6">
            <div className="p-5 rounded-lg bg-white/10 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Project Details
              </h3>
              <ul className="space-y-3 text-sm text-white">
                <li className="flex items-start">
                  <DollarSign className="h-4 w-4 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Budget</span>
                    <p className="text-gray-300">
                      ${project.budget.toLocaleString()}
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Timeline</span>
                    <p className="text-gray-300">{project.timeline} days</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CalendarDays className="h-4 w-4 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Posted On</span>
                    <p className="text-gray-300">{formattedCreatedAt}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CreditCard className="h-4 w-4 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Payment Status</span>
                    <p className="text-gray-300">
                      {project.paymentStatus ? capitalize(project.paymentStatus) : "N/A"}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 md:p-8 border-t border-white/20">
          <ProjectActions
            project={project}
            isClient={isClient}
            id={id as string}
            deliverables={deliverables}
            colors={colors}
            handleStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>
    </div>
  );
}