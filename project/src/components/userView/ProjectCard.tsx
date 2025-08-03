"use client";

import { useRouter } from "next/navigation";
import { IProject } from "@/models/projects.model"; // Import the IProject interface
import { Briefcase, CalendarDays } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";

interface ProjectCardProps {
  project: IProject;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const colors = {
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF", // Changed to white
    neutralTextColor: "#FFFFFF", // Changed to white
    primary: "#FFFFFF", // Changed to white
  };

  // Format the createdAt date to a readable format
  const formattedDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
   const getCategoryLabel = (categoryValue: string | undefined) => {
     if (!categoryValue) return "N/A"; // Or handle as desired
     const foundCategory = categories.find(cat => cat.value === categoryValue);
     return foundCategory ? foundCategory.label : categoryValue; 
   };

  return (
    <div
      className="rounded-xl shadow-sm border border-[#16423C] overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-101 flex flex-col h-full"
      style={{ backgroundColor: "rgba(163,209,198, 0.2)" }}
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
      <div className="p-6 border-t mt-auto flex justify-center" style={{ borderColor: colors.accentColor + "30" }}>
        <button
          className="px-6 py-2 rounded-full font-semibold transition-colors duration-300"
          style={{ backgroundColor: colors.accentColor, color: colors.primary }}
          onClick={() => router.push(`/projects/${project._id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}