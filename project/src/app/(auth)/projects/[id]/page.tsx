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
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { Images } from "@/lib/images";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProjectFile {
  url: string;
  name?: string;
}

// Helper function to get category label from value
const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Helper function to get status badge color
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-[#4CAF50] text-white";
    case "in-progress":
      return "bg-[#0288D1] text-white";
    case "completed":
      return "bg-[#2E7D32] text-white";
    case "cancelled":
      return "bg-[#F44336] text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

export default function ProjectDetailsPage() {
  const { status: authStatus, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    accentColor: "#17B169",
    activeTextColor: "#1B5E20",
    neutralTextColor: "#6A9C89",
    primary: "#E8F5E9",
    buttonHover: "hover:bg-[#2E7D32]",
  };

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/projects/${id}`);
        if (response.status !== 200) {
          throw new Error("Failed to fetch project");
        }
        setProject(response.data.data);
      } catch (err) {
        setError("Failed to load project details. Please try again later.");
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  // Handle file download
  const handleFileDownload = (file: ProjectFile) => {
    try {
      if (!file.url) {
        throw new Error("Invalid file URL");
      }
      window.open(file.url, "_blank");
    } catch (err) {
      toast.error("Error", {
        description: "Failed to open file. The URL may be invalid.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: "completed" | "cancelled") => {
    try {
      const response = await axios.put(`/api/projects/${id}`, { status: newStatus });
      if (response.data.success) {
        setProject((prev) => {
          if (!prev) return null;
          return { ...prev, status: newStatus } as IProject;
        });
        toast.success("Status Updated", {
          description: `Project marked as ${newStatus}.`,
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update project status.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  // Handle loading and authentication states
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">
          Loading project...
        </p>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Please sign in to view project details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-red-600 text-lg font-semibold">
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  // Format dates
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

  const isClient = session?.user?.role === "user" && session?.user?._id === project.clientId;
  const isTalent = session?.user?.role === "talent";
  const isAdmin = session?.user?.role === "admin";

  return (
    <div
      className="min-h-screen bg-[#F5F6F5] py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundImage: `url(${
          Images.postprojectbg ? Images.postprojectbg.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-4xl mx-auto bg-transparent rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#16423C] p-6">
          <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          <div className="flex items-center mt-2 gap-4">
            <p className="text-[#D3F1DF]">{getCategoryLabel(project.category)}</p>
            <Badge className={getStatusBadgeColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#16423C] mb-4">
              Description
            </h2>
            <p className="text-[#6A9C89] leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-[#17B169] mr-2" />
              <div>
                <p className="text-sm font-semibold text-[#16423C]">Budget</p>
                <p className="text-[#6A9C89]">
                  ${project.budget.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-[#17B169] mr-2" />
              <div>
                <p className="text-sm font-semibold text-[#16423C]">Timeline</p>
                <p className="text-[#6A9C89]">{project.timeline} days</p>
              </div>
            </div>
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-[#17B169] mr-2" />
              <div>
                <p className="text-sm font-semibold text-[#16423C]">Category</p>
                <p className="text-[#6A9C89]">
                  {getCategoryLabel(project.category)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 text-[#17B169] mr-2" />
              <div>
                <p className="text-sm font-semibold text-[#16423C]">
                  Posted On
                </p>
                <p className="text-[#6A9C89]">{formattedCreatedAt}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Tag className="h-5 w-5 text-[#17B169] mr-2" />
              <div>
                <p className="text-sm font-semibold text-[#16423C]">Status</p>
                <p className="text-[#6A9C89]">
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#16423C] mb-4">
              Services Required
            </h2>
            <ul className="list-disc list-inside text-[#6A9C89]">
              {project.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#16423C] mb-4">
              Requirements
            </h2>
            <p className="text-[#6A9C89] leading-relaxed">
              {project.requirements}
            </p>
          </div>

          {/* Files */}
          {projectFiles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#1B5E20] mb-4">
                Attached Files
              </h2>
              <div className="flex flex-wrap gap-4">
                {projectFiles.map((file, index) => (
                  <Button
                    key={index}
                    onClick={() => handleFileDownload(file)}
                    className={`flex items-center px-4 py-2 bg-[#17B169] text-white rounded-full ${colors.buttonHover} transition-colors`}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {file.name || `File ${index + 1}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isTalent && project.status === "open" && (
              <Button
                onClick={() => router.push(`/projects/${id}/apply`)}
                className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                style={{ backgroundColor: colors.accentColor, color: colors.primary }}
              >
                Apply Now
              </Button>
            )}
            {(isClient || isAdmin) && project.status === "in-progress" && (
              <Button
                onClick={() => handleStatusUpdate("completed")}
                className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                style={{ backgroundColor: colors.accentColor, color: colors.primary }}
              >
                Mark as Completed
              </Button>
            )}
            {(isClient || isAdmin) && (project.status === "open" || project.status === "in-progress") && (
              <Button
                onClick={() => handleStatusUpdate("cancelled")}
                variant="outline"
                className="px-6 py-2 rounded-full font-semibold"
                style={{ borderColor: colors.accentColor, color: colors.accentColor }}
              >
                Cancel Project
              </Button>
            )}
            {(isClient || isAdmin) && (project.status === "open" || project.status === "in-progress") && (
              <Button
                onClick={() => router.push(`/projects/${id}/proposals`)}
                className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                style={{ backgroundColor: colors.accentColor, color: colors.primary }}
              >
                View Proposals
              </Button>
            )}
            <Button
              onClick={() => router.push("/projects")}
              className="px-6 py-2 rounded-full font-semibold"
              style={{ backgroundColor: colors.accentColor, color: colors.primary }}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}