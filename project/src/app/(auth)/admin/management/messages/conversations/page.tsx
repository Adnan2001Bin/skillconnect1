"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 as Loader, MessageSquare, ArrowLeft } from "lucide-react";
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";

interface Conversation {
  conversationId: string;
  participants: string[];
}

export default function AdminConversationsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Consistent color theme
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const errorColor = "#EF4444";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
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

      socketInstance.on("conversations", (fetchedConversations: Conversation[]) => {
        setConversations(fetchedConversations);
        setIsLoading(false);
      });

      socketInstance.on("error", ({ message }) => {
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      socketInstance.emit("getConversationsForAdmin");

      return () => {
        socketInstance.disconnect();
      };
    } 
  }, [status, session, router]);

  console.log("socket",socket);
  

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-12 w-12 mr-4" style={{ color: accentColor }} />
        <p className="text-2xl font-semibold" style={{ color: activeTextColor }}>
          Loading conversations...
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
          Access denied. Please sign in as an admin to view conversations.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-13 max-w-7xl mx-auto mt-17"
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
            onClick={() => router.push("/admin/dashboard")}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Admin Dashboard
          </Button>
        </div>

        <Card
          className="rounded-xl shadow-md border"
          style={{ borderColor: accentColor, backgroundColor: secondaryDarkGray }}
        >
          <CardHeader>
            <CardTitle style={{ color: activeTextColor }}>
              All Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <p style={{ color: neutralTextColor }}>No conversations found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ color: activeTextColor }}>Conversation ID</TableHead>
                    <TableHead style={{ color: activeTextColor }}>Participants</TableHead>
                    <TableHead style={{ color: activeTextColor }}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.conversationId}>
                      <TableCell style={{ color: neutralTextColor }}>
                        {conversation.conversationId}
                      </TableCell>
                      <TableCell style={{ color: neutralTextColor }}>
                        {conversation.participants.join(" & ")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/management/messages/conversations/${conversation.conversationId}`)}
                          className="px-4 py-2 rounded-full font-semibold transition-colors"
                          style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 