// app/admin/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import AdminSidebar from "./AdminSidbar";
import { Loader2 as Loader } from "lucide-react";
import AdminNavbar from "../navbars/AdminNavbar";
import { useState } from "react";

interface TalentLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: TalentLayoutProps) {
  const { status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader className="animate-spin h-10 w-10 text-teal-400 mr-3" />
        <p className="text-gray-100 text-xl font-semibold">
          Loading your admin portal...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-500 text-lg font-semibold">
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="fixed z-40 w-[19%] lg:h-screen">
          <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
        <div className="flex-1 lg:ml-64 w-full lg:w-[82%]">
          <AdminNavbar toggleSidebar={toggleSidebar} />
          <main className="">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}