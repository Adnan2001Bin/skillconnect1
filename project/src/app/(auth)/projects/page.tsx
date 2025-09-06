// app/projects/page.tsx (or your existing route)
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Filter, Search, ScanSearch, DollarSign } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { MultiSelect } from "@/components/userView/MultiSelect";
import { Images } from "@/lib/images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProjectCard from "@/components/userView/ProjectCard"; // Make sure the import path is correct

// Helper function to get category label from value
const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Define status options for filter
const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ProjectListingPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const accentColor = "#004030"; // Define accent color for consistency

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/projects");
        if (response.status !== 200) throw new Error("Failed to fetch projects");
        
        const projectsData = (response.data.data || []).map((project: any) => ({
          ...project,
          _id: project._id.toString(),
        })) as IProject[];
        setProjects(projectsData);
      } catch (err) {
        setError("Failed to load projects. Please try again later.");
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    if (authStatus === "authenticated") {
      fetchProjects();
    }
  }, [authStatus]);

  // Filter projects based on selected criteria
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(project.category);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(project.status);
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryLabel(project.category).toLowerCase().includes(searchQuery.toLowerCase());
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice = project.budget >= min && project.budget <= max;

    return matchesCategory && matchesStatus && matchesSearch && matchesPrice;
  });

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <p className="text-red-600 text-lg font-semibold">
          Access denied. Please sign in to view projects.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <div
        className="min-h-[24rem] h-auto py-10 px-4 sm:px-6 lg:px-10 flex items-center justify-center text-center"
        style={{
          backgroundImage: `url(${Images.userViewbackground2 ? Images.userViewbackground2.src : ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#16423C]">
            Manage Projects
          </h1>
          <p className="text-lg text-gray-700 mt-4 max-w-2xl mx-auto">
            Track and manage all posted projects in one place.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-50/70">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Redesigned Filter & Search Panel */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 md:p-8 rounded-2xl shadow-lg border border-emerald-200/50 mb-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
                Find Your Next Project ✨
              </h2>
              <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
                Use our advanced filters to search by keyword, category, status, and price.
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by project title, keyword, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base rounded-lg p-3 pl-12 h-14 border-2 focus:ring-2 focus:ring-offset-2 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MultiSelect
                  name="categoryFilter"
                  label="Category"
                  placeholder="Filter by categories..."
                  options={categories.map((cat) => ({ value: cat.value, label: cat.label }))}
                  Icon={Filter}
                  onChange={setSelectedCategories}
                  defaultValue={selectedCategories}
                />
                <MultiSelect
                  name="statusFilter"
                  label="Status"
                  placeholder="Filter by statuses..."
                  options={statusOptions}
                  Icon={Filter}
                  onChange={setSelectedStatuses}
                  defaultValue={selectedStatuses}
                />
                <div>
                  <Label className="text-sm font-semibold mb-2 flex items-center text-gray-700">
                    <DollarSign className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                    Price Range
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                      className="w-1/2 rounded-lg border-2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                      className="w-1/2 rounded-lg border-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-center mb-6">{error}</p>}

          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-xl font-semibold text-gray-700">
              {loading ? "Searching for projects..." : `Showing ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
            </h3>
          </div>

          {/* Conditional Content */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 text-center">
              <Loader2 className="animate-spin h-12 w-12 mb-4" style={{ color: accentColor }} />
              <p className="text-xl font-medium text-gray-700">Loading projects... Hang tight!</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
              <ScanSearch className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-2xl font-semibold text-gray-800">No Projects Found</h3>
              <p className="mt-2 text-md text-gray-500">We couldn't find any projects matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard key={project._id as unknown as string} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}