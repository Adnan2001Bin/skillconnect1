'use client';

import { useSession } from "next-auth/react";
import AdminNavbar from "@/components/navbars/AdminNavbar";
import TalentNavbar from "@/components/navbars/TalentNavbar";
import UserNavbar from "@/components/navbars/UserNavbar";

export default function NavbarWrapper() {
  const { data: session, status } = useSession();

  const renderNavbar = () => {
    if (status !== "authenticated") return null;
    switch (session?.user?.role) {
      case "admin":
        return <AdminNavbar />;
      case "talent":
        return <TalentNavbar />;
      case "user":
        return <UserNavbar />;
      default:
        return null;
    }
  };

  return renderNavbar();
}