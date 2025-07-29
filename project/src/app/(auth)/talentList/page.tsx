"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import {
  Briefcase,
  ChartBarStacked,
  Filter,
  Loader,
  ScanSearch,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/userView/MultiSelect";
import TalentCard from "@/components/userView/TalentCard";
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { Images } from "@/lib/images";
import { TalentProfileInput } from "@/schemas/profileSchema";
import { useSession } from "next-auth/react";
import CategoryFilterDisplay from "@/components/userView/CategoryFilterDisplay";
import { Button } from "@/components/ui/button";

interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
  role: "talent";
}

export default function UserTalentView() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get the URLSearchParams object
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#17B169",
    activeTextColor: "#16423C",
    neutralTextColor: "#6A9C89",
    white: "#FFFFFF",
    inputBorderColor: "#16423C",
    errorRed: "#EF4444",
  };

  // Synchronize internal state with URL query parameters
  useEffect(() => {
    const category = searchParams.get("category");
    const services = searchParams.get("services");

    if (category && categories.some((c) => c.value === category)) {
      setCategoryFilter(category);
    } else {
      setCategoryFilter("all"); // Reset if no valid category
    }

    if (services) {
      // Assuming services can be a comma-separated string if multiple are passed
      setServiceFilters(services.split(",").filter(Boolean));
    } else {
      setServiceFilters([]); // Reset if no services
    }
  }, [searchParams.toString()]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTalents();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, router]);

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
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching talents:", error);
      toast.error("Error", {
        description: "An error occurred while fetching talents.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = talents;

    // Filter by category and services
    if (categoryFilter !== "all" && serviceFilters.length > 0) {
      filtered = filtered.filter(
        (talent) =>
          talent.services?.some((service) =>
            serviceFilters.includes(service)
          ) && talent.category === categoryFilter
      );
    } else if (categoryFilter !== "all" && serviceFilters.length === 0) {
      filtered = filtered.filter(
        (talent) => talent.category === categoryFilter
      );
    }

    // Search by query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (talent) =>
          talent.userName.toLowerCase().includes(query) ||
          talent.email.toLowerCase().includes(query) ||
          talent.bio?.toLowerCase().includes(query) ||
          talent.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
          talent.category?.toLowerCase().includes(query) ||
          talent.location?.toLowerCase().includes(query)
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

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center animate-pulse"
        style={{ backgroundColor: colors.primary }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: colors.activeTextColor }}
        >
          Loading talent data...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <p className="text-xl font-bold" style={{ color: colors.errorRed }}>
          Access denied. Please sign in to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-10 mt-2 bg-white">
      <div className="mb-4 flex flex-col items-center">
        <h1
          className="text-4xl sm:text-5xl font-bold mb-8 text-center drop-shadow-lg"
          style={{ color: colors.activeTextColor }}
        >
          Discover Your{" "}
          <span style={{ color: colors.accentColor }}>Talents</span>
        </h1>

        <CategoryFilterDisplay categoryFilter={categoryFilter} />
        
      </div>
      <div
        className="min-h-screen   relative max-w-[94rem] mx-auto rounded-lg overflow-hidden"
        style={{
          backgroundImage: `url(${
            Images.userViewbackground ? Images.userViewbackground.src : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="mb-12 p-6 sm:p-8 rounded-xl shadow-sm shadow-[#16423C]"
          style={{ backgroundColor: "rgba(102, 205, 170, 0.2)" }}
        >
          <div className="flex items-center mb-6 border-b border-[#16423C] pb-4">
            <Filter className="h-7 w-7 mr-3 text-[#16423C]" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#16423C]">
              Filter & Search
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Select */}
            <div className="flex flex-col">
              <label
                htmlFor="category-select"
                className="text-sm font-semibold mb-2 flex"
                style={{ color: colors.activeTextColor }}
              >
                <ChartBarStacked
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                  aria-hidden="true"
                />
                Category
              </label>
              <Select
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setServiceFilters([]);
                }}
                value={categoryFilter} // Ensure controlled component
              >
                <SelectTrigger
                  id="category-select"
                  className="w-full text-base rounded-lg p-3 h-auto border-2 focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.inputBorderColor,
                  }}
                >
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent
                  className="bg-white text-primary rounded-lg shadow-lg border"
                  style={{ borderColor: colors.accentColor }}
                >
                  <SelectItem
                    value="all"
                    className="hover:bg-[#A4CCD9]/30 cursor-pointer p-3"
                  >
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
            </div>

            {/* Services MultiSelect */}
            <MultiSelect
              name="services"
              label="Services"
              placeholder="Select Services"
              options={serviceOptions}
              Icon={Briefcase}
              defaultValue={serviceFilters} // Pass selectedFilters to defaultValue
              onChange={(value: string[]) => setServiceFilters(value)}
            />

            {/* Search Input */}
            <div className="relative col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
              <label
                htmlFor="search-input"
                className="text-sm font-semibold mb-2 flex"
                style={{ color: colors.activeTextColor }}
              >
                <ScanSearch
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                  aria-hidden="true"
                />
                Search
              </label>
              <Input
                id="search-input"
                type="text"
                placeholder="Search by name, email, bio, skills, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[#16423C] px-4 py-3 text-base rounded-lg h-auto border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: colors.white,
                  borderColor: colors.inputBorderColor,
                }}
                aria-label="Search talents"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Display */}

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <Loader
              className="animate-spin h-12 w-12 mb-4"
              style={{ color: colors.accentColor }}
            />
            <p
              className="text-xl font-medium"
              style={{ color: colors.neutralTextColor }}
            >
              Loading talents... Hang tight!
            </p>
          </div>
        ) : filteredTalents.length === 0 ? (
          <div className="text-center py-10">
            <p
              className="text-2xl font-medium"
              style={{ color: colors.neutralTextColor }}
            >
              No talents found matching your criteria.
            </p>
            <p
              className="mt-2 text-lg"
              style={{ color: colors.neutralTextColor }}
            >
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTalents.map((talent) => (
              <TalentCard
                key={talent._id}
                talent={talent}
                accentColor={colors.accentColor}
                activeTextColor={colors.activeTextColor}
                neutralTextColor={colors.neutralTextColor}
                secondaryDarkGray={colors.secondaryDarkGray}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
