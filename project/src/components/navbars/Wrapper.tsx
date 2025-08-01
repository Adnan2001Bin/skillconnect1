"use client";

import { useSession } from "next-auth/react";
import UserNavbar from "@/components/navbars/UserNavbar";
import TalentLayout from "../talent/TalentLayout";
import AdminLayout from "../admin/AdminLayout";
import Loader from "../Loader";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();


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
        return (
          <TalentLayout>
            <main>{children}</main>
          </TalentLayout>
        );
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
