"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  SquareChartGantt,
  ChartNoAxesCombined,
  Eye,
  LogOut,
  MessageSquareMore,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Images } from "@/lib/images";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: { name: string; href: string }[];
}

interface TalentSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function TalentSidebar({
  isOpen,
  toggleSidebar,
}: TalentSidebarProps) {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Define color variables for the talent theme
  const primaryDarkGray = "#212121"; // Matches navbar and project details header
  const secondaryDarkGray = "#616161"; // Complementary gray
  const accentColor = "#8DBCC7"; // Primary talent theme color
  const hoverColor = "#90D1CA"; // Hover state
  const neutralTextColor = "#757575"; // Secondary text
  const activeTextColor = "#FFFFFF"; // White for active items

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, href: "/talent/dashboard" },
    { name: "Profile", icon: Home, href: "/talent/profile" },
    {
      name: "Management",
      icon: SquareChartGantt,
      subItems: [
        { name: "Project Management", href: "/talent/projects" },
        { name: "Transaction Management", href: "/talent/transactions" },
        { name: "Content Management", href: "/talent/content" },
      ],
    },
    { name: "Chat", icon: MessageSquareMore, href: "/talent/chat" },
  ];

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/home");
  };

  return (
    <div>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 min-h-screen fixed top-0 left-0 z-40 lg:static w-64 transition-transform duration-300 flex flex-col justify-between bg-white`}
        
        role="navigation"
        aria-label="Talent Sidebar"
      >
        <div className="p-4 pt-20 lg:pt-4 flex-grow">
          <div className="flex items-center mb-6">
            <Image
              src={Images.logoTalent}
              alt="SkillConnect Logo"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <nav className="space-y-2">
            {navItems.map((item) =>
              item.subItems ? (
                <div key={item.name} className="space-y-2">
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg"
                    style={{ color: neutralTextColor }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium text-sm sm:text-base">{item.name}</span>
                  </div>
                  <div className="ml-6 border-l-2" style={{ borderColor: secondaryDarkGray }}>
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={toggleSidebar}
                        className="w-full flex items-center space-x-3 p-2 sm:p-3 rounded-r-lg transition-all duration-200"
                        style={{
                          backgroundColor: pathname === subItem.href ? accentColor : "transparent",
                          color: pathname === subItem.href ? activeTextColor : neutralTextColor,
                        }}
                        onMouseEnter={(e) => {
                          if (pathname !== subItem.href) {
                            e.currentTarget.style.backgroundColor = `rgba(141, 188, 199, 0.2)`;
                            e.currentTarget.style.color = activeTextColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pathname !== subItem.href) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = neutralTextColor;
                          }
                        }}
                        aria-current={pathname === subItem.href ? "page" : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <hr className="w-3" style={{ borderColor: secondaryDarkGray }} />
                          <span className="font-medium text-sm sm:text-base">{subItem.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href!}
                  onClick={toggleSidebar}
                  className="w-full flex items-center space-x-3 p-3 sm:p-4 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: pathname === item.href ? accentColor : "transparent",
                    color: pathname === item.href ? activeTextColor : neutralTextColor,
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = `rgba(141, 188, 199, 0.2)`;
                      e.currentTarget.style.color = activeTextColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = neutralTextColor;
                    }
                  }}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t" style={{ borderColor: secondaryDarkGray }}>
          <Button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 rounded-lg text-sm sm:text-base"
            style={{
              backgroundColor: accentColor,
              color: primaryDarkGray,
              fontWeight: "bold",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor;
              e.currentTarget.style.color = activeTextColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accentColor;
              e.currentTarget.style.color = primaryDarkGray;
            }}
          >
            <LogOut className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
}