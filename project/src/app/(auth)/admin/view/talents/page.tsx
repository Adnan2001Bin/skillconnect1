"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 as Loader, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { TalentProfileInput } from "@/schemas/profileSchema";
import { MultiSelect } from "@/components/admin/MultiSelect"; // Ensure this import path is correct
import TalentCard from "@/components/admin/TalentCard"; // Ensure this import path is correct

interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
  role: "talent";
}

export default function AdminTalentView() {
  const { status } = useSession();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Define a comprehensive color palette for better control
  const primaryDarkGray = "#2D3748"; // Main background
  const secondaryDarkGray = "#3A4750"; // Card backgrounds, filter panel background
  const accentColor = "#A5BFCC"; // Primary interactive elements, borders
  const activeTextColor = "#E0E0E0"; // Headings, bold text on dark backgrounds
  const neutralTextColor = "#B0B0B0"; // General text on dark backgrounds
  const white = "#FFFFFF"; // For input fields, dropdown backgrounds, text on light backgrounds
  const inputBorderColor = "#667580"; // A slightly softer border for inputs

  useEffect(() => {
    if (status === "authenticated") {
      fetchTalents();
    }
  }, [status]);

  const fetchTalents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/talents");
      if (response.data.success) {
        setTalents(response.data.data);
        setFilteredTalents(response.data.data);
      } else {
        toast.error("Error", {
          description: "Failed to fetch talents.",
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching talents:", error);
      toast.error("Error", {
        description: "An error occurred while fetching talents.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = talents;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((talent) => talent.category === categoryFilter);
    }

    if (serviceFilters.length > 0) {
      filtered = filtered.filter((talent) =>
        talent.services?.some((service) => serviceFilters.includes(service))
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (talent) =>
          talent.userName.toLowerCase().includes(query) ||
          talent.email.toLowerCase().includes(query) ||
          talent.bio?.toLowerCase().includes(query) ||
          talent.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
          talent.category?.toLowerCase().includes(query) || // Added category to search
          talent.location?.toLowerCase().includes(query) // Added location to search
      );
    }

    setFilteredTalents(filtered);
  }, [categoryFilter, serviceFilters, searchQuery, talents]);

  const serviceOptions =
    categoryFilter !== "all"
      ? servicesByCategory[categoryFilter]?.map((service) => ({
          value: service,
          label: service,
        })) || []
      : [];

  // Conditional rendering for loading and authentication status
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <Loader className="animate-spin h-10 w-10 mr-3" style={{ color: accentColor }} />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>
          Loading talent data...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}> {/* Red color for access denied */}
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 md:p-10 lg:p-12" style={{ backgroundColor: primaryDarkGray }}>
      <h1 className="text-4xl font-extrabold mb-8 text-center" style={{ color: activeTextColor }}>
        <span style={{ color: accentColor }}>Talent</span> Management Dashboard
      </h1>

      <div className="mb-10 p-6 sm:p-8 rounded-xl shadow-2xl" style={{ backgroundColor: secondaryDarkGray }}>
        <div className="flex items-center mb-6">
          <Filter className="h-6 w-6 mr-3" style={{ color: accentColor }} />
          <h2 className="text-2xl font-bold" style={{ color: activeTextColor }}>
            Filter and Search Talents
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Category Select */}
          <Select onValueChange={setCategoryFilter} defaultValue="all">
            <SelectTrigger
              className="w-full text-base rounded-lg p-3 h-auto border-2 focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: white,
                borderColor: inputBorderColor,
                color: primaryDarkGray,
                boxShadow: `0 0 0 2px ${accentColor}`,
              }}
            >
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent
              className="bg-white text-primaryDarkGray rounded-lg shadow-lg border"
              style={{ borderColor: accentColor }}
            >
              <SelectItem value="all" className="hover:bg-[#A4CCD9]/30 cursor-pointer p-3">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category.value}
                  value={category.value}
                  className="hover:bg-[#A4CCD9]/30 cursor-pointer p-3"
                >
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Services MultiSelect */}
          <MultiSelect
            name="services"
            label="Services" // Label is now handled by the MultiSelect component
            placeholder="Select Services"
            options={serviceOptions}
            Icon={Filter} // Re-using Filter icon for consistency
            defaultValue={serviceFilters}
            onChange={(value: string[]) => setServiceFilters(value)}
          />

          {/* Search Input */}
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1"> {/* Adjusted span for responsiveness */}
            <label htmlFor="search-input" className="sr-only">Search talents</label>
            <Input
              id="search-input"
              type="text"
              placeholder="Search by name, email, bio, skills, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg h-auto border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: white,
                borderColor: inputBorderColor,
                color: primaryDarkGray,
                boxShadow: `0 0 0 2px ${accentColor}`,
              }}
              aria-label="Search talents"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
          <p className="ml-3 text-xl" style={{ color: neutralTextColor }}>Loading talents...</p>
        </div>
      ) : filteredTalents.length === 0 ? (
        <p className="text-center text-xl font-medium" style={{ color: neutralTextColor }}>
          No talents found matching your criteria. Try adjusting your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Added xl grid */}
          {filteredTalents.map((talent) => (
            <TalentCard
              key={talent._id}
              talent={talent}
              accentColor={accentColor}
              activeTextColor={activeTextColor}
              neutralTextColor={neutralTextColor}
              secondaryDarkGray={secondaryDarkGray}

            />
          ))}
        </div>
      )}
    </div>
  );
}