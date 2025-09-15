"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Home,
  SquareChartGantt,
  Eye,
  LogOut,
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

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({
  isOpen,
  toggleSidebar,
}: AdminSidebarProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Define color variables for the dark theme
  const primaryDarkGray = "#2D3748"; // Charcoal
  const secondaryDarkGray = "#4B5B69"; // Slightly lighter dark gray
  const accentColor = "#A5BFCC"; // Teal accent
  const neutralTextColor = "#BBBBBB"; // Light gray for inactive text
  const activeTextColor = "#FFFFFF"; // White for active items

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, href: "/admin/dashboard" },
    {
      name: "Management",
      icon: SquareChartGantt,
      subItems: [
        { name: "User Management", href: "/admin/management/clients" },
        { name: "Talent Management", href: "/admin/management/talents" },
        { name: "Project Management", href: "/admin/management/projects" },
        { name: "Order Management", href: "/admin/management/orders" },
        { name: "Transaction Management", href: "/admin/management/transactions" },
        { name: "Conversations", href: "/admin/management/messages/conversations" }, 
      ],
    },
    { name: "Security & Moderation", icon: Eye, href: "/admin/security" },
  ];

  if (status !== "authenticated") {
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
        } lg:translate-x-0 min-h-screen fixed top-0 left-0 z-40 lg:static transition-transform duration-300 flex flex-col justify-between`}
        style={{ backgroundColor: primaryDarkGray }}
        role="navigation"
        aria-label="Admin Sidebar"
      >
        <div className="p-4 pt-20 lg:pt-3 flex-grow">
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
          <nav className="space-y-3">
            {navItems.map((item) =>
              item.subItems ? (
                <div key={item.name} className="space-y-2">
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg text-left`}
                    style={{ color: neutralTextColor }}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="ml-6 border-l-2">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={toggleSidebar}
                        className={`w-full flex items-center space-x-3 p-2 rounded-r-lg text-left transition-all duration-200`}
                        style={{
                          backgroundColor:
                            pathname === subItem.href
                              ? accentColor
                              : "transparent",
                          color:
                            pathname === subItem.href
                              ? activeTextColor
                              : neutralTextColor,
                          transitionProperty: "background-color, color",
                          transitionDuration: "200ms",
                        }}
                        onMouseEnter={(e) => {
                          if (pathname !== subItem.href) {
                            e.currentTarget.style.backgroundColor =
                              secondaryDarkGray;
                            e.currentTarget.style.color = activeTextColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pathname !== subItem.href) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = neutralTextColor;
                          }
                        }}
                        aria-current={
                          pathname === subItem.href ? "page" : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <hr className="w-3 font-bold" />
                          <span className="font-medium text-sm">
                            {subItem.name}
                          </span>
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
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200`}
                  style={{
                    backgroundColor:
                      pathname === item.href ? accentColor : "transparent",
                    color:
                      pathname === item.href
                        ? activeTextColor
                        : neutralTextColor,
                    transitionProperty: "background-color, color",
                    transitionDuration: "200ms",
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = secondaryDarkGray;
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
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t" style={{ borderColor: secondaryDarkGray }}>
          <Button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg"
            style={{
              backgroundColor: accentColor,
              color: primaryDarkGray,
              fontWeight: "bold",
              transition: "background-color 200ms ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = secondaryDarkGray;
              e.currentTarget.style.color = activeTextColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accentColor;
              e.currentTarget.style.color = primaryDarkGray;
            }}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
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