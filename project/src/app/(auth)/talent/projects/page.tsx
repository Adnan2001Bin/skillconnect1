"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { IProject } from "@/models/projects.model";
import ProjectCard from "@/components/talent/projects/ProjectCard";
import { toast } from "sonner";
import Image from "next/image";
import { Images } from "@/lib/images";
import Loader from "@/components/Loader";

export default function TalentProjectsListPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    accentColor: "#8DBCC7",
    activeTextColor: "#212121",
    neutralTextColor: "#757575",
    primary: "#90D1CA",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const response = await axios.get("/api/talent/projects");
          if (response.data.success) {
            setProjects(response.data.data);
          } else {
            throw new Error(
              response.data.message || "Failed to fetch projects"
            );
          }
        } catch (err) {
          setError("Failed to load projects. Please try again later.");
          console.error("Error fetching projects:", err);
          toast.error("Error", {
            description: "Failed to load projects. Please try again.",
            className: "bg-red-700 text-white border-red-800 bg-opacity-80",
            duration: 4000,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <Loader text="Loading projects..." color="#000000" bgColor="#90D1CA" size='large'/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF3E0] px-4">
        <p className="text-red-600 text-base sm:text-lg font-semibold text-center">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FFF3E0] py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 font-sans relative mt-15"
      style={{
        backgroundImage: `url(${
          Images.talentProfileBackground
            ? Images.talentProfileBackground.src
            : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={Images.talentProfileBackground}
          alt="Abstract digital background"
          fill
          style={{ objectFit: "cover" }}
          quality={80}
          className="opacity-40"
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#212121] mb-6 sm:mb-8 text-center sm:text-left">
          Available Projects
        </h1>
        {projects.length === 0 ? (
          <p className="text-[#757575] text-base sm:text-lg text-center">
            No open or in-progress projects available at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
