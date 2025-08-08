"use client";

import { useState, useEffect, useRef } from "react"; // Import useRef
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Filter, Search, Briefcase, CalendarDays } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { IProject } from "@/models/projects.model";
import { MultiSelect } from "@/components/userView/MultiSelect";
import Image from "next/image";
import { Images } from "@/lib/images";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you want to use the Shadcn Input component for consistency
import { Label } from "@/components/ui/label"; // Assuming you want to use the Shadcn Label component for consistency


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

// Hero Section component
const HeroSection = ({ onSearch, onScrollToResults }: { onSearch: (query: string) => void, onScrollToResults: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchQuery);
    onScrollToResults(); 
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-t-lg shadow-md mb-">
      <div className="md:w-1/2 mb-6 md:mb-0">
        <h2 className="text-3xl font-bold text-[#16423C] mb-4">
          Discover Amazing Talent & Projects
        </h2>
        <p className="text-[#6A9C89] mb-6 text-lg">
          Find the perfect freelance services for your projects or showcase your
          skills to potential clients.
        </p>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search for projects, skills, or categories..."
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#17B169] text-[#16423C]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A9C89]"
            size={20}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#17B169] text-white rounded-full px-5 py-2 hover:bg-[#16423C] transition-colors"
          >
            Search
          </button>
        </form>
      </div>
      <div className="md:w-1/2 flex justify-end">
        <Image
          src={Images.postjob}
          alt="Discover Talent"
          style={{ objectFit: "contain" }}
          className="md:w-[80%] rounded-2xl"
        />
      </div>
    </div>
  );
};

export default function ProjectListingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Create a ref for the projects table section
  const projectsTableRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the projects table
  const scrollToProjectsTable = () => {
    if (projectsTableRef.current) {
      projectsTableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/projects");

        if (response.status !== 200) {
          throw new Error("Failed to fetch projects");
        }

        const data = response.data;
        const projectsData = (data.data || []).map((project: any) => ({
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

    fetchProjects();
  }, []);

  // Handle category filter changes
  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values);
  };

  // Handle status filter changes
  const handleStatusChange = (values: string[]) => {
    setSelectedStatuses(values);
  };

  // Handle price range changes
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

  // Handle search query changes from the HeroSection
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  // Filter projects based on selected categories, statuses, price range, and search query
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(project.category);
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(project.status);
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery) ||
      project.description.toLowerCase().includes(searchQuery) ||
      getCategoryLabel(project.category).toLowerCase().includes(searchQuery);
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice = project.budget >= min && project.budget <= max;

    return matchesCategory && matchesStatus && matchesSearch && matchesPrice;
  });

  // Handle loading and authentication states
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F5]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">
          Loading projects...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F5]">
        <p className="text-red-600 text-lg font-semibold">
          Access denied. Please sign in to view projects.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#16423C] mb-8 text-center">
          Explore Projects
        </h1>

        {/* Hero Section - Pass the scroll function */}
        <HeroSection onSearch={handleSearch} onScrollToResults={scrollToProjectsTable} />

        <div
          className="relative max-w-[94rem] mx-auto rounded-b-lg overflow-hidden py-10 px-3"
          style={{
            backgroundImage: `url(${
              Images.userViewbackground ? Images.userViewbackground.src : ""
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row sm:gap-4 max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-0 sm:w-1/3">
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
            </div>
            <div className="mb-4 sm:mb-0 sm:w-1/3">
              <MultiSelect
                name="statusFilter"
                label="Filter by Status"
                placeholder="Select statuses..."
                options={statusOptions}
                Icon={Filter}
                onChange={handleStatusChange}
                defaultValue={selectedStatuses}
              />
            </div>
            <div className="sm:w-1/3">
              <Label className="block text-sm font-semibold text-white mb-2">
                Filter by Price Range
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => handlePriceChange(e, "min")}
                  min="0"
                  className="w-1/2 pl-4 pr-2 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#16423C] text-white"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => handlePriceChange(e, "max")}
                  min="0"
                  className="w-1/2 pl-4 pr-2 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#16423C] text-white"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-center mb-6">{error}</p>}

          {/* Projects Table - Add the ref here */}
          <div ref={projectsTableRef} className="rounded-md border bg-white p-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-10 w-10 text-[#17B169]" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <p className="text-center text-[#6A9C89] text-lg">
                No projects found for the selected criteria.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Project Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">
                        {project.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-[#17B169]" />
                          {getCategoryLabel(project.category)}
                        </div>
                      </TableCell>
                      <TableCell>${project.budget.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${project.status === 'open' ? 'bg-green-100 text-green-800' :
                            project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-[#17B169]" />
                          {new Date(project.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => router.push(`/projects/${project._id}`)}
                          className="bg-[#17B169] hover:bg-[#16423C]"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}