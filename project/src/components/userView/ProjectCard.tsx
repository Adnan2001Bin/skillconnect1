"use client";

import { useRouter } from "next/navigation";
import { Briefcase, CalendarDays, DollarSign, Clock } from "lucide-react";
import { IProject } from "@/models/projects.model";
import { categories } from "@/lib/categoriesAndServices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Helper function to get category label
const getCategoryLabel = (categoryValue: string | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

// Define the status badge configuration with explicit variant types
type StatusBadgeConfig = {
  variant: "default" | "destructive" | "secondary" | "outline";
  className: string;
  text: string;
};

const getStatusBadge = (status: string): StatusBadgeConfig => {
  switch (status) {
    case "open":
      return {
        variant: "default",
        className: "bg-green-500 text-white",
        text: "Open",
      };
    case "in-progress":
      return {
        variant: "default",
        className: "bg-blue-500 text-white",
        text: "In Progress",
      };
    case "completed":
      return {
        variant: "default",
        className: "bg-emerald-600 text-white",
        text: "Completed",
      };
    case "cancelled":
      return {
        variant: "destructive",
        className: "bg-red-600 text-white",
        text: "Cancelled",
      };
    default:
      return {
        variant: "secondary",
        className: "bg-gray-500 text-white",
        text: "Unknown",
      };
  }
};

interface ProjectCardProps {
  project: IProject;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const formattedCreatedAt = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const handleCardClick = () => {
    router.push(`/projects/${project._id}`);
  };

  const badgeConfig = getStatusBadge(project.status);

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        <Badge
          variant={badgeConfig.variant} // Use the variant directly from the config
          className={badgeConfig.className} // Use the custom className for additional styling
          style={{ marginBottom: "0.5rem" }}
        >
          {badgeConfig.text}
        </Badge>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {getCategoryLabel(project.category)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{project.timeline} days</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{formattedCreatedAt}</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50">
        <Button
          variant="outline"
          className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/projects/${project._id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}