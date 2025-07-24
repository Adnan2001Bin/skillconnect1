"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, User, Home, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export default function TalentSidebar() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Define new color variables
  const primaryColor = "#8DBCC7"; // New primary color
  const secondaryColor = "#A4CCD9"; // New secondary color
  const accentColor = "#90D1CA"; // New accent color
  const lightAccentColor = "#C4E1E6"; // New light accent color
  const darkTextColor = "#212121"; // Existing, but good to include for consistency
  const grayTextColor = "#757575"; // Existing, but good to include for consistency

  const navItems: NavItem[] = [
    { name: "Profile", icon: User, href: "/talent/profile" },
    { name: "Dashboard", icon: Home, href: "/talent/dashboard" },
    { name: "Client List", icon: Users, href: "/talent/clients" },
    { name: "Chat", icon: MessageSquare, href: "/talent/chat" },
  ];

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div>
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden p-4 bg-white shadow-md">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block w-64 min-h-screen shadow-lg fixed top-0 left-0 z-20 lg:static lg:h-auto lg:rounded-r-lg transition-transform duration-300`}
        style={{ backgroundColor: lightAccentColor }}
        role="navigation"
        aria-label="Talent Sidebar"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: darkTextColor }}>Talent Hub</h2>
          <nav className="space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 
                  ${
                    pathname === item.href
                      ? "text-white shadow-md"
                      : "text-white" // Set default text to white if not active
                  }`}
                style={{
                  backgroundColor: pathname === item.href ? primaryColor : "transparent",
                  color: pathname === item.href ? "white" : grayTextColor, // Active text white, inactive gray
                  transitionProperty: "background-color, color", // Ensure both properties transition
                  transitionDuration: "200ms",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.backgroundColor = secondaryColor; // Hover for inactive items
                    e.currentTarget.style.color = darkTextColor; // Text color on hover for inactive
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.backgroundColor = "transparent"; // Revert inactive items on leave
                    e.currentTarget.style.color = grayTextColor; // Revert text color for inactive
                  }
                }}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-10 bg-black bg-opacity-30" // Added a subtle overlay for mobile
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
}