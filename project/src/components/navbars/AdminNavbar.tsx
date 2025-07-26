"use client";

import { Images } from "@/lib/images";
import { Search, Menu } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

function AdminNavbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  // Theme colors
  const bgColor = "#2D3748"; // Darker gray for navbar
  const accentColor = "#2DD4BF"; // Teal accent
  const secondaryDarkGray = "#4B5B69"; // Slightly lighter dark gray

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 h-16 sm:h-20" style={{ backgroundColor: bgColor }}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6 md:px-8">
        {/* Mobile Hamburger and Search */}
        <div className="flex items-center w-full sm:hidden">
          <Button
            onClick={toggleSidebar}
            style={{ backgroundColor: secondaryDarkGray, color: "#FFFFFF" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = accentColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = secondaryDarkGray)
            }
            aria-label="Toggle sidebar"
            className="mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <form className="flex-1">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-1.5 pr-10 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 shadow-md text-sm"
                style={{ backgroundColor: "#4A5568", borderColor: accentColor }}
                aria-label="Search for services or talent"
              />
              <button
                type="submit"
                className="absolute right-2 text-gray-400 hover:text-teal-400 focus:outline-none"
                style={{ color: accentColor }}
                aria-label="Submit search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        {/* Desktop Search */}
        <div className="hidden sm:flex items-center justify-center w-full">
          <form className="w-full max-w-md md:max-w-lg lg:max-w-2xl">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for services or talent..."
                className="w-full px-4 py-2 sm:py-3 pr-12 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 shadow-md text-sm sm:text-base"
                style={{ backgroundColor: "#4A5568", borderColor: accentColor }}
                aria-label="Search for services or talent"
              />
              <button
                type="submit"
                className="absolute right-3 text-gray-400 hover:text-teal-400 focus:outline-none"
                style={{ color: accentColor }}
                aria-label="Submit search"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;