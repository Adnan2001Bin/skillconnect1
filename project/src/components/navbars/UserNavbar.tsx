"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, Bell, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Images } from "@/lib/images";
import { UserProfileInput } from "@/schemas/profileSchema";
import axios from "axios";
import { toast } from "sonner";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileData, setProfileData] = useState<UserProfileInput | null>(null);
  const lightAccentColor = "#67AE6E";
  const primaryColor = "#328E6E";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const fetchProfile = async () => {
        try {
          const response = await axios.get("/api/profile");
          if (response.data.success) {
            setProfileData(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error fetching profile", {
            description: "Failed to load profile data. Please try again.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        }
      };
      fetchProfile();
    }
  }, [status, session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/home");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/home">
              <Image
                src={Images.logoUser}
                alt="Logo"
                width={100}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 mx-6">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Search talents, services, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-[#4CAF50] focus:ring-[#4CAF50] bg-[#F5F5F5]"
                />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">

            <Link
              href="/talentList"
              
              className="text-gray-700 hover:text-[#4CAF50] px-3 py-2 rounded-md text-sm font-medium"
            >
              Find Talents
            </Link>
            <Link
              href="/projects"
              className="text-gray-700 hover:text-[#4CAF50] px-3 py-2 rounded-md text-sm font-medium"
            >
              Projects
            </Link>
            <Link
              href="/messages"
              className="text-gray-700 hover:text-[#4CAF50] px-3 py-2 rounded-md text-sm font-medium"
            >
              Messages
            </Link>
            
            <Link
              href="/notifications"
              className="text-gray-700 hover:text-[#4CAF50] px-3 py-2 rounded-md"
            >
              <Bell size={20} />
            </Link>

            {/* User Profile / Auth Links */}
            {status === "authenticated" ? (
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {profileData?.profilePicture ? (
                    <Image
                      src={profileData.profilePicture}
                      alt="Profile"
                      width={40}
                      height={40} // Changed height to 40 for a square shape
                      className="rounded-full h-10 w-10 object-cover" // Added w-10 for explicit width and object-cover
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2" // Adjusted size and border
                      style={{
                        backgroundColor: lightAccentColor,
                        borderColor: primaryColor,
                      }}
                    >
                      <User className="h-6 w-6 text-white" />{" "}
                      {/* Adjusted icon size */}
                    </div>
                  )}
                  {/* Dropdown Indicator */}
                  <ChevronDown
                    size={16}
                    className={`text-gray-600 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                    >
                      My Orders
                    </Link>
                    {/* Conditional link based on user role */}

                    <Link
                      href="/client/profile" // Assuming a client profile page
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/wallet"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                    >
                      Wallet/Payments
                    </Link>
                    <Link
                      href="/support"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                    >
                      Help/Support
                    </Link>
                    <div
                      onClick={handleSignOut}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                    >
                      Sign Out
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/sign-in">
                  <Button
                    variant="outline"
                    className="border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Call to Action Button */}
            {status === "authenticated" && (
              <Link href="/post-project">
                <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">
                  "Post a Project"
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3">
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-[#4CAF50] focus:ring-[#4CAF50] bg-[#F5F5F5]"
                />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <Link
              href="/explore"
              className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              Explore
            </Link>
            <Link
              href="/messages"
              className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              Messages
            </Link>
            <Link
              href="/projects"
              className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              My Projects
            </Link>
            <Link
              href="/notifications"
              className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              Notifications
            </Link>

            {/* Mobile Auth Links */}
            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>

                <Link
                  href="/client/profile" // Assuming a client profile page
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                >
                  My Profile
                </Link>

                <Link
                  href="/wallet"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Wallet/Payments
                </Link>
                <Link
                  href="/support"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Help/Support
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
                <Link
                  href="/api/auth/signup"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile Call to Action */}
            {status === "authenticated" && (
              <Link
                href={"/post-project"}
                className="block px-4 py-2 mt-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388E3C]"
                onClick={toggleMenu}
              >
                "Post a Project"
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
