
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader, ArrowLeft, MessageSquare, Edit, Trash2, MessageCircleMore } from "lucide-react";
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";

interface Message {
  _id: string;
  senderId: { userName: string | null };
  receiverId: string;
  content: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
  updatedAt?: string;
  deletedAt?: string;
}

export default function UserChatPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const colors = {
    primaryColor: "#16423C",
    accentColor: "#17B169",
    neutralTextColor: "#6A9C89",
    lightAccentColor: "#A3D1C6",
    errorRed: "#EF4444",
    darkTextColor: "#FFFFFF",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user" && conversationId) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        const otherUserId = conversationId.split("_").find(id => id !== session.user._id);
        if (otherUserId) {
          socketInstance.emit("getMessages", { otherUserId });
        } else {
          socketInstance.emit("error", { message: "Invalid conversation ID" });
        }
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

      socketInstance.on("messages", (fetchedMessages: Message[]) => {
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(uniqueMessages);
        setIsLoading(false);
      });

      socketInstance.on("newMessage", (message: Message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) {
              console.warn("Duplicate message received:", message._id);
              return prev;
            }
            return [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      });

      socketInstance.on("messageUpdated", (updatedMessage: Message) => {
        if (updatedMessage.conversationId === conversationId) {
          setMessages((prev) =>
            prev
              .map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        }
      });

      socketInstance.on("messageDeleted", ({ messageId }: { messageId: string }) => {
        setMessages((prev) =>
          prev
            .map((m) =>
              m._id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: "[This message was deleted]" } : m
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
        if (message === "Failed to fetch messages") {
          setIsLoading(false);
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    } 
  }, [status, session, conversationId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !session?.user) return;
    const otherUserId = conversationId.split("_").find(id => id !== session.user._id);
    if (otherUserId) {
      socket.emit("sendMessage", {
        receiverId: otherUserId,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleOpenEditDialog = (message: Message) => {
    setEditingMessage(message);
    setEditedContent(message.content);
    setIsEditDialogOpen(true);
  };

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
          Loading messages...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
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

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Button
            onClick={() => router.push("/messages")}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.neutralTextColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Conversations
          </Button>
        </div>

        <Card
          className="rounded-xl shadow-md shadow-[#16423C] border"
          style={{ borderColor: colors.primaryColor, backgroundColor: "rgba(163,209,198, 0.3)" }}
        >
          <CardHeader > 
            <CardTitle style={{ color: colors.primaryColor }} className="flex items-center gap-2">
                <MessageCircleMore />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="max-h-[500px] overflow-y-auto p-4 border-t-2"
              style={{ borderColor: colors.accentColor }}
              ref={chatContainerRef}
            >
              {messages.length === 0 ? (
                <p style={{ color: colors.neutralTextColor }}>No messages in this conversation.</p>
              ) : (
                messages.map((message) => {
                  const senderName = message.senderId.userName || "Unknown User";
                  const isDeleted = !!message.deletedAt;
                  const messageBgColor = isDeleted ? colors.neutralTextColor : (senderName === session?.user?.userName ? colors.accentColor : colors.primaryColor);
                  const messageTextColor = isDeleted ? colors.darkTextColor : colors.darkTextColor;

                  return (
                    <div
                      key={message._id}
                      className={`mb-4 flex ${senderName === session?.user?.userName ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-xs p-3 rounded-lg shadow-sm"
                        style={{ backgroundColor: messageBgColor, color: messageTextColor }}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold">
                            {senderName === session?.user?.userName ? "Me" : senderName}
                            {isDeleted && <span className="ml-2 italic" style={{ color: colors.neutralTextColor }}>(Deleted)</span>}
                          </p>
                          {senderName === session?.user?.userName && !isDeleted && (
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
                                style={{ color: colors.errorRed }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1" style={{ color: colors.neutralTextColor }}>
                          {new Date(message.updatedAt || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.updatedAt && message.updatedAt !== message.createdAt && " (Edited)"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 p-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ borderColor: colors.primaryColor, color: colors.primaryColor }}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
