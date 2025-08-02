"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader, ArrowLeft, User, Mail, Info, Briefcase } from "lucide-react";
import { Images } from "@/lib/images";
import Image from "next/image";

interface ClientProfile {
  userName: string;
  email: string;
  role: string;
  bio?: string;
  profilePicture?: string;
}

export default function ClientProfilePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define color variables to match TalentProfilePage
  const colors = {
    primaryColor: "#8DBCC7",
    secondaryColor: "#A4CCD9",
    accentColor: "#90D1CA",
    lightAccentColor: "#C4E1E6",
    darkTextColor: "#212121",
    grayTextColor: "#757575",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchClientProfile = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/client/profile/${clientId}`);
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
            router.push("/talent/orders");
          }
        } catch (error) {
          console.error("Error fetching client profile:", error);
          toast.error("Error", {
            description: "An error occurred while fetching the client profile.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
          router.push("/talent/orders");
        } finally {
          setIsLoading(false);
        }
      };
      fetchClientProfile();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, clientId, router]);

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: colors.darkTextColor }}
        >
          Loading client profile...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as a talent to view client profiles.
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Client profile not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
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
      <div className="relative z-10">
        <Button
          onClick={() => router.push("/talent/orders")}
          className="mb-8 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
          style={{
            backgroundColor: colors.accentColor,
            color: colors.darkTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colors.secondaryColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = colors.accentColor)
          }
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </Button>

        <div
          className="rounded-xl shadow-md shadow-[#212121] border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-100 flex flex-col h-full"
          style={{
            borderColor: colors.primaryColor,
            backgroundColor: "rgba(144, 209, 202, 0.2)",
          }}
        >
          <div className="relative p-6 flex flex-col items-center text-center">
            {/* Profile Image */}
            <div
              className="flex-shrink-0"
              style={{ borderColor: colors.accentColor }}
            >
              {client?.profilePicture ? (
              <Image
                src={client.profilePicture}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 shadow-md w-25 h-25"
                style={{ borderColor: colors.accentColor }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md"
                
              >
                <Briefcase
                  className="h-16 w-16"
                  style={{ color: colors.darkTextColor }}
                />
              </div>
            )}
            </div>

            {/* User Name */}
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: colors.darkTextColor }}
            >
              {client.userName}
            </h3>

            <div
              className="p-6 border-t mt-auto flex flex-col items-center gap-4 w-full"
              style={{ borderColor: colors.primaryColor }}
            >
              <div
                className="flex items-center text-sm"
                style={{ color: colors.grayTextColor }}
              >
                <Mail
                  className="h-4 w-4 mr-2"
                  style={{ color: colors.accentColor }}
                />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>

              <div className="text-left w-full mt-4">
                <h3
                  className="text-xl font-bold mb-3 flex items-center"
                  style={{ color: colors.darkTextColor }}
                >
                  <Info
                    className="h-5 w-5 mr-2"
                    style={{ color: colors.accentColor }}
                  />
                  Bio
                </h3>
                <p
                  className="text-base"
                  style={{ color: colors.grayTextColor }}
                >
                  {client.bio || "No bio provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}