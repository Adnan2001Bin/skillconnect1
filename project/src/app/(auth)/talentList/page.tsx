"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import {
  Briefcase,
  ChartBarStacked,
  Loader2,
  ScanSearch,
  Search,
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
import Loader from "@/components/Loader";

interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
  role: "talent";
}

// Create a separate component that uses useSearchParams
function TalentListContent() {
  const searchParams = useSearchParams();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { status } = useSession();

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#004030",
    white: "#FFFFFF",
    inputBorderColor: "#16423C",
    errorRed: "#EF4444",
  };

  // Extract search params values
  const categoryParam = searchParams.get("category");
  const servicesParam = searchParams.get("services");

  // Synchronize internal state with URL query parameters
  useEffect(() => {
    if (categoryParam && categories.some((c) => c.value === categoryParam)) {
      setCategoryFilter(categoryParam);
    } else {
      setCategoryFilter("all");
    }

    if (servicesParam) {
      setServiceFilters(servicesParam.split(",").filter(Boolean));
    } else {
      setServiceFilters([]);
    }
  }, [categoryParam, servicesParam]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTalents();
    }
  }, [status]);

  const fetchTalents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/talent");
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

  // Use useMemo for filtered talents
  const filteredTalentsMemo = useMemo(() => {
    let filtered = talents;

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

    return filtered;
  }, [categoryFilter, serviceFilters, searchQuery, talents]);

  useEffect(() => {
    setFilteredTalents(filteredTalentsMemo);
  }, [filteredTalentsMemo]);

  const serviceOptions =
    categoryFilter !== "all"
      ? servicesByCategory[categoryFilter]?.map((service) => ({
          value: service,
          label: service,
        })) || []
      : [];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse bg-emerald-50">
        <Loader
          text="Loading talent data..."
          color="#000000"
          bgColor="#90D1CA"
          size="large"
        />
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
    <div className="min-h-screen">
      {/* Hero section */}
      <div
        className="min-h-[24rem] h-auto font-sans py-10 px-4 sm:px-6 lg:px-10 flex items-center justify-center"
        style={{
          backgroundImage: `url(${
            Images.userViewbackground ? Images.userViewbackground.src : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <CategoryFilterDisplay categoryFilter={categoryFilter} />
      </div>

      <div className="bg-slate-50/70">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 md:p-8 rounded-2xl shadow-lg border border-emerald-200/50 mb-12">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
                Find the Perfect Talent ✨
              </h2>
              <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
                Use our advanced filters to discover professionals by category,
                service, or keywords.
              </p>
            </div>

            {/* Unified Search & Filter Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Category Select */}
                <div className="relative col-span-1 md:col-span-2 border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <ChartBarStacked className="h-5 w-5 text-gray-400" />
                  </div>
                  <Select
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                      setServiceFilters([]);
                    }}
                    value={categoryFilter}
                  >
                    <SelectTrigger className="w-full text-base rounded-none h-16 pl-12 border-none focus:ring-0 bg-transparent text-gray-700 font-medium">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-lg shadow-lg border-gray-200">
                      <SelectItem
                        value="all"
                        className="hover:bg-gray-100 cursor-pointer p-3"
                      >
                        All Categories
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          className="hover:bg-gray-100 cursor-pointer p-3"
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <div className="relative col-span-1 md:col-span-3">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by name, skill, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 px-12 text-base rounded-none border-none focus:ring-0 bg-transparent placeholder-gray-500"
                    aria-label="Search talents"
                  />
                </div>
              </div>

              {/* Services MultiSelect */}
              <div className="mt-4">
                <MultiSelect
                  name="services"
                  placeholder="Filter by specific services..."
                  options={serviceOptions}
                  Icon={Briefcase}
                  defaultValue={serviceFilters}
                  onChange={(value: string[]) => setServiceFilters(value)}
                  label={""}
                />
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-xl font-semibold text-gray-700">
              {isLoading
                ? "Searching for talents..."
                : `Showing ${filteredTalents.length} talent${
                    filteredTalents.length !== 1 ? "s" : ""
                  }`}
            </h3>
          </div>

          {/* Conditional Content */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20 text-center">
              <Loader2
                className="animate-spin h-12 w-12 mb-4"
                style={{ color: colors.accentColor }}
              />
              <p className="text-xl font-medium text-gray-700">
                Loading talents... Hang tight!
              </p>
              <p className="text-gray-500 mt-1">
                Finding the best experts for you.
              </p>
            </div>
          ) : filteredTalents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
              <ScanSearch className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-2xl font-semibold text-gray-800">
                No Talents Found
              </h3>
              <p className="mt-2 text-md text-gray-500">
                {`We couldn't find anyone matching your criteria.`}
              </p>
              <p className="mt-1 text-md text-gray-500">
                Try adjusting your filters or broadening your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTalents.map((talent) => (
                <TalentCard
                  key={talent._id}
                  talent={talent}
                  accentColor={colors.accentColor}
                  activeTextColor="#1F2937"
                  neutralTextColor="#6B7281"
                  secondaryDarkGray={colors.secondaryDarkGray}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function UserTalentView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading talent search...</p>
        </div>
      </div>
    }>
      <TalentListContent />
    </Suspense>
  );
}