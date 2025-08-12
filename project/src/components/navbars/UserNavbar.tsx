"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, Bell, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Images } from "@/lib/images";
import { UserProfileInput } from "@/schemas/profileSchema";
import axios from "axios";
import { toast } from "sonner";
import io, { Socket } from "socket.io-client";

interface Notification {
  id: string;
  message: string;
  orderId: string;
  read: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileData, setProfileData] = useState<UserProfileInput | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
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
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
        }
      };

      const fetchNotifications = async () => {
        try {
          const response = await axios.get("/api/notifications");
          if (response.data.success) {
            setNotifications(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
          toast.error("Error fetching notifications", {
            description: "Failed to load notifications. Please try again.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
        }
      };

      fetchProfile();
      fetchNotifications();

      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection Error", {
          description: "Failed to connect to notification service.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      socketInstance.on("deliverablesSubmitted", (data: { orderId: string; message: string }) => {
        setNotifications((prev) => {
          const exists = prev.some((notif) => notif.orderId === data.orderId && notif.message === data.message);
          if (exists) return prev;
          return [
            {
              id: `${data.orderId}-${Date.now()}`,
              message: data.message,
              orderId: data.orderId,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...prev.slice(0, 9),
          ];
        });
        toast.info("New Deliverables", {
          description: data.message,
          className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
          duration: 4000,
          action: {
            label: "View",
            onClick: () => router.push(`/orders/${data.orderId}`),
          },
        });
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    if (isMenuOpen) setIsMenuOpen(false);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isMenuOpen) setIsMenuOpen(false);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    try {
      await axios.patch("/api/notifications", { id });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/home");
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between h-16">
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
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="text-gray-700 hover:text-[#4CAF50] px-3 py-2 rounded-md relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 px-2 py-1 text-xs"
                    style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={`/orders/${notif.orderId}/deliverables`}
                        className={`block px-4 py-2 text-sm ${
                          notif.read ? "text-gray-500" : "text-gray-700 font-medium"
                        } hover:bg-[#4CAF50] hover:text-white`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setIsNotificationsOpen(false);
                        }}
                      >
                        {notif.message}
                        <div className="text-xs text-gray-400">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

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
                    <Link
                      href="/client/profile"
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

            {status === "authenticated" && (
              <Link href="/post-project">
                <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">
                  Post a Project
                </Button>
              </Link>
            )}
          </div>

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

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="mb-4">
              {/* Search input */}
            </form>

            {/* Mobile menu links */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isMenuOpen) return;
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md relative"
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge
                    className="ml-2 px-2 py-1 text-xs"
                    style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
              
              {/* Notification dropdown for mobile */}
              {isNotificationsOpen && isMenuOpen && (
                <div className="pl-4 pr-2 py-2 bg-gray-50 rounded-md mt-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={`/orders/${notif.orderId}/deliverables`}
                        className={`block px-4 py-2 text-sm ${
                          notif.read ? "text-gray-500" : "text-gray-700 font-medium"
                        } hover:bg-[#4CAF50] hover:text-white rounded`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setIsNotificationsOpen(false);
                          setIsMenuOpen(false); // Close mobile menu when notification is clicked
                        }}
                      >
                        {notif.message}
                        <div className="text-xs text-gray-400">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {status === "authenticated" ? (
              <>
                <Link
                  href="/orders"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  My Orders
                </Link>
                <Link
                  href="/client/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#4CAF50] hover:text-white"
                  onClick={toggleMenu}
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
                <div
                  onClick={async () => {
                    await handleSignOut();
                    toggleMenu();
                  }}
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                >
                  Sign Out
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block px-4 py-2 text-gray-700 hover:bg-[#4CAF50] hover:text-white rounded-md"
                  onClick={toggleMenu}
                >
                  Sign Up
                </Link>
              </>
            )}

            {status === "authenticated" && (
              <Link
                href="/post-project"
                className="block px-4 py-2 mt-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#388E3C]"
                onClick={toggleMenu}
              >
                Post a Project
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
