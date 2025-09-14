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
  ImageIcon,
  Paperclip,
  MoreVertical,
} from "lucide-react";
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

export default function UserChatAndMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const colors = {
    primaryColor: "#006400",
    accentColor: "#3CB371",
    neutralTextColor: "#333333",
    lightAccentColor: "#E8F5E9",
    errorRed: "#B00020",
    darkTextColor: "#FFFFFF",
    cardBg: "#FFFFFF",
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
        setIsLoading(false);
      });

      socketInstance.on(
        "conversations",
        (fetchedConversations: Conversation[]) => {
          console.log("Received conversations:", fetchedConversations);
          setConversations(fetchedConversations);
          setIsLoading(false);
        }
      );

      socketInstance.on("messages", (fetchedMessages: Message[]) => {
        console.log("Received messages:", fetchedMessages);
        const uniqueMessages = Array.from(
          new Map(fetchedMessages.map((m) => [m._id, m])).values()
        ).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(uniqueMessages);
        setIsMessagesLoading(false);
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
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
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
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              )
          );
        }
      });

      socketInstance.on(
        "messageDeleted",
        ({ messageId }: { messageId: string }) => {
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
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              )
          );
        }
      );

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
          setIsLoading(false);
          setIsMessagesLoading(false);
        }
      });

      return () => {
        console.log("Disconnecting socket");
        socketInstance.disconnect();
      };
    }
  }, [status, session]);

  useEffect(() => {
    if (socket && selectedConversationId && session?.user) {
      const otherUserId = selectedConversationId
        .split("_")
        .find((id) => id !== session.user._id);
      if (otherUserId) {
        console.log(
          "Emitting getMessages for conversation:",
          selectedConversationId
        );
        setIsMessagesLoading(true);
        socket.emit("getMessages", { otherUserId });
      }
    }
  }, [selectedConversationId, socket, session]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
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
    if (
      !newMessage.trim() ||
      !socket ||
      !session?.user ||
      !selectedConversationId
    )
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-12 w-12 mr-4 text-green-600" />
          <p className="text-xl font-semibold text-gray-700 mt-4">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4 sm:px-6 lg:px-8">
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message"
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 rounded-lg"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMessage}
              disabled={!editedContent.trim()}
              className="bg-green-600 text-white hover:bg-green-700 rounded-lg"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push("/talentList")}
            className="bg-white text-green-700 hover:bg-green-50 border border-green-200 rounded-full flex items-center px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Talents
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Messages
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          <div className="w-full lg:w-1/3 flex flex-col">
            <Card className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm border-0 flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5 text-green-600" />
                    Conversations
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                      <DropdownMenuItem>Archived chats</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 rounded-lg bg-gray-50"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                      No conversations yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start a conversation with a talent
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
                            isSelected ? "bg-green-50" : "hover:bg-gray-50"
                          )}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 border-2 border-white shadow">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                {otherParticipant.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {unreadCount > 0 && (
                              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-500 text-white">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-gray-900 truncate">
                                {otherParticipant}
                              </p>
                              {lastMessage && (
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {formatTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {lastMessage ? (
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {lastMessage.senderId.userName ===
                                  session?.user?.userName && "You: "}
                                {lastMessage.deletedAt
                                  ? "[Message deleted]"
                                  : lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic mt-1">
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

          <div className="w-full lg:w-2/3 flex flex-col">
            {!selectedConversationId ? (
              <Card className="rounded-2xl shadow-lg bg-transparent backdrop-blur-sm border-0 flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-2xl inline-block mb-6">
                    <MessagesSquare className="h-12 w-12 text-green-500 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Your messages
                  </h3>
                  <p className="text-gray-500">
                    Select a conversation from the list to start chatting or
                    connect with talents to begin a conversation.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
                <CardHeader className=" border-b bg-white border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 border-2 border-white shadow mr-3">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
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
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {getOtherParticipant(
                            conversations.find(
                              (c) => c.conversationId === selectedConversationId
                            ) || { conversationId: "", participants: [] }
                          )}
                        </CardTitle>
                        <p className="text-xs text-gray-400">Online</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <div className="flex-1 flex flex-col min-h-0">
                  <div
                    className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-green-50/30"
                    ref={chatContainerRef}
                    style={{
                      maxHeight: "calc(100vh - 300px)",
                      minHeight: "200px",
                    }}
                  >
                    {isMessagesLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Loader className="animate-spin h-8 w-8 text-green-600" />
                        <p className="text-gray-500 mt-2">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircleMore className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">
                          No messages yet
                        </p>
                        <p className="text-sm text-gray-400">
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
                                      <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
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
                                        ? "bg-gradient-to-br from-green-600 to-emerald-600 text-white"
                                        : "bg-white border border-gray-200 text-gray-800"
                                    )}
                                  >
                                    {!isOwnMessage && !isDeleted && (
                                      <p className="text-xs font-medium mb-1">
                                        {senderName}
                                      </p>
                                    )}
                                    <p
                                      className={cn(
                                        "text-sm",
                                        isDeleted && "italic"
                                      )}
                                    >
                                      {message.content}
                                    </p>
                                    <div
                                      className={cn(
                                        "text-xs mt-1 flex justify-end",
                                        isOwnMessage
                                          ? "text-green-900"
                                          : "text-gray-400"
                                      )}
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
                                      onClick={() =>
                                        handleOpenEditDialog(message)
                                      }
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteMessage(message._id)
                                      }
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
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

                  <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-gray-400"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-gray-400"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 rounded-full bg-gray-50"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white p-0 flex items-center justify-center"
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