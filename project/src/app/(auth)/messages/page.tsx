"use client"

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader,
  ArrowLeft,
  MessageSquare,
  Edit,
  Trash2,
  MessagesSquare,
  MessageCircleMore,
  Search,
} from "lucide-react";
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

interface Conversation {
  conversationId: string;
  participants: string[];
}

export default function UserChatAndMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const colors = {
    primaryColor: "#006400", // Deep forest green
    accentColor: "#3CB371", // Medium sea green
    neutralTextColor: "#333333", // Soft black
    lightAccentColor: "#E8F5E9", // Very light green
    errorRed: "#B00020", // Deep red for errors
    darkTextColor: "#FFFFFF", // White
    cardBg: "#FFFFFF", // White
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
        {
          auth: { userId: session.user._id },
        }
      );

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        socketInstance.emit("getConversations");
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

      socketInstance.on("conversations", (fetchedConversations: Conversation[]) => {
        setConversations(fetchedConversations);
        setIsLoading(false);
      });

      socketInstance.on("messages", (fetchedMessages: Message[]) => {
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        ).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(uniqueMessages);
      });

      socketInstance.on("newMessage", (message: Message) => {
        if (message.conversationId === selectedConversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) {
              console.warn("Duplicate message received:", message._id);
              return prev;
            }
            return [...prev, message].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
      });

      socketInstance.on("messageUpdated", (updatedMessage: Message) => {
        if (updatedMessage.conversationId === selectedConversationId) {
          setMessages((prev) =>
            prev
              .map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
          );
        }
      });

      socketInstance.on("messageDeleted", ({ messageId }: { messageId: string }) => {
        setMessages((prev) =>
          prev
            .map((m) =>
              m._id === messageId
                ? {
                    ...m,
                    deletedAt: new Date().toISOString(),
                    content: "[This message was deleted]",
                  }
                : m
            )
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        );
      });

      socketInstance.on("error", ({ message }) => {
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        if (message === "Failed to fetch conversations" || message === "Failed to fetch messages") {
          setIsLoading(false);
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session, selectedConversationId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectConversation = (conversationId: string) => {
    if (socket && session?.user) {
      const otherUserId = conversationId
        .split("_")
        .find((id) => id !== session.user._id);
      if (otherUserId) {
        setMessages([]);
        setSelectedConversationId(conversationId);
        socket.emit("getMessages", { otherUserId });
      } else {
        toast.error("Error", {
          description: "Invalid conversation ID.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !session?.user || !selectedConversationId)
      return;
    const otherUserId = selectedConversationId
      .split("_")
      .find((id) => id !== session.user._id);
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

  const filteredConversations = useMemo(() => {
    if (!searchTerm) {
      return conversations;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return conversations.filter(conversation => {
      const otherParticipant = conversation.participants.find(
        (name) => name !== (session?.user?.userName || "")
      ) || "Unknown User";
      return otherParticipant.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, [conversations, searchTerm, session]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-12 w-12 mr-4 text-green-800" />
        <p className="text-2xl font-semibold text-gray-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl border" style={{ borderColor: colors.primaryColor }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message"
              className="border-gray-300 focus:border-green-800 focus:ring-green-800 text-gray-900"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMessage}
              disabled={!editedContent.trim()}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Conversations List (Left Panel) */}
        <div className="w-full md:w-1/3">
          <div className="flex justify-between items-center mb-6">
            <Button
              onClick={() => router.push("/talentList")}
              className="bg-green-800 text-white hover:bg-green-900 rounded-full flex items-center px-4 py-2 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Talents
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          </div>
          <Card className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MessagesSquare className="h-6 w-6 text-green-700" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-800 focus:ring-green-800 text-gray-900"
                />
              </div>
              {filteredConversations.length === 0 ? (
                <p className="text-center text-gray-500 italic">No conversations found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant =
                      conversation.participants.find(
                        (name) => name !== (session?.user?.userName || "")
                      ) || "Unknown User";
                    const isSelected = conversation.conversationId === selectedConversationId;

                    return (
                      <div
                        key={conversation.conversationId}
                        onClick={() => handleSelectConversation(conversation.conversationId)}
                        className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected ? "bg-green-50" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex-shrink-0 relative">
                          <div className="h-12 w-12 rounded-full bg-green-800 text-white flex items-center justify-center font-bold text-lg">
                            {otherParticipant.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white"></span>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-semibold text-gray-900 text-lg">{otherParticipant}</p>
                          <p className="text-sm text-gray-500">Click to view messages</p>
                        </div>
                        <MessageSquare className="h-6 w-6 text-green-700" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Pane (Right Panel) */}
        <div className="w-full md:w-2/3">
          {!selectedConversationId ? (
            <div className="h-full flex items-center justify-center">
              <Card className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm p-8 text-center min-h-[600px] flex flex-col items-center justify-center">
                <MessagesSquare className="h-24 w-24 mb-4 text-green-300" />
                <p className="text-xl text-gray-700 font-semibold">
                  Select a conversation to start chatting.
                </p>
              </Card>
            </div>
          ) : (
            <Card className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                  <MessageCircleMore className="h-6 w-6 text-green-700" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className="max-h-[500px] overflow-y-auto p-4 border-t-2 border-gray-200"
                  ref={chatContainerRef}
                >
                  {messages.length === 0 ? (
                    <p className="text-gray-500">No messages in this conversation.</p>
                  ) : (
                    messages.map((message) => {
                      const senderName = message.senderId.userName || "Unknown User";
                      const isDeleted = !!message.deletedAt;
                      const messageBgColor = isDeleted
                        ? colors.neutralTextColor
                        : senderName === session?.user?.userName
                        ? colors.accentColor
                        : colors.primaryColor;
                      const messageTextColor = colors.darkTextColor;

                      return (
                        <div
                          key={message._id}
                          className={`mb-4 flex ${
                            senderName === session?.user?.userName
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className="max-w-xs p-3 rounded-lg shadow-sm"
                            style={{
                              backgroundColor: messageBgColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-semibold">
                                {senderName === session?.user?.userName ? "Me" : senderName}
                                {isDeleted && (
                                  <span className="ml-2 italic text-gray-300">
                                    (Deleted)
                                  </span>
                                )}
                              </p>
                              {senderName === session?.user?.userName && !isDeleted && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEditDialog(message)}
                                    className="text-white hover:bg-black/20"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className="text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs mt-1 text-white opacity-70">
                              {new Date(
                                message.updatedAt || message.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {message.updatedAt &&
                                message.updatedAt !== message.createdAt &&
                                " (Edited)"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2 p-4 bg-gray-50">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="border-gray-300 focus:border-green-800 focus:ring-green-800 text-gray-900"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={!newMessage.trim() || !selectedConversationId}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}