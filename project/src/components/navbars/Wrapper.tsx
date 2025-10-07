"use client";

import { useSession } from "next-auth/react";
import UserNavbar from "@/components/navbars/UserNavbar";
import UserNavbar1 from "@/components/navbars/UserNavbar1";
import TalentLayout from "../talent/TalentLayout";
import AdminLayout from "../admin/AdminLayout";
import { usePathname } from "next/navigation";
import Footer from "../userView/Footer";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Common layout for unauthenticated and default cases
  const getPublicLayout = () => (
    <>
      {pathname === "/home" ? <UserNavbar1 /> : <UserNavbar />}
      <main>{children}</main>
      <Footer />
    </>
  );

  const renderContent = () => {
    if (status !== "authenticated") {
      return getPublicLayout();
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
        return getPublicLayout();
    }
  };

  return <>{renderContent()}</>;
}