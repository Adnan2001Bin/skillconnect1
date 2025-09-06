"use client";

import { useRouter } from "next/navigation";
import { IProject } from "@/models/projects.model";
import { Briefcase, CalendarDays, DollarSign, Clock } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: IProject;
}

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

const getPaymentStatusBadgeColor = (paymentStatus?: string) => {
  switch (paymentStatus) {
    case "completed":
      return "bg-green-600 text-white";
    case "failed":
      return "bg-red-600 text-white";
    case "pending":
    default:
      return "bg-yellow-600 text-white";
  }
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  // Format the createdAt date
  const formattedDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCardClick = () => {
    router.push(`/talent/projects/${project._id}`);
  };

  const statusBadgeConfig = getStatusBadge(project.status);
  const paymentStatusColor = getPaymentStatusBadgeColor(project.paymentStatus);

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <div className="p-6 flex flex-col flex-grow">
        {/* Status Badge */}
        <Badge
          variant={statusBadgeConfig.variant}
          className={`${statusBadgeConfig.className} mb-2`}
        >
          {statusBadgeConfig.text}
        </Badge>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {project.title}
        </h3>

        {/* Description (truncated) */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {project.description}
        </p>

        {/* Project Details */}
        <div className="space-y-3 text-sm text-gray-700 mt-auto">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {getCategoryLabel(project.category)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              Budget: ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              Timeline: {project.timeline} days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Posted: {formattedDate}</span>
          </div>
          {project.paymentStatus && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColor}`}>
                Payment {project.paymentStatus.charAt(0).toUpperCase() + project.paymentStatus.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer with View Details Button */}
      <div className="px-6 py-4 bg-gray-50">
        <Button
          variant="outline"
          className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/talent/projects/${project._id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}