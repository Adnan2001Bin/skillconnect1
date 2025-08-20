"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";
import { Socket, io } from "socket.io-client";

interface Notification {
  id: string;
  message: string;
  orderId?: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsProps {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isMenuOpen?: boolean; // Optional, for mobile menu
  toggleMenu?: () => void; // Optional, for mobile menu
  isMobile?: boolean; // To differentiate desktop vs mobile rendering
}

export default function Notifications({
  session,
  status,
  isMenuOpen = false,
  toggleMenu = () => {},
  isMobile = false,
}: NotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch notifications and set up Socket.IO
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?._id) return;

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

    fetchNotifications();

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      {
        auth: { userId: session.user._id },
      }
    );

    setSocket(socketInstance);

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Connection Error", {
        description: "Failed to connect to notification service.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    });

    socketInstance.on(
      "deliverablesSubmitted",
      (data: { orderId: string; message: string }) => {
        setNotifications((prev) => {
          const exists = prev.some(
            (notif) =>
              notif.orderId === data.orderId && notif.message === data.message
          );
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
            onClick: () => router.push(`/orders/${data.orderId}/deliverables`),
          },
        });
      }
    );

    socketInstance.on(
      "projectStatusUpdated",
      (data: { projectId: string; status: string; message: string }) => {
        setNotifications((prev) => {
          const exists = prev.some(
            (notif) =>
              notif.projectId === data.projectId &&
              notif.message === data.message
          );
          if (exists) return prev;
          return [
            {
              id: `${data.projectId}-${Date.now()}`,
              message: data.message,
              projectId: data.projectId,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...prev.slice(0, 9),
          ];
        });
        toast.info("Project Status Updated", {
          description: data.message,
          className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
          duration: 4000,
          action: {
            label: "View",
            onClick: () => router.push(`/projects/${data.projectId}`),
          },
        });
      }
    );

    return () => {
      socketInstance.disconnect();
    };
  }, [status, session, router]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    try {
      await axios.patch("/api/notifications", { id });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Error", {
        description: "Failed to mark notification as read.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const getNotificationHref = (notif: Notification): string => {
    if (notif.orderId) {
      return `/orders/${notif.orderId}/deliverables`;
    } else if (notif.projectId) {
      return `/projects/${notif.projectId}`;
    }
    return "#";
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  if (status !== "authenticated") {
    return null; // Don't render notifications for unauthenticated users
  }

  return isMobile ? (
    <div className="relative">
      <button
        onClick={toggleNotifications}
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
      {isNotificationsOpen && isMenuOpen && (
        <div className="pl-4 pr-2 py-2 bg-gray-50 rounded-md mt-1 max-h-60 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                href={getNotificationHref(notif)}
                className={`block px-4 py-2 text-sm ${
                  notif.read ? "text-gray-500" : "text-gray-700 font-medium"
                } hover:bg-[#4CAF50] hover:text-white rounded ${
                  !notif.orderId && !notif.projectId
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
                onClick={() => {
                  if (notif.orderId || notif.projectId) {
                    markNotificationAsRead(notif.id);
                    setIsNotificationsOpen(false);
                    toggleMenu();
                  }
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
  ) : (
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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationHref(notif)}
                  className={`block px-4 py-2 text-sm ${
                    notif.read ? "text-gray-500" : "text-gray-700 font-medium"
                  } hover:bg-[#4CAF50] hover:text-white ${
                    !notif.orderId && !notif.projectId
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                  onClick={() => {
                    if (notif.orderId || notif.projectId) {
                      markNotificationAsRead(notif.id);
                      setIsNotificationsOpen(false);
                    }
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
        </div>
      )}
    </div>
  );
}