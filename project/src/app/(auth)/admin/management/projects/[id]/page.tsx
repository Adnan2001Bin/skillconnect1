"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  Loader2 as Loader,
  Briefcase,
  CalendarDays,
  DollarSign,
  Clock,
  FileText,
  Tag,
  Edit,
  LayoutList,
} from "lucide-react";
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { Images } from "@/lib/images";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/admin/MultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { io } from "socket.io-client";

interface ProjectFile {
  url: string;
  name?: string;
}

const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-[#34D399] text-white"; // Green
    case "in-progress":
      return "bg-[#3B82F6] text-white"; // Blue
    case "completed":
      return "bg-[#6EE7B7] text-white"; // Light green
    case "cancelled":
      return "bg-[#EF4444] text-white"; // Red
    default:
      return "bg-[#757575] text-white"; // Neutral gray
  }
};

export default function AdminProjectDetailsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<IProject>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define color scheme consistent with AdminTalentView
  const primaryDarkGray = "#2D3748";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";

  // Initialize Socket.IO
  useEffect(() => {
    if (!session?.user?._id || session?.user?.role !== "admin" || !id) return;

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
      "projectStatusUpdated",
      async (data: { projectId: string; status: string }) => {
        if (data.projectId === id) {
          try {
            const response = await axios.get(`/api/projects/${id}`);
            if (response.data.success) {
              setProject(response.data.data);
              setFormData(response.data.data);
              toast.info("Project Status Updated", {
                description: `Project status changed to ${data.status}.`,
                className:
                  "bg-blue-600 text-white border-blue-700 bg-opacity-80",
                duration: 4000,
              });
            }
          } catch (error) {
            console.error("Error fetching updated project:", error);
          }
        }
      }
    );

    socket.on("projectDeleted", (data: { projectId: string }) => {
      if (data.projectId === id) {
        toast.info("Project Deleted", {
          description: "This project has been deleted.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        router.push("/admin/management/projects");
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id, session?.user?.role, id, router]);

  // Fetch project
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/projects/${id}`);
        if (response.status !== 200) {
          throw new Error("Failed to fetch project");
        }
        const projectData = response.data.data;
        setProject(projectData);
        setFormData(projectData);
        setSelectedServices(projectData.services || []);
      } catch (err) {
        setError("Failed to load project details. Please try again later.");
        console.error("Error fetching project:", err);
        toast.error("Error", {
          description: "Failed to load project details. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (id && status === "authenticated" && session?.user?.role === "admin") {
      fetchProject();
    }
  }, [id, status, session]);

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
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handleStatusUpdate = async (
    newStatus: "completed" | "cancelled" | "open"
  ) => {
    try {
      setIsSubmitting(true);
      const response = await axios.put(`/api/projects/${id}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setProject(response.data.data);
        setFormData(response.data.data);
        toast.success("Status Updated", {
          description: `Project marked as ${newStatus}.`,
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        // Emit Socket.IO event
        const socket = io(
          process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
        );
        socket.emit("projectStatusUpdated", {
          projectId: id,
          status: newStatus,
          message: `Project ${response.data.data.title} has been marked as ${newStatus}.`,
        });
        socket.disconnect();
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.log(error);

      toast.error("Error", {
        description: "Failed to update project status.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      setIsSubmitting(true);
      const dataToUpdate = {
        ...formData,
        services: selectedServices,
      };
      const response = await axios.put(`/api/projects/${id}`, dataToUpdate);
      if (response.data.success) {
        const updatedProject = response.data.data;
        setProject(updatedProject);
        setFormData(updatedProject);
        setIsEditing(false);
        toast.success("Project Updated", {
          description: "Project details have been successfully updated.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        // Emit Socket.IO event
        const socket = io(
          process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
        );
        socket.emit("projectStatusUpdated", {
          projectId: id,
          status: updatedProject.status,
          message: `Project ${updatedProject.title} has been updated.`,
        });
        socket.disconnect();
      } else {
        throw new Error(response.data.message || "Failed to update project");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "Failed to update project. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    field: keyof IProject
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof e === "string" ? e : e.target.value,
    }));
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader
          className="animate-spin h-10 w-10 mr-3"
          style={{ color: accentColor }}
        />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>
          Loading project...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader
          className="animate-spin h-10 w-10"
          style={{ color: accentColor }}
        />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-red-600 text-lg font-semibold">
          {error || "Project not found."}
        </p>
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

  const availableServices = formData.category
    ? servicesByCategory[formData.category]?.map((service) => ({
        value: service,
        label: service,
      })) || []
    : [];

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-8 mt-17 relative max-w-7xl mx-auto shadow-xl rounded-lg overflow-hidden border border-gray-900"
      style={{
        backgroundImage: `url(${
          Images.adminViewbackground ? Images.adminViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="max-w-4xl mx-auto rounded-lg shadow-md overflow-hidden"
        style={{ backgroundColor: "rgba(58, 71, 80, 0.8)" }}
      >
        <div className="p-6" style={{ backgroundColor: primaryDarkGray }}>
          <h1 className="text-3xl font-bold" style={{ color: activeTextColor }}>
            {isEditing ? `Edit: ${project.title}` : project.title}
          </h1>
          {!isEditing && (
            <div className="flex items-center mt-2 gap-4">
              <p className="text-sm" style={{ color: neutralTextColor }}>
                {getCategoryLabel(project.category)}
              </p>
              <Badge className={getStatusBadgeColor(project.status)}>
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-8">
          {isEditing ? (
            <>
              <div className="space-y-6">
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Project Title
                  </Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => handleInputChange(e, "title")}
                    style={{
                      backgroundColor: white,
                      borderColor: inputBorderColor,
                      color: primaryDarkGray,
                    }}
                  />
                </div>
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Project Description
                  </Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange(e, "description")}
                    style={{
                      backgroundColor: white,
                      borderColor: inputBorderColor,
                      color: primaryDarkGray,
                    }}
                  />
                </div>
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange(value, "category")
                    }
                  >
                    <SelectTrigger
                      style={{
                        backgroundColor: white,
                        borderColor: inputBorderColor,
                        color: primaryDarkGray,
                      }}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: white,
                        borderColor: inputBorderColor,
                        color: primaryDarkGray,
                      }}
                    >
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <MultiSelect
                  name="services"
                  label="Services"
                  placeholder="Select services..."
                  options={availableServices}
                  Icon={LayoutList}
                  onChange={setSelectedServices}
                  defaultValue={selectedServices}
                />
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Budget (USD)
                  </Label>
                  <Input
                    type="number"
                    value={formData.budget || ""}
                    onChange={(e) => handleInputChange(e, "budget")}
                    style={{
                      backgroundColor: white,
                      borderColor: inputBorderColor,
                      color: primaryDarkGray,
                    }}
                  />
                </div>
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Timeline (days)
                  </Label>
                  <Input
                    type="number"
                    value={formData.timeline || ""}
                    onChange={(e) => handleInputChange(e, "timeline")}
                    style={{
                      backgroundColor: white,
                      borderColor: inputBorderColor,
                      color: primaryDarkGray,
                    }}
                  />
                </div>
                <div>
                  <Label
                    style={{ color: activeTextColor }}
                    className="mb-2 block"
                  >
                    Requirements
                  </Label>
                  <Textarea
                    value={formData.requirements || ""}
                    onChange={(e) => handleInputChange(e, "requirements")}
                    style={{
                      backgroundColor: white,
                      borderColor: inputBorderColor,
                      color: primaryDarkGray,
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryDarkGray,
                  }}
                >
                  {isSubmitting ? (
                    <Loader className="animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  variant="outline"
                  className="px-6 py-2 rounded-full font-semibold"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2
                  className="text-2xl font-semibold mb-4"
                  style={{ color: activeTextColor }}
                >
                  Description
                </h2>
                <p
                  className="leading-relaxed"
                  style={{ color: neutralTextColor }}
                >
                  {project.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center">
                  <DollarSign
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: activeTextColor }}
                    >
                      Budget
                    </p>
                    <p className="text-sm" style={{ color: neutralTextColor }}>
                      ${project.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: activeTextColor }}
                    >
                      Timeline
                    </p>
                    <p className="text-sm" style={{ color: neutralTextColor }}>
                      {project.timeline} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Briefcase
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: activeTextColor }}
                    >
                      Category
                    </p>
                    <p className="text-sm" style={{ color: neutralTextColor }}>
                      {getCategoryLabel(project.category)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarDays
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: activeTextColor }}
                    >
                      Posted On
                    </p>
                    <p className="text-sm" style={{ color: neutralTextColor }}>
                      {formattedCreatedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Tag
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: activeTextColor }}
                    >
                      Client ID
                    </p>
                    <p className="text-sm" style={{ color: neutralTextColor }}>
                      {project.clientId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2
                  className="text-2xl font-semibold mb-4"
                  style={{ color: activeTextColor }}
                >
                  Services Required
                </h2>
                <ul
                  className="list-disc list-inside text-sm"
                  style={{ color: neutralTextColor }}
                >
                  {project.services.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h2
                  className="text-2xl font-semibold mb-4"
                  style={{ color: activeTextColor }}
                >
                  Requirements
                </h2>
                <p
                  className="leading-relaxed"
                  style={{ color: neutralTextColor }}
                >
                  {project.requirements}
                </p>
              </div>

              {projectFiles.length > 0 && (
                <div className="mb-8">
                  <h2
                    className="text-2xl font-semibold mb-4"
                    style={{ color: activeTextColor }}
                  >
                    Attached Files
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {projectFiles.map((file, index) => (
                      <Button
                        key={index}
                        onClick={() => handleFileDownload(file)}
                        className="flex items-center px-4 py-2 rounded-full transition-colors"
                        style={{
                          backgroundColor: accentColor,
                          color: primaryDarkGray,
                        }}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        {file.name || `File ${index + 1}`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryDarkGray,
                  }}
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Project
                </Button>
                {project.status === "in-progress" && (
                  <Button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: accentColor,
                      color: primaryDarkGray,
                    }}
                  >
                    {isSubmitting ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Mark as Completed"
                    )}
                  </Button>
                )}
                {(project.status === "open" ||
                  project.status === "in-progress") && (
                  <Button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={isSubmitting}
                    variant="outline"
                    className="px-6 py-2 rounded-full font-semibold"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    {isSubmitting ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Cancel Project"
                    )}
                  </Button>
                )}
                {project.status === "cancelled" && (
                  <Button
                    onClick={() => handleStatusUpdate("open")}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-full font-semibold transition-colors"
                    style={{
                      backgroundColor: accentColor,
                      color: primaryDarkGray,
                    }}
                  >
                    {isSubmitting ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Reopen Project"
                    )}
                  </Button>
                )}
                <Button
                  onClick={() =>
                    router.push(`/admin/management/projects/${id}/proposals`)
                  }
                  className="px-6 py-2 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryDarkGray,
                  }}
                >
                  View Proposals
                </Button>
                <Button
                  onClick={() => router.push("/admin/management/projects")}
                  className="px-6 py-2 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryDarkGray,
                  }}
                >
                  Back to Projects
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
