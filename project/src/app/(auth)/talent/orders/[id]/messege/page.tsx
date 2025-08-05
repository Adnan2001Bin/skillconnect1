"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { Loader2 as Loader, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Images } from "@/lib/images";

interface Message {
  _id: string;
  orderId: string;
  senderId: { _id: string; userName: string };
  receiverId: { _id: string; userName: string };
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const { orderId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Color scheme consistent with AdminDashboardPage
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to messaging service.");
        toast.error("Connection Error", {
          description: "Failed to connect to messaging service. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      socketInstance.emit("joinOrderRoom", { orderId });

      socketInstance.on("messages", (data: Message[]) => {
        setMessages(data);
        setLoading(false);
      });

      socketInstance.on("newMessage", (message: Message) => {
        setMessages((prev) => [...prev, message]);
        if (message.receiverId._id === session.user._id) {
          toast.info("New Message", {
            description: `New message from ${message.senderId.userName}`,
            className: "bg-blue-600 text-white border-blue-700 bg-opacity-80",
            duration: 3000,
          });
        }
      });

      return () => {
        socketInstance.emit("leaveOrderRoom", { orderId });
        socketInstance.disconnect();
      };
    }
  }, [status, session, orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!socket || !session?.user) return;

    try {
      socket.emit("sendMessage", {
        orderId,
        senderId: session.user._id,
        content: newMessage,
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Error", {
        description: "Failed to send message. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-10 w-10 mr-3" style={{ color: accentColor }} />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>
          Loading messages...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>
          Please sign in to view messages.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-13 mt-17 relative max-w-7xl mx-auto"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center" style={{ color: activeTextColor }}>
          <span style={{ color: accentColor }}>Order</span> Messages
        </h1>

        {error && (
          <div className="flex items-center text-red-600 mb-6">
            <MessageSquare className="h-6 w-6 mr-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        <Card className="rounded-lg shadow-md border-2" style={{ backgroundColor: secondaryDarkGray, borderColor: accentColor }}>
          <CardHeader>
            <CardTitle style={{ color: activeTextColor }}>
              Conversation for Order #{orderId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
              </div>
            ) : messages.length === 0 ? (
              <p style={{ color: neutralTextColor }}>No messages yet.</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`p-3 rounded-lg ${
                      message.senderId._id === session.user._id ? "ml-auto bg-blue-600" : "mr-auto bg-gray-600"
                    } max-w-[70%]`}
                    style={{
                      backgroundColor:
                        message.senderId._id === session.user._id ? "#60A5FA" : secondaryDarkGray,
                      color: activeTextColor,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: accentColor }}>
                      {message.senderId.userName}
                    </p>
                    <p>{message.content}</p>
                    <p className="text-xs" style={{ color: neutralTextColor }}>
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    {message.receiverId._id === session.user._id && !message.isRead && (
                      <span className="text-xs text-blue-400">Unread</span>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="rounded-lg"
                style={{
                  backgroundColor: white,
                  borderColor: inputBorderColor,
                  color: primaryDarkGray,
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <Button
                onClick={handleSendMessage}
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: accentColor, color: primaryDarkGray }}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}