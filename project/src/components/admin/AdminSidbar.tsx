// app/admin/AdminSidebar.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, Home, SquareChartGantt, ChartNoAxesCombined, Eye } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Import useRouter
import Image from "next/image";
import { Images } from "@/lib/images"; // Assuming this path is correct for your project

// Import shadcn/ui Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming this path is correct for your project

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string; // Make href optional for items with subItems
  subItems?: { name: string; href: string }[]; // Add subItems property
}

// Add props for isOpen and toggleSidebar
interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({ isOpen, toggleSidebar }: AdminSidebarProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter(); // Initialize useRouter

  // Define color variables for the dark theme
  const primaryDarkGray = "#2D3748"; // Charcoal
  const secondaryDarkGray = "#4B5B69"; // Slightly lighter dark gray
  const accentColor = "#A5BFCC"; // Teal accent
  const lightBgColor = "#F0F0F0"; // Light gray for contrasts/background
  const neutralTextColor = "#BBBBBB"; // Light gray for inactive text
  const activeTextColor = "#FFFFFF"; // White for active items

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, href: "/admin/dashboard" },
    {
      name: "Management",
      icon: SquareChartGantt,
      // No href for the parent Management item, as it's a dropdown
      subItems: [
        { name: "User Management", href: "/admin/management/users" },
        { name: "Talent Management", href: "/admin/management/talents" },
        { name: "Project Management", href: "/admin/management/projects" },
        { name: "Transaction Management", href: "/admin/management/transactions" },
        { name: "Content Management", href: "/admin/management/content" },
      ],
    },
    { name: "Reports & Analytics", icon: ChartNoAxesCombined, href: "/admin/reports" },
    { name: "Security & Moderation", icon: Eye, href: "/admin/security" },
  ];

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-[18%] min-h-screen fixed top-0 left-0 z-40 lg:static transition-transform duration-300 `}
        style={{ backgroundColor: primaryDarkGray }}
        role="navigation"
        aria-label="Admin Sidebar"
      >
        <div className="p-6 pt-20 lg:pt-6">
          <div className="flex items-center mb-6">
            <Image
              src={Images.logoTalent}
              alt="SkillConnect Logo"
              width={110}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <nav className="space-y-3">
            {navItems.map((item) => (
              item.subItems ? (
                // Render Select component for items with subItems (e.g., Management)
                <Select
                  key={item.name}
                  // Set the value of the Select to the href of the currently active sub-item
                  value={
                    item.subItems.find((sub) => pathname.startsWith(sub.href))
                      ? item.subItems.find((sub) => pathname.startsWith(sub.href))?.href
                      : undefined // No active sub-item, so no default value
                  }
                  onValueChange={(value) => {
                    router.push(value); // Navigate to the selected URL
                    toggleSidebar(); // Close the sidebar on mobile after selection
                  }}
                >
                  <SelectTrigger
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200
                      ${pathname.startsWith("/admin/management") // Check if any management sub-route is active
                        ? `bg-[${accentColor}] text-[${activeTextColor}]`
                        : `bg-transparent text-[${neutralTextColor}] hover:bg-[${secondaryDarkGray}] hover:text-[${activeTextColor}]`
                      }
                    `}
                    style={{
                      backgroundColor: pathname.startsWith("/admin/management") ? accentColor : "transparent",
                      color: pathname.startsWith("/admin/management") ? activeTextColor : neutralTextColor,
                      transitionProperty: "background-color, color",
                      transitionDuration: "200ms",
                    }}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {/* Display the selected value or a placeholder */}
                    <SelectValue placeholder={item.name} />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-lg shadow-lg"
                    style={{ backgroundColor: primaryDarkGray, borderColor: secondaryDarkGray }}
                  >
                    {item.subItems.map((subItem) => (
                      <SelectItem
                        key={subItem.name}
                        value={subItem.href}
                        className={`cursor-pointer text-sm font-medium
                          ${pathname === subItem.href
                            ? `bg-[${accentColor}] text-[${activeTextColor}]`
                            : `bg-[${primaryDarkGray}] text-[${neutralTextColor}] hover:bg-[${secondaryDarkGray}] hover:text-[${activeTextColor}]`
                          }
                        `}
                        style={{
                          backgroundColor: pathname === subItem.href ? accentColor : primaryDarkGray,
                          color: pathname === subItem.href ? activeTextColor : neutralTextColor,
                        }}
                      >
                        {subItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // Render regular Link for other navigation items
                <Link
                  key={item.name}
                  href={item.href!} // Use non-null assertion as href is guaranteed here
                  onClick={toggleSidebar} // Close sidebar on mobile after navigation
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200`}
                  style={{
                    backgroundColor:
                      pathname === item.href ? accentColor : "transparent",
                    color:
                      pathname === item.href ? activeTextColor : neutralTextColor,
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
            ))}
          </nav>
        </div>
      </div>
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={toggleSidebar} // Use the passed toggleSidebar to close
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
}
