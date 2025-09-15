"use client";

import { useSession } from "next-auth/react";
import UserNavbar from "@/components/navbars/UserNavbar";
import UserNavbar1 from "@/components/navbars/UserNavbar1"; // Assuming UserNavbar1 exists
import TalentLayout from "../talent/TalentLayout";
import AdminLayout from "../admin/AdminLayout";
import { usePathname } from "next/navigation";
import Footer from "../userView/Footer";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const renderContent = () => {
    if (status !== "authenticated") {
      return (
        <>
          {pathname === "/home" ? <UserNavbar1 /> : <UserNavbar />}
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
            {pathname === "/home" || pathname === "/talentList" || pathname === "/projects" || pathname === "/orders" ? <UserNavbar1 /> : <UserNavbar />}
            <main>{children}</main>
            <Footer />
          </>
        );
      default:
        return children;
    }
  };

  return <>{renderContent()}</>;
}