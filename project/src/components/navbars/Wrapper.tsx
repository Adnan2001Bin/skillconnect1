"use client";

import { useSession } from "next-auth/react";
import UserNavbar from "@/components/navbars/UserNavbar";
import TalentLayout from "../talent/TalentLayout";
import AdminLayout from "../admin/AdminLayout";
import { Loader2 as Loader } from "lucide-react";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader className="animate-spin h-10 w-10 text-teal-400 mr-3" />
        <p className="text-gray-100 text-xl font-semibold">
          Loading your portal...
        </p>
      </div>
    );
  }

  const renderContent = () => {
    if (status !== "authenticated") {
      return (
        <>
          <UserNavbar />
          <main>{children}</main>
        </>
      );
    }
    switch (session?.user?.role) {
      case "admin":
        return (
          <AdminLayout>
            <main>{children}</main>
          </AdminLayout>
        );
      case "talent":
        return <TalentLayout>{children}</TalentLayout>;
      case "user":
        return (
          <>
            <UserNavbar />
            <main>{children}</main>
          </>
        );
      default:
        return children;
    }
  };

  return <>{renderContent()}</>;
}
