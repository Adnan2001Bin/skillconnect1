"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Users, // Icon for Talents
  Briefcase, // Icon for Projects
  MessageSquare, // Icon for Messages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Images } from "@/lib/images";
import { UserProfileInput } from "@/schemas/profileSchema";
import axios from "axios";
import { toast } from "sonner";
import Notifications from "../userView/Notifications";

export default function UserNavbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileData, setProfileData] = useState<UserProfileInput | null>(
    null
  );
  const [isScrolled, setIsScrolled] = useState(false); // State to track scroll position

  const lightAccentColor = "#67AE6E";
  const primaryColor = "#328E6E";

  // Effect to handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      // Set isScrolled to true if user has scrolled more than 10px
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
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

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/home");
  };

  // Conditionally set class names based on isScrolled state
  const navClass = isScrolled
    ? "bg-white shadow-md text-gray-700"
    : "bg-transparent text-white";
  const linkClass = isScrolled
    ? "text-gray-700 hover:text-[#4CAF50]"
    : "text-white hover:text-gray-200";
  const signInButtonClass = isScrolled
    ? "border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white"
    : "border-white text-white hover:bg-white hover:text-gray-900";

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${navClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo */}
          <div className="flex-shrink-0">
            <Link href="/home">
              <Image
                src={isScrolled ? Images.logoUser1 : Images.logoUser} // Conditionally change logo
                alt="Logo"
                width={100}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center Section: Nav Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/talentList"
              className={`${linkClass} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2`}
            >
              <Users size={18} />
              <span>Find Talents</span>
            </Link>
            <Link
              href="/projects"
              className={`${linkClass} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2`}
            >
              <Briefcase size={18} />
              <span>Projects</span>
            </Link>
            <Link
              href="/messages"
              className={`${linkClass} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2`}
            >
              <MessageSquare size={18} />
              <span>Messages</span>
            </Link>
          </div>

          {/* Right Section: Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Notifications session={session} status={status} />
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
                      height={40}
                      className="rounded-full h-10 w-10 object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                      style={{
                        backgroundColor: lightAccentColor,
                        borderColor: primaryColor,
                      }}
                    >
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 text-gray-700">
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm hover:bg-[#4CAF50] hover:text-white"
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/client/profile"
                      className="block px-4 py-2 text-sm hover:bg-[#4CAF50] hover:text-white"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/payments"
                      className="block px-4 py-2 text-sm hover:bg-[#4CAF50] hover:text-white"
                    >
                      Wallet/Payments
                    </Link>
                    <Link
                      href="/support"
                      className="block px-4 py-2 text-sm hover:bg-[#4CAF50] hover:text-white"
                    >
                      Help/Support
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm hover:bg-[#4CAF50] hover:text-white"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/sign-in">
                  <Button variant="outline" className={signInButtonClass}>
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
            {status === "authenticated" && (
              <Link href="/post-project">
                <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">
                  Post a Project
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="focus:outline-none">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (now has a solid bg regardless of scroll) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white text-gray-700 border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
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
            {/* Mobile links now use gray text by default */}
            <Link
              href="/talentList"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              <Users size={20} />
              <span>Find Talents</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              <Briefcase size={20} />
              <span>Projects</span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
              onClick={toggleMenu}
            >
              <MessageSquare size={20} />
              <span>Messages</span>
            </Link>

            <Notifications
              session={session}
              status={status}
              isMenuOpen={isMenuOpen}
              toggleMenu={toggleMenu}
              isMobile={true}
            />
            {status === "authenticated" ? (
              <>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  My Orders
                </Link>
                <Link
                  href="/client/profile"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  My Profile
                </Link>
                <Link
                  href="/payments"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Wallet/Payments
                </Link>
                <Link
                  href="/support"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Help/Support
                </Link>
                <button
                  onClick={async () => {
                    await handleSignOut();
                    toggleMenu();
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                >
                  Sign Out
                </button>
                <Link
                  href="/post-project"
                  className="block text-center mt-2 px-3 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388E3C]"
                  onClick={toggleMenu}
                >
                  Post a Project
                </Link>
              </>
            ) : (
              <div className="pt-2">
                <Link
                  href="/sign-in"
                  className="block text-center px-4 py-2 border border-[#4CAF50] text-[#4CAF50] rounded-md"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block text-center mt-2 px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388E3C]"
                  onClick={toggleMenu}
                >
                  Sign Up
                </Link>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}


