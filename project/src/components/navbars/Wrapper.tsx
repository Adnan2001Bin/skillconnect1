"use client";

import { useSession } from "next-auth/react";
import AdminNavbar from "@/components/navbars/AdminNavbar";
import UserNavbar from "@/components/navbars/UserNavbar";
import TalentLayout from "../talent/TalentLayout";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const renderContent = () => {
    if (status !== "authenticated")
      return (
        <>
          <UserNavbar />
          <main>{children}</main>
        </>
      );
    switch (session?.user?.role) {
      case "admin":
        return (
          <>
            <AdminNavbar />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </>
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
