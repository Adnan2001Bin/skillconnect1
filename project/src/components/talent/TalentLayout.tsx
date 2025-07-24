// components/talent/TalentLayout.tsx
"use client";

import { useSession } from "next-auth/react";
import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentNavbar from "@/components/navbars/TalentNavbar";
import { Loader2 as Loader } from "lucide-react";

interface TalentLayoutProps {
  children: React.ReactNode;
}

export default function TalentLayout({ children }: TalentLayoutProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader className="animate-spin h-10 w-10 text-[#FF7043] mr-3" />
        <p className="text-[#212121] text-xl font-semibold">
          Loading your talent portal...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Please sign in as a talent.
        </p>
      </div>
    );
  }

  return (
    <div>
      <TalentNavbar />
      <div className="flex justify-between min-h-screenpx-10">
        <div className=" min-h-screen w-64 fixed mt-23">
          <TalentSidebar />
        </div>
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
