"use client";

import { useState, useEffect } from "react";
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
  // --- Added new icons ---
  PackageCheck,
  CalendarCheck,
  MessageSquareText,
  Paperclip,
  Download,
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { Images } from "@/lib/images";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectActions from "@/components/userView/ProjectActions";

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
}

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
      return "bg-green-500/80 border-green-400 text-white";
    case "in-progress":
      return "bg-blue-500/80 border-blue-400 text-white";
    case "completed":
      return "bg-emerald-600/80 border-emerald-500 text-white";
    case "cancelled":
      return "bg-red-600/80 border-red-500 text-white";
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

  // Fetch project details and deliverables
  useEffect(() => {
    const fetchProjectAndDeliverables = async () => {
      try {
        setLoading(true);

        // Fetch project details
        const projectResponse = await axios.get(`/api/projects/${id}`);
        if (projectResponse.status !== 200) {
          throw new Error("Failed to fetch project");
        }
        setProject(projectResponse.data.data);

        // Fetch deliverables (from accepted proposal)
        const proposalResponse = await axios.get(`/api/projects/${id}/proposals`);
        if (proposalResponse.status === 200) {
          const deliveredProposal = proposalResponse.data.data.find(
            (proposal: any) => proposal.proposalStatus === "delivered"
          );
          if (deliveredProposal && deliveredProposal.deliverables) {
            setDeliverables({
              files: deliveredProposal.deliverables.files || [],
              note: deliveredProposal.deliverables.note || null,
              submittedAt: deliveredProposal.deliverables.submittedAt || null,
            });
          }
        }
      } catch (err) {
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
    if (id) fetchProjectAndDeliverables();
  }, [id]);

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

  // Handle status update
  const handleStatusUpdate = async (newStatus: "completed" | "cancelled") => {
    try {
      const response = await axios.put(`/api/projects/${id}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setProject((prev) =>
          prev ? ({ ...prev, status: newStatus } as IProject) : null
        );
        toast.success(`Project marked as ${newStatus}.`);
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update project status.");
    }
  };

  // Loading and authentication states
  if (authStatus === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(22, 66, 60, 0.9)" }}
      >
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-white text-lg font-semibold">Loading Project...</p>
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
  const isTalent = session?.user?.role === "talent";
  const isAdmin = session?.user?.role === "admin";

  return (
    <div
      className="min-h-screen py-6 md:py-10 px-4 font-sans"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
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
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
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

            {/* Deliverables --- UPDATED SECTION --- */}
            {(isClient || isAdmin) && deliverables && (
              <div>
                <h2 className="text-xl font-semibold mb-3 border-b-2 border-emerald-500 pb-2 flex items-center gap-3">
                  <PackageCheck className="h-6 w-6 text-emerald-400" />
                  <span>Project Delivery</span>
                </h2>

                {deliverables.files.length > 0 ? (
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
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 md:p-8 border-t border-white/20">
          <ProjectActions
            project={project}
            isClient={isClient}
            isTalent={isTalent}
            isAdmin={isAdmin}
            id={id as string}
            colors={colors}
            handleStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>
    </div>
  );
}