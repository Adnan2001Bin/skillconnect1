"use client";

import { Images } from "@/lib/images";
import { Search, Menu } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

function TalentNavbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  // Theme colors
  const bgColor = "#212121"; // Matches headerBg in TalentProjectDetailsPage
  const accentColor = "#8DBCC7"; // Primary talent theme color
  const secondaryDarkGray = "#616161"; // Complementary gray
  const hoverColor = "#90D1CA"; // Hover state
  const inputBg = "rgba(141, 188, 199, 0.2)"; // Semi-transparent #8DBCC7

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 h-16 sm:h-20 bg-white">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 md:px-8">
        {/* Mobile Hamburger and Search */}
        <div className="flex items-center w-full lg:hidden">
          <Button
            onClick={toggleSidebar}
            style={{ backgroundColor: secondaryDarkGray, color: "#FFFFFF" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = secondaryDarkGray)}
            aria-label="Toggle sidebar"
            className="mr-2 p-2 sm:p-3 min-w-[44px] min-h-[44px]"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <form className="flex-1 sm:hidden">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-1.5 pr-10 text-sm text-[#212121] rounded-lg focus:outline-none focus:ring-2 shadow-md"
                style={{ backgroundColor: inputBg, borderColor: accentColor, borderWidth: "1px" }}
                aria-label="Search for services or talent"
              />
              <button
                type="submit"
                className="absolute right-2 focus:outline-none"
                style={{ color: accentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = accentColor)}
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
                className="w-full px-4 py-2 sm:py-3 pr-12 text-sm sm:text-base text-[#212121] rounded-lg focus:outline-none focus:ring-2 shadow-md"
                style={{ backgroundColor: inputBg, borderColor: accentColor, borderWidth: "1px" }}
                aria-label="Search for services or talent"
              />
              <button
                type="submit"
                className="absolute right-3 focus:outline-none"
                style={{ color: accentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = accentColor)}
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

export default TalentNavbar;