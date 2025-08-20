"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 as Loader, Filter } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { MultiSelect } from "@/components/admin/MultiSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Images } from "@/lib/images";
import { io } from "socket.io-client";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

export default function AdminProjectManagementPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Define color scheme consistent with AdminTalentView
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";

  // Initialize Socket.IO
  useEffect(() => {
    if (!session?.user?._id || session?.user?.role !== "admin") return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session.user._id);
    });

    socket.on("projectStatusUpdated", async (data: { projectId: string; status: string }) => {
      try {
        const response = await axios.get(`/api/projects/${data.projectId}`);
        if (response.data.success) {
          setProjects((prev) =>
            prev.map((project) =>
              project._id === data.projectId ? response.data.data : project
            )
          );
          toast.info("Project Status Updated", {
            description: `Project status changed to ${data.status}.`,
            className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error fetching updated project:", error);
      }
    });

    socket.on("projectDeleted", (data: { projectId: string }) => {
      setProjects((prev) => prev.filter((project) => project._id !== data.projectId));
      toast.info("Project Deleted", {
        description: "A project has been deleted.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("dashboardUpdate", (data: any) => {
      setProjects(data.recentProjects || []);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id, session?.user?.role]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/projects");
        if (response.status !== 200) {
          throw new Error("Failed to fetch projects");
        }
        setProjects(response.data.data);
      } catch (err) {
        setError("Failed to load projects. Please try again later.");
        console.error("Error fetching projects:", err);
        toast.error("Error", {
          description: "Failed to load projects. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchProjects();
    }
  }, [status, session]);

  useEffect(() => {
    const filtered = projects.filter((project) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(project.category);
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(project.status);
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = project.budget >= min && project.budget <= max;

      return matchesCategory && matchesStatus && matchesPrice;
    });
    setFilteredProjects(filtered);
  }, [selectedCategories, selectedStatuses, minPrice, maxPrice, projects]);

  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values);
  };

  const handleStatusChange = (values: string[]) => {
    setSelectedStatuses(values);
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "min" | "max"
  ) => {
    const value = e.target.value;
    if (type === "min") {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await axios.delete(`/api/projects/${projectId}`);
      if (response.data.success) {
        setProjects((prev) => prev.filter((project) => project._id !== projectId));
        toast.success("Project Deleted", {
          description: "The project has been successfully deleted.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to delete project");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete project. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
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
          Loading projects...
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
      <h1
        className="text-4xl font-extrabold mb-8 text-center"
        style={{ color: activeTextColor }}
      >
        <span style={{ color: accentColor }}>Project</span> Management Dashboard
      </h1>

      <div
        className="mb-10 p-6 sm:p-8 rounded-xl shadow-2xl"
        style={{ backgroundColor: secondaryDarkGray }}
      >
        <div className="flex items-center mb-6">
          <Filter className="h-6 w-6 mr-3" style={{ color: accentColor }} />
          <h2 className="text-2xl font-bold" style={{ color: activeTextColor }}>
            Filter Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          <MultiSelect
            name="categoryFilter"
            label="Filter by Category"
            placeholder="Select categories..."
            options={categories.map((cat) => ({
              value: cat.value,
              label: cat.label,
            }))}
            Icon={Filter}
            onChange={handleCategoryChange}
            defaultValue={selectedCategories}
          />
          <MultiSelect
            name="statusFilter"
            label="Filter by Status"
            placeholder="Select statuses..."
            options={statusOptions}
            Icon={Filter}
            onChange={handleStatusChange}
            defaultValue={selectedStatuses}
          />
          <div>
            <label
              className="text-sm font-semibold flex items-center mb-2"
              style={{ color: activeTextColor }}
            >
              <Filter className="h-5 w-5 mr-2" style={{ color: accentColor }} />
              Filter by Price Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => handlePriceChange(e, "min")}
                min="0"
                className="w-1/2 pl-4 pr-2 py-3 rounded-full border-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                  boxShadow: `0 0 0 2px ${accentColor}`,
                }}
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => handlePriceChange(e, "max")}
                min="0"
                className="w-1/2 pl-4 pr-2 py-3 rounded-full border-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                  boxShadow: `0 0 0 2px ${accentColor}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-center mb-6">{error}</p>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
          <p className="ml-3 text-xl" style={{ color: neutralTextColor }}>
            Loading projects...
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <p className="text-center text-xl font-medium" style={{ color: neutralTextColor }}>
          No projects found for the selected criteria.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="p-4 rounded-lg shadow-md border-2"
              style={{
                backgroundColor: "rgba(58, 71, 80, 0.8)",
                borderColor: accentColor,
              }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: activeTextColor }}>
                {project.title}
              </h3>
              <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
                Client ID: {project.clientId}
              </p>
              <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
                Category: {getCategoryLabel(project.category)}
              </p>
              <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
                Budget: ${project.budget.toLocaleString()}
              </p>
              <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
                Timeline: {project.timeline} days
              </p>
              <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </p>
              <Badge className={getStatusBadgeColor(project.status)}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => router.push(`/admin/management/projects/${project._id}`)}
                  className="px-4 py-2 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryDarkGray,
                  }}
                >
                  View Details
                </Button>
                <Button
                  onClick={() => handleDeleteProject(project._id)}
                  variant="outline"
                  className="px-4 py-2 rounded-full font-semibold"
                  style={{
                    borderColor: "#EF4444",
                    color: "#EF4444",
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}