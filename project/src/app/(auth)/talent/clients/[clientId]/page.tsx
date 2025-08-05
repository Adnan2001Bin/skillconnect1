
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader, ArrowLeft, User, Mail, Info, Briefcase, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Images } from "@/lib/images";
import Image from "next/image";
import io, { Socket } from "socket.io-client";

interface ClientProfile {
  userName: string;
  email: string;
  role: string;
  bio?: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  senderId: { userName: string };
  receiverId: string;
  content: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
  updatedAt?: string;
}

export default function ClientProfilePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Define color variables to match TalentProfilePage
  const colors = {
    primaryColor: "#8DBCC7",
    secondaryColor: "#A4CCD9",
    accentColor: "#90D1CA",
    lightAccentColor: "#C4E1E6",
    darkTextColor: "#212121",
    grayTextColor: "#757575",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent" && clientId) {
      // Initialize Socket.IO
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection Error", {
          description: "Failed to connect to messaging service.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      socketInstance.on("newMessage", (message: Message) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            console.warn("Duplicate message received:", message._id);
            return prev;
          }
          return [...prev, message];
        });
      });

      socketInstance.on("messages", (fetchedMessages: Message[]) => {
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        );
        setMessages(uniqueMessages);
      });

      socketInstance.on("messageUpdated", (updatedMessage: Message) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
        );
      });

      socketInstance.on("messageDeleted", ({ messageId }: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      });

      socketInstance.on("error", ({ message }) => {
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      // Fetch client profile
      const fetchClientProfile = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/client/profile/${clientId}`);
          if (response.data.success) {
            setClient(response.data.data);
            socketInstance.emit("getMessages", { otherUserId: clientId });
          } else {
            toast.error("Error", {
              description: response.data.message || "Failed to fetch client profile.",
              className: "bg-red-600 text-white border-red-700 bg-opacity-80",
              duration: 4000,
            });
            router.push("/talent/orders");
          }
        } catch (error) {
          console.error("Error fetching client profile:", error);
          toast.error("Error", {
            description: "An error occurred while fetching the client profile.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
          router.push("/talent/orders");
        } finally {
          setIsLoading(false);
        }
      };

      fetchClientProfile();

      return () => {
        socketInstance.disconnect();
      };
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, session, clientId, router]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !client) return;
    socket.emit("sendMessage", {
      receiverId: clientId,
      content: newMessage,
    });
    setNewMessage("");
  };

  // Handle opening the edit message dialog
  const handleOpenEditDialog = (message: Message) => {
    setEditingMessage(message);
    setEditedContent(message.content);
    setIsEditDialogOpen(true);
  };

  // Handle editing a message
  const handleEditMessage = () => {
    if (!editingMessage || !editedContent.trim() || !socket) return;
    socket.emit("editMessage", {
      messageId: editingMessage._id,
      content: editedContent,
    });
    setIsEditDialogOpen(false);
    setEditingMessage(null);
    setEditedContent("");
  };

  // Handle deleting a message
  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", { messageId });
  };

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <Loader className="animate-spin h-12 w-12 mr-4" style={{ color: colors.accentColor }} />
        <p className="text-2xl font-semibold" style={{ color: colors.darkTextColor }}>
          Loading client profile...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as a talent to view client profiles.
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <p className="text-xl font-bold" style={{ color: "#EF4444" }}>
          Client profile not found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-17"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" style={{ borderColor: colors.primaryColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.darkTextColor }}>
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message"
              style={{ borderColor: colors.primaryColor, color: colors.darkTextColor }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              style={{ borderColor: colors.accentColor, color: colors.accentColor }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditMessage}
              disabled={!editedContent.trim()}
              style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" style={{ borderColor: colors.primaryColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.darkTextColor }}>
              Chat with {client.userName}
            </DialogTitle>
          </DialogHeader>
          <div
            className="max-h-96 overflow-y-auto p-4"
            style={{ backgroundColor: colors.lightAccentColor, borderColor: colors.primaryColor }}
            ref={chatContainerRef}
          >
            {messages.length === 0 ? (
              <p style={{ color: colors.grayTextColor }}>No messages yet.</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`mb-4 flex ${message.senderId.userName === session.user.userName ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg shadow-sm ${
                      message.senderId.userName === session.user.userName
                        ? "bg-accent text-dark"
                        : "bg-primary text-dark"
                    }`}
                    style={{
                      backgroundColor:
                        message.senderId.userName === session.user.userName
                          ? colors.accentColor
                          : colors.primaryColor,
                      color: colors.darkTextColor,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold">
                        {message.senderId.userName === session.user.userName ? "You" : message.senderId.userName}
                      </p>
                      {message.senderId.userName === session.user.userName && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(message)}
                            style={{ color: colors.darkTextColor }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message._id)}
                            style={{ color: "#EF4444" }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.updatedAt || message.createdAt).toLocaleTimeString()}
                      {message.updatedAt && message.updatedAt !== message.createdAt && " (Edited)"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 p-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ borderColor: colors.primaryColor, color: colors.darkTextColor }}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Button
            onClick={() => router.push("/talent/orders")}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Orders
          </Button>
          <Button
            onClick={() => setIsChatDialogOpen(true)}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Message Client
          </Button>
        </div>

        <div
          className="rounded-xl shadow-md shadow-[#212121] border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-100 flex flex-col h-full"
          style={{ borderColor: colors.primaryColor, backgroundColor: "rgba(144, 209, 202, 0.2)" }}
        >
          <div className="relative p-6 flex flex-col items-center text-center">
            {/* Profile Image */}
            <div className="flex-shrink-0" style={{ borderColor: colors.accentColor }}>
              {client?.profilePicture ? (
                <Image
                  src={client.profilePicture}
                  alt="Profile Picture"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 shadow-md w-25 h-25"
                  style={{ borderColor: colors.accentColor }}
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md"
                >
                  <Briefcase className="h-16 w-16" style={{ color: colors.darkTextColor }} />
                </div>
              )}
            </div>

            {/* User Name */}
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.darkTextColor }}>
              {client.userName}
            </h3>

            <div
              className="p-6 border-t mt-auto flex flex-col items-center gap-4 w-full"
              style={{ borderColor: colors.primaryColor }}
            >
              <div className="flex items-center text-sm" style={{ color: colors.grayTextColor }}>
                <Mail className="h-4 w-4 mr-2" style={{ color: colors.accentColor }} />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>

              <div className="text-left w-full mt-4">
                <h3 className="text-xl font-bold mb-3 flex items-center" style={{ color: colors.darkTextColor }}>
                  <Info className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                  Bio
                </h3>
                <p className="text-base" style={{ color: colors.grayTextColor }}>
                  {client.bio || "No bio provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
