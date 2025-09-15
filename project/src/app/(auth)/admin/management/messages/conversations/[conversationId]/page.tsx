"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 as Loader, ArrowLeft } from "lucide-react";
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";
import { LeanMessage } from "@/type";

export default function AdminMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<LeanMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Consistent color theme
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const messageBubbleBg = "#4A5568"; // Dark gray for message bubbles
  const deletedMessageBg = "#718096"; // A subtle gray for deleted messages
  const errorColor = "#EF4444";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin" && conversationId) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        socketInstance.emit("getAllMessagesForAdmin", { conversationId });
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection Error", {
          description: "Failed to connect to messaging service.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        setIsLoading(false);
      });

      socketInstance.on("allMessages", (fetchedMessages: LeanMessage[]) => {
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(uniqueMessages);
        setIsLoading(false);
      });

      socketInstance.on("newMessage", (message: LeanMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            console.warn("Duplicate message received:", message._id);
            return prev;
          }
          return [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      });

      socketInstance.on("messageUpdated", (updatedMessage: LeanMessage) => {
        setMessages((prev) =>
          prev
            .map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      });

      socketInstance.on("messageDeleted", ({ messageId }: { messageId: string }) => {
        setMessages((prev) =>
          prev
            .map((m) =>
              m._id === messageId ? { ...m, deletedAt: new Date(), content: "[This message was deleted]" } : m
            )
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      });

      socketInstance.on("error", ({ message }) => {
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        if (message === "Failed to fetch messages for admin") {
          setIsLoading(false);
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session, conversationId]);

  console.log("socket",socket);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-12 w-12 mr-4" style={{ color: accentColor }} />
        <p className="text-2xl font-semibold" style={{ color: activeTextColor }}>
          Loading messages...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-xl font-bold" style={{ color: errorColor }}>
          Access denied. Please sign in as an admin to view messages.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Button
            onClick={() => router.push("/admin/conversations")}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Conversations
          </Button>
        </div>

        <Card
          className="rounded-xl shadow-md border"
          style={{ borderColor: accentColor, backgroundColor: secondaryDarkGray }}
        >
          <CardHeader>
            <CardTitle style={{ color: activeTextColor }}>
              Conversation Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="max-h-[500px] overflow-y-auto p-4 border-t-2"
              style={{ borderColor: accentColor }}
              ref={chatContainerRef}
            >
              {messages.length === 0 ? (
                <p style={{ color: neutralTextColor }}>No messages in this conversation.</p>
              ) : (
                messages.map((message) => {
                  const senderName =
                    typeof message.senderId === "string"
                      ? message.senderId
                      : message.senderId.userName || "Unknown User";
                  const isDeleted = !!message.deletedAt;
                  const messageBgColor = isDeleted ? deletedMessageBg : messageBubbleBg;
                  const messageTextColor = isDeleted ? neutralTextColor : activeTextColor;

                  return (
                    <div key={message._id} className="mb-4">
                      <div
                        className="max-w-xs p-3 rounded-lg shadow-sm"
                        style={{ backgroundColor: messageBgColor }}
                      >
                        <p className="text-sm font-semibold" style={{ color: accentColor }}>
                          {senderName}
                          {isDeleted && <span className="ml-2 italic" style={{ color: neutralTextColor }}>(Deleted)</span>}
                        </p>
                        <p className="text-sm" style={{ color: messageTextColor }}>{message.content}</p>
                        <p className="text-xs mt-1" style={{ color: neutralTextColor }}>
                          {new Date(message.updatedAt || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.updatedAt && message.updatedAt !== message.createdAt && " (Edited)"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}