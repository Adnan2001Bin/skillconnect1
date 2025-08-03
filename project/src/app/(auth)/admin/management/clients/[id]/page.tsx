"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2 as Loader,
  ArrowLeft,
  User,
  Trash2,
  Mail,
  Info,
  Briefcase,
} from "lucide-react";
import { Images } from "@/lib/images";
import Image from "next/image";

interface ClientProfile {
  userName: string;
  email: string;
  role: string;
  bio?: string;
  profilePicture?: string;
}

// Define color scheme consistent with TalentDetailsPage
const primaryDarkGray = "#2D3748";
const secondaryDarkGray = "#4B5B69";
const accentColor = "#A5BFCC";
const activeTextColor = "#FFFFFF";
const neutralTextColor = "#BBBBBB";

export default function AdminClientProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchClientProfile();
    }
  }, [status, id]);

  const fetchClientProfile = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/clients/${id}`);
      if (response.data.success) {
        setClient(response.data.data);
      } else {
        toast.error("Error", {
          description:
            response.data.message || "Failed to fetch client profile.",
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        // router.push("/admin/clients");
      }
    } catch (error) {
      console.error("Error fetching client profile:", error);
      toast.error("Error", {
        description: "An error occurred while fetching the client profile.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      // router.push("/admin/clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/admin/clients`, {
        data: { id },
      });
      if (response.data.success) {
        toast.success("Success", {
          description: "Client deleted successfully.",
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        router.push("/admin/management/clients");
      } else {
        throw new Error(response.data.message || "Failed to delete client.");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to delete client.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: activeTextColor }}
        >
          Loading client profile...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Client profile not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-17"
      style={{
        backgroundColor: primaryDarkGray,
      }}
    >
      <div className="relative z-10">
        <Button
          onClick={() => router.push("/admin/management/clients")}
          className="mb-8 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
          style={{
            backgroundColor: accentColor,
            color: primaryDarkGray,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = secondaryDarkGray)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = accentColor)
          }
        >
          <ArrowLeft className="h-5 w-5 mr-2" style={{ color: primaryDarkGray }} />
          Back to Clients
        </Button>

        <div
          className="rounded-xl shadow-md shadow-[#212121] border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-100 flex flex-col h-full"
          style={{
            borderColor: accentColor,
            backgroundColor: secondaryDarkGray,
          }}
        >
          <div className="relative p-6 flex flex-col items-center text-center">
            {/* Profile Image */}
            <div
              className="flex-shrink-0"
              style={{ borderColor: accentColor }}
            >
              {client?.profilePicture ? (
                <Image
                  src={client.profilePicture}
                  alt="Profile Picture"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 shadow-md w-25 h-25"
                  style={{ borderColor: accentColor }}
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md"
                  style={{ borderColor: accentColor, backgroundColor: primaryDarkGray }}
                >
                  <Briefcase
                    className="h-16 w-16"
                    style={{ color: activeTextColor }}
                  />
                </div>
              )}
            </div>

            {/* User Name and Role */}
            <h3
              className="text-2xl font-bold mt-4"
              style={{ color: activeTextColor }}
            >
              {client.userName}
            </h3>
            <p className="text-lg mt-1" style={{ color: neutralTextColor }}>
              {client.role.charAt(0).toUpperCase() + client.role.slice(1)}
            </p>

            <div
              className="p-6 border-t mt-auto flex flex-col items-center gap-4 w-full"
              style={{ borderColor: accentColor }}
            >
              {/* Email */}
              <div
                className="flex items-center text-base"
                style={{ color: neutralTextColor }}
              >
                <Mail
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>

              {/* Bio */}
              <div className="text-left w-full mt-4">
                <h3
                  className="text-xl font-bold mb-3 flex items-center"
                  style={{ color: activeTextColor }}
                >
                  <Info
                    className="h-5 w-5 mr-2"
                    style={{ color: accentColor }}
                  />
                  Bio
                </h3>
                <p
                  className="text-base"
                  style={{ color: neutralTextColor }}
                >
                  {client.bio || "No bio provided."}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="mt-6 font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                }}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Client
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}