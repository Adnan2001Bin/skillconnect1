"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, MessageSquare, ArrowLeft, Send, MessageSquareMore, MessageCircleCode } from "lucide-react"; // Added 'Send' icon
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";

interface Conversation {
  conversationId: string;
  participants: string[];
}

export default function TalentMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

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
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

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

      socketInstance.on("error", ({ message }) => {
        toast.error("Error", {
          description: message,
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
        if (message === "Failed to fetch conversations") {
          setIsLoading(false);
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session]);

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.lightAccentColor }}
      >
        <div className="flex items-center text-center">
          <Loader className="animate-spin h-10 w-10 mr-4" style={{ color: colors.accentColor }} />
          <p className="text-xl font-semibold" style={{ color: colors.darkTextColor }}>
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => router.push("/talent/orders")}
            className="font-semibold py-2 px-4 rounded-full transition-all duration-300 flex items-center shadow-md hover:bg-opacity-90"
            style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold text-white text-center flex-1 -ml-24">Your Messages</h1>
        </div>

        <Card className="rounded-2xl shadow-xl border-2 backdrop-blur-sm bg-white/20" style={{ border: `1px solid ${colors.secondaryColor}` }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-3" style={{ color: colors.darkTextColor }}>
              <div className="text-cyan-800">
                <MessageCircleCode />
              </div>
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Send className="h-12 w-12 mb-4" style={{ color: colors.grayTextColor }} />
                <p className="text-lg font-medium" style={{ color: colors.grayTextColor }}>
                  You have no conversations yet.
                </p>
                <p className="text-sm mt-1" style={{ color: colors.grayTextColor }}>
                  When a user messages you, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(
                    (name) => name !== (session?.user?.userName || "")
                  ) || "Unknown User";
                  
                  return (
                    <div
                      key={conversation.conversationId}
                      onClick={() => router.push(`/talent/messages/${conversation.conversationId}`)}
                      className="flex items-center p-4 rounded-lg transition-colors duration-200 cursor-pointer shadow-sm"
                      style={{ backgroundColor: colors.lightAccentColor, border: `1px solid ${colors.secondaryColor}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.secondaryColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.lightAccentColor)}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: colors.accentColor, color: colors.darkTextColor }}
                        >
                          {otherParticipant.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <p className="font-semibold text-lg" style={{ color: colors.darkTextColor }}>
                          {otherParticipant}
                        </p>
                        <p className="text-sm" style={{ color: colors.grayTextColor }}>
                          Click to view messages
                        </p>
                      </div>

                      <MessageSquareMore className="h-6 w-6 text-cyan-800"  />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}