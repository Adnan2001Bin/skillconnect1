
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Filter, Search } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import ProjectCard from "@/components/userView/ProjectCard";
import { IProject } from "@/models/projects.model";
import { MultiSelect } from "@/components/userView/MultiSelect";
import Image from "next/image";
import { Images } from "@/lib/images";

// Helper function to get category label from value
const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Hero Section component
const HeroSection = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-lg shadow-md mb-8">
      <div className="md:w-1/2 mb-6 md:mb-0">
        <h2 className="text-3xl font-bold text-[#16423C] mb-4">
          Discover Amazing Talent & Projects
        </h2>
        <p className="text-[#6A9C89] mb-6 text-lg">
          Find the perfect freelance services for your projects or showcase your skills to potential clients.
        </p>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search for projects, skills, or categories..."
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#17B169] text-[#16423C]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6A9C89]" size={20} />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#17B169] text-white rounded-full px-5 py-2 hover:bg-[#16423C] transition-colors"
          >
            Search
          </button>
        </form>
      </div>
      <div className="md:w-1/2 flex justify-end ">
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
  const [searchQuery, setSearchQuery] = useState<string>("");

  const colors = {
    accentColor: "#17B169",
    activeTextColor: "#16423C",
    neutralTextColor: "#6A9C89",
    primary: "#D3F1DF",
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

  // Handle search query changes from the HeroSection
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  // Filter projects based on selected categories AND search query
  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(project.category);
    const matchesSearch = searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery) ||
      project.description.toLowerCase().includes(searchQuery) ||
      getCategoryLabel(project.category).toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  // Handle loading and authentication states
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">Loading projects...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Please sign in to view projects.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-12 px-4 sm:px-6 lg:px-8 font-sans"style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#16423C] mb-8 text-center">
          Explore Projects
        </h1>

        {/* Hero Section */}
        <HeroSection onSearch={handleSearch} />

        {/* Category Filter */}
        <div className="mb-8 max-w-md mx-auto">
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

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-center mb-6">{error}</p>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-10 w-10 text-[#17B169]" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <p className="text-center text-[#6A9C89] text-lg">
            No projects found for the selected criteria.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
