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
import { io } from "socket.io-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TalentProjectsListPage() {
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all"); // Default filter is "all"

  const colors = {
    accentColor: "#8DBCC7",
    activeTextColor: "#212121",
    neutralTextColor: "#757575",
    primary: "#90D1CA",
  };

  // Initialize Socket.IO
  useEffect(() => {
    if (!session?.user?._id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session.user._id);
    });

    socket.on("projectStatusUpdated", (data: { projectId: string; status: string }) => {
      if (data.status === "completed" || data.status === "cancelled") {
        setProjects((prev) => prev.filter((project) => project._id !== data.projectId));
        toast.info("Project Status Updated", {
          description: `A project has been marked as ${data.status}.`,
          className: `bg-${data.status === "completed" ? "green" : "red"}-600 text-white border-${data.status === "completed" ? "green" : "red"}-700 bg-opacity-80`,
          duration: 4000,
        });
      }
    });

    socket.on("paymentStatusUpdated", (data: { projectId: string; paymentStatus: "pending" | "completed" | "failed" }) => {
      setProjects((prev) =>
        prev.map((project) =>
          project._id === data.projectId
            ? { ...project, paymentStatus: data.paymentStatus } as IProject
            : project
        )
      );
      toast.success("Payment Status Updated", {
        description: `Payment status updated to ${data.paymentStatus} for a project.`,
        className: "bg-green-600 text-white border-green-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === "talent") {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const response = await axios.get("/api/talent/projects");
          if (response.data.success) {
            const projectsWithPaymentStatus = response.data.data.map((project: IProject) => ({
              ...project,
              paymentStatus: project.status === "completed" ? "completed" : project.paymentStatus || "pending",
            }));
            setProjects(projectsWithPaymentStatus);
          } else {
            throw new Error(response.data.message || "Failed to fetch projects");
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
  }, [sessionStatus, session]);

  // Filter projects based on the selected status
  const filteredProjects = filter === "all"
    ? projects
    : projects.filter((project) => project.status === filter);

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <Loader text="Loading projects..." color="#000000" bgColor="#90D1CA" size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
        <p className="text-red-600 text-base sm:text-lg font-semibold text-center">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 font-sans relative mt-15"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#212121] text-center sm:text-left">
            Available Projects
          </h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filteredProjects.length === 0 ? (
          <p className="text-[#757575] text-base sm:text-lg text-center">
            No projects available for the selected status.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}