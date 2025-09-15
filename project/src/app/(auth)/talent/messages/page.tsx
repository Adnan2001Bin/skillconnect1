"use client";

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
  Send,
  MoreVertical,
} from "lucide-react";
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  _id: string;
  senderId: { userName: string | null; _id: string };
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
  lastMessage?: Message;
  unreadCount?: number;
}

export default function TalentMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const colors = {
    primaryColor: "#8DBCC7",
    secondaryColor: "#A4CCD9",
    accentColor: "#90D1CA",
    lightAccentColor: "#C4E1E6",
    darkTextColor: "#212121",
    grayTextColor: "#757575",
    white: "#FFFFFF",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
        {
          auth: { userId: session.user._id },
        }
      );

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("Socket connected, fetching conversations");
        socketInstance.emit("getConversations");
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection Error", {
          description: "Failed to connect to messaging service.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        setIsLoadingConversations(false);
        setIsLoadingMessages(false);
      });

      socketInstance.on("conversations", (fetchedConversations: Conversation[]) => {
        console.log("Received conversations:", fetchedConversations);
        setConversations(fetchedConversations);
        setIsLoadingConversations(false);
      });

      socketInstance.on("messages", (fetchedMessages: Message[]) => {
        console.log("Received messages:", fetchedMessages);
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        ).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(uniqueMessages);
        setIsLoadingMessages(false);
      });

      socketInstance.on("newMessage", (message: Message) => {
        console.log("New message received:", message);
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
        } else {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.conversationId === message.conversationId
                ? { ...conv, lastMessage: message }
                : conv
            )
          );
        }
      });

      socketInstance.on("messageUpdated", (updatedMessage: Message) => {
        console.log("Message updated:", updatedMessage);
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
        console.log("Message deleted:", messageId);
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
        console.error("Socket error:", message);
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        if (
          message === "Failed to fetch conversations" ||
          message === "Failed to fetch messages"
        ) {
          setIsLoadingConversations(false);
          setIsLoadingMessages(false);
        }
      });

      return () => {
        console.log("Disconnecting socket");
        socketInstance.disconnect();
      };
    } 
  }, [status, session, router ,selectedConversationId]);

  useEffect(() => {
    if (socket && selectedConversationId && session?.user) {
      const otherUserId = selectedConversationId
        .split("_")
        .find((id) => id !== session.user._id);
      if (otherUserId) {
        console.log("Emitting getMessages for conversation:", selectedConversationId);
        setIsLoadingMessages(true);
        socket.emit("getMessages", { otherUserId });
      } else {
        socket.emit("error", { message: "Invalid conversation ID" });
      }
    }
  }, [selectedConversationId, socket, session]);

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
        if (conversationId !== selectedConversationId) {
          console.log("Selecting conversation:", conversationId);
          setSelectedConversationId(conversationId);
          setConversations((prev) =>
            prev.map((conv) =>
              conv.conversationId === conversationId
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        }
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
      console.log("Sending message to:", otherUserId);
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
    console.log("Editing message:", editingMessage._id);
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
    console.log("Deleting message:", messageId);
    socket.emit("deleteMessage", { messageId });
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm) {
      return conversations;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return conversations.filter((conversation) => {
      const otherParticipant =
        conversation.participants.find(
          (name) => name !== (session?.user?.userName || "")
        ) || "Unknown User";
      return otherParticipant.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, [conversations, searchTerm, session]);

  const getOtherParticipant = (conversation: Conversation) => {
    return (
      conversation.participants.find(
        (name) => name !== (session?.user?.userName || "")
      ) || "Unknown User"
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const isEdited = (message: Message) => {
    if (!message.updatedAt || !message.createdAt) return false;
    return (
      new Date(message.updatedAt).getTime() >
      new Date(message.createdAt).getTime()
    );
  };

  if (status === "loading" || isLoadingConversations) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <div className="flex flex-col items-center">
          <Loader
            className="animate-spin h-12 w-12 mr-4"
            style={{ color: colors.accentColor }}
          />
          <p
            className="text-xl font-semibold"
            style={{ color: colors.darkTextColor }}
          >
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col py-10 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${
          Images.talentProfileBackground ? Images.talentProfileBackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="sm:max-w-md bg-white rounded-xl shadow-xl border-0"
          style={{ borderColor: colors.primaryColor }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: colors.darkTextColor }}>
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message"
              style={{
                borderColor: colors.primaryColor,
                color: colors.darkTextColor,
              }}
              className="border focus:ring focus:ring-opacity-50 rounded-lg"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              style={{
                borderColor: colors.accentColor,
                color: colors.accentColor,
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMessage}
              disabled={!editedContent.trim()}
              style={{
                backgroundColor: colors.accentColor,
                color: colors.darkTextColor,
              }}
              className="rounded-lg"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push("/talent/orders")}
            className="font-semibold py-2 px-4 rounded-full transition-all duration-300 flex items-center shadow-md hover:bg-opacity-90"
            style={{
              backgroundColor: colors.accentColor,
              color: colors.darkTextColor,
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1
            className="text-3xl font-bold text-center flex-1"
            style={{ color: colors.white }}
          >
            Your Messages
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          <div className="w-full lg:w-1/3 flex flex-col">
            <Card
              className="rounded-2xl shadow-lg bg-white/20 backdrop-blur-sm border-0 flex-1 flex flex-col overflow-hidden"
              style={{ borderColor: colors.secondaryColor }}
            >
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle
                    className="text-xl font-semibold flex items-center gap-2"
                    style={{ color: colors.darkTextColor }}
                  >
                    <MessagesSquare
                      className="h-5 w-5"
                      style={{ color: colors.accentColor }}
                    />
                    Conversations
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <MoreVertical
                          className="h-4 w-4"
                          style={{ color: colors.grayTextColor }}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                      <DropdownMenuItem>Archived chats</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative mt-3">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: colors.grayTextColor }}
                  />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: colors.primaryColor,
                      color: colors.darkTextColor,
                    }}
                    className="pl-10 border focus:ring focus:ring-opacity-50 rounded-lg bg-gray-50/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageSquare
                      className="h-12 w-12 mb-4"
                      style={{ color: colors.grayTextColor }}
                    />
                    <p
                      className="text-lg font-medium"
                      style={{ color: colors.grayTextColor }}
                    >
                      No conversations yet
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: colors.grayTextColor }}
                    >
                      When a user messages you, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const isSelected =
                        conversation.conversationId === selectedConversationId;
                      const lastMessage = conversation.lastMessage;
                      const unreadCount = conversation.unreadCount || 0;

                      return (
                        <div
                          key={conversation.conversationId}
                          onClick={() =>
                            handleSelectConversation(conversation.conversationId)
                          }
                          className={cn(
                            "flex items-center p-4 cursor-pointer transition-all duration-200 group",
                            isSelected
                              ? "bg-opacity-70"
                              : "hover:bg-opacity-50"
                          )}
                          style={{
                            backgroundColor: isSelected
                              ? colors.secondaryColor
                              : colors.lightAccentColor,
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar
                              className="h-12 w-12 border-2 border-white shadow"
                              style={{ borderColor: colors.white }}
                            >
                              <AvatarImage src="" />
                              <AvatarFallback
                                style={{
                                  backgroundColor: colors.accentColor,
                                  color: colors.darkTextColor,
                                }}
                              >
                                {otherParticipant.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {unreadCount > 0 && (
                              <Badge
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                                style={{
                                  backgroundColor: colors.accentColor,
                                  color: colors.darkTextColor,
                                }}
                              >
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p
                                className="font-semibold truncate"
                                style={{ color: colors.darkTextColor }}
                              >
                                {otherParticipant}
                              </p>
                              {lastMessage && (
                                <span
                                  className="text-xs whitespace-nowrap ml-2"
                                  style={{ color: colors.grayTextColor }}
                                >
                                  {formatTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {lastMessage ? (
                              <p
                                className="text-sm truncate mt-1"
                                style={{ color: colors.grayTextColor }}
                              >
                                {lastMessage.senderId.userName ===
                                  session?.user?.userName && "You: "}
                                {lastMessage.deletedAt
                                  ? "[Message deleted]"
                                  : lastMessage.content}
                              </p>
                            ) : (
                              <p
                                className="text-sm italic mt-1"
                                style={{ color: colors.grayTextColor }}
                              >
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col ">
            {!selectedConversationId ? (
              <Card
                className="rounded-2xl shadow-lg bg-white/20 backdrop-blur-sm border-0 flex-1 flex flex-col items-center justify-center p-8"
                style={{ borderColor: colors.primaryColor }}
              >
                <div className="text-center max-w-md mx-auto">
                  <div
                    className="p-6 rounded-2xl inline-block mb-6"
                    style={{
                      backgroundColor: colors.lightAccentColor,
                    }}
                  >
                    <MessagesSquare
                      className="h-12 w-12 mx-auto"
                      style={{ color: colors.accentColor }}
                    />
                  </div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.darkTextColor }}
                  >
                    Your Messages
                  </h3>
                  <p style={{ color: colors.grayTextColor }}>
                    Select a conversation from the list to start chatting.
                  </p>
                </div>
              </Card>
            ) : (
              <Card
                className="rounded-2xl shadow-lg bg-white/20 backdrop-blur-sm border-1 flex-1 flex flex-col overflow-hidden "
                style={{ borderColor: colors.primaryColor }}
              >
                <CardHeader className="py-4 border-b border-gray-100 bg-white">
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center">
                      <Avatar
                        className="h-10 w-10 border-2 border-white shadow mr-3"
                        style={{ borderColor: colors.white }}
                      >
                        <AvatarImage src="" />
                        <AvatarFallback
                          style={{
                            backgroundColor: colors.accentColor,
                            color: colors.darkTextColor,
                          }}
                        >
                          {getOtherParticipant(
                            conversations.find(
                              (c) => c.conversationId === selectedConversationId
                            ) || { conversationId: "", participants: [] }
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle
                          className="text-lg font-semibold "
                          style={{ color: colors.darkTextColor }}
                        >
                          {getOtherParticipant(
                            conversations.find(
                              (c) => c.conversationId === selectedConversationId
                            ) || { conversationId: "", participants: [] }
                          )}
                        </CardTitle>
                        <p
                          className="text-xs"
                          style={{ color: colors.grayTextColor }}
                        >
                          Online
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full "
                    >
                      <MoreVertical
                        className="h-4 w-4"
                        style={{ color: colors.grayTextColor }}
                      />
                    </Button>
                  </div>
                </CardHeader>

                <div className="flex-1 flex flex-col min-h-0 ">
                  <div
                    className="flex-1 overflow-y-auto p-4"
                    style={{
                      background: `linear-gradient(to bottom, ${colors.white}, ${colors.lightAccentColor}30)`,
                    }}
                    ref={chatContainerRef}
                    
                  >
                    {isLoadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Loader
                          className="animate-spin h-8 w-8"
                          style={{ color: colors.accentColor }}
                        />
                        <p
                          className="text-gray-500 mt-2"
                          style={{ color: colors.grayTextColor }}
                        >
                          Loading messages...
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircleMore
                          className="h-12 w-12 mb-4"
                          style={{ color: colors.grayTextColor }}
                        />
                        <p
                          className="text-lg font-medium"
                          style={{ color: colors.grayTextColor }}
                        >
                          No messages yet
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: colors.grayTextColor }}
                        >
                          Send a message to start the conversation
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const senderName =
                            message.senderId.userName || "Unknown User";
                          const isDeleted = !!message.deletedAt;
                          const isOwnMessage =
                            senderName === session?.user?.userName;

                          return (
                            <div
                              key={message._id}
                              className={cn(
                                "flex",
                                isOwnMessage ? "justify-end" : "justify-start"
                              )}
                            >
                              <div className="max-w-xs lg:max-w-md group">
                                <div
                                  className={cn(
                                    "flex",
                                    isOwnMessage
                                      ? "justify-end"
                                      : "justify-start"
                                  )}
                                >
                                  {!isOwnMessage && (
                                    <Avatar className="h-6 w-6 mt-4 mr-2">
                                      <AvatarFallback
                                        style={{
                                          backgroundColor: colors.lightAccentColor,
                                          color: colors.darkTextColor,
                                        }}
                                      >
                                        {senderName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div
                                    className={cn(
                                      "rounded-2xl px-4 py-2 shadow-sm",
                                      isDeleted
                                        ? "bg-gray-200 text-gray-700"
                                        : isOwnMessage
                                        ? `bg-gradient-to-br from-${colors.accentColor} to-${colors.secondaryColor} text-${colors.darkTextColor}`
                                        : "bg-white border border-gray-200 text-gray-800"
                                    )}
                                    style={{
                                      background: isDeleted
                                        ? colors.grayTextColor
                                        : isOwnMessage
                                        ? `linear-gradient(to bottom right, ${colors.accentColor}, ${colors.secondaryColor})`
                                        : colors.white,
                                      color: isDeleted
                                        ? colors.darkTextColor
                                        : isOwnMessage
                                        ? colors.darkTextColor
                                        : colors.darkTextColor,
                                      borderColor: isDeleted
                                        ? colors.grayTextColor
                                        : colors.primaryColor,
                                    }}
                                  >
                                    {!isOwnMessage && !isDeleted && (
                                      <p
                                        className="text-xs font-medium mb-1"
                                        style={{ color: colors.darkTextColor }}
                                      >
                                        {senderName}
                                      </p>
                                    )}
                                    <p
                                      className={cn(
                                        "text-sm",
                                        isDeleted && "italic"
                                      )}
                                      style={{ color: colors.darkTextColor }}
                                    >
                                      {message.content}
                                    </p>
                                    <div
                                      className={cn(
                                        "text-xs mt-1 flex justify-end",
                                        isOwnMessage
                                          ? "text-gray-100"
                                          : "text-gray-400"
                                      )}
                                      style={{
                                        color: isOwnMessage
                                          ? colors.grayTextColor
                                          : colors.grayTextColor,
                                      }}
                                    >
                                      {formatTime(
                                        message.updatedAt || message.createdAt
                                      )}
                                      {isEdited(message) && (
                                        <span className="ml-1">• Edited</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isOwnMessage && !isDeleted && (
                                  <div className="flex justify-end mt-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditDialog(message)}
                                      className="h-6 w-6 p-0"
                                      style={{ color: colors.grayTextColor }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMessage(message._id)}
                                      className="h-6 w-6 p-0"
                                      style={{ color: "#EF4444" }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className="p-4 border-t border-gray-100"
                    style={{ backgroundColor: colors.white }}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                          borderColor: colors.primaryColor,
                          color: colors.darkTextColor,
                        }}
                        className="flex-1 border focus:ring focus:ring-opacity-50 rounded-full bg-gray-50/50"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="h-10 w-10 rounded-full p-0 flex items-center justify-center"
                        style={{
                          backgroundColor: colors.accentColor,
                          color: colors.darkTextColor,
                        }}
                        disabled={!newMessage.trim() || !selectedConversationId}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}