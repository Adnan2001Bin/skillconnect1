
"use client";

import { useRouter } from "next/navigation";
import { IProject } from "@/models/projects.model";
import { Briefcase, CalendarDays } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";

interface ProjectCardProps {
  project: IProject;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const colors = {
    accentColor: "#8DBCC7", // Primary button and icon color
    activeTextColor: "#212121", // Main text color
    neutralTextColor: "#757575", // Secondary text color
    primary: "#90D1CA", // Button text and hover color
    border: "#90D1CA30", // Border with opacity

  };

  // Format the createdAt date
  const formattedDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const getCategoryLabel = (categoryValue: string | undefined) => {
    if (!categoryValue) return "N/A";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  return (
    <div
      className="rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-101 flex flex-col h-full"
      style={{ backgroundColor: "rgba(141, 188, 199, 0.2)", borderColor: colors.border }}
    >
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-xl font-bold mb-2" style={{ color: colors.activeTextColor }}>
          {project.title}
        </h3>

        {/* Category */}
        <div className="flex items-center text-sm mb-2" style={{ color: colors.neutralTextColor }}>
          <Briefcase className="h-4 w-4 mr-1" style={{ color: colors.accentColor }} />
          <span>{getCategoryLabel(project.category)}</span>
        </div>

        {/* Description (truncated) */}
        <p className="text-sm mb-4 flex-grow" style={{ color: colors.neutralTextColor }}>
          {project.description.length > 100
            ? `${project.description.substring(0, 100)}...`
            : project.description}
        </p>

        {/* Budget and Posted Date */}
        <div className="flex justify-between items-center text-sm mb-4">
          <div className="flex items-center" style={{ color: colors.neutralTextColor }}>
            <span>Budget: ${project.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center" style={{ color: colors.neutralTextColor }}>
            <CalendarDays className="h-4 w-4 mr-1" style={{ color: colors.accentColor }} />
            <span>Posted: {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Footer with View Details Button */}
      <div className="p-6 border-t mt-auto flex justify-center" style={{ borderColor: colors.border }}>
        <button
          className="px-6 py-2 rounded-full font-semibold transition-colors duration-300"
          style={{ backgroundColor: colors.accentColor, color: "#FFFFFF" }}
          onClick={() => router.push(`/talent/projects/${project._id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
