"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Images } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function TalentNavbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchProfile = async () => {
        try {
          const response = await axios.get("/api/profile");
          if (response.data.success) {
            setProfilePicture(response.data.data.profilePicture || null);
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          toast.error("Error fetching profile", {
            description: "Failed to load profile picture. Using default.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        }
      };
      fetchProfile();
    }
  }, [status, session]);

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/home");
  };

  return (
    <nav className="bg-white shadow-md py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20 fixed top-0 w-full z-30">
      <div className="flex items-center">
        <Image
          src={Images.logoTalent}
          alt="SkillConnect Logo"
          width={110}
          height={40}
          className="object-contain h-10 w-auto"
          priority
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {profilePicture ? (
            <Image
              src={profilePicture}
              alt="Profile Picture"
              width={48}
              height={48}
              className="rounded-full object-cover border-2 border-[#A4CCD9] h-12 w-12"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#A5D6A7] flex items-center justify-center border-2 border-[#4CAF50]">
              <span className="text-[#2E7D32] text-lg font-medium">
                {session?.user?.userName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleSignOut}
          className="bg-[#8DBCC7] hover:bg-[#A4CCD9] text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 flex items-center"
        >
          <LogOut className="h-5 w-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
          <span className="sm:hidden">Logout</span>
        </Button>
      </div>
    </nav>
  );
}