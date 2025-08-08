"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, MessageSquare, ArrowLeft, MessagesSquare } from "lucide-react";
import { Images } from "@/lib/images";
import io, { Socket } from "socket.io-client";

interface Conversation {
  conversationId: string;
  participants: string[];
}

export default function UserMessagesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const colors = {
    primaryColor: "#16423C",
    accentColor: "#17B169",
    neutralTextColor: "#6A9C89",
    lightAccentColor: "#A3D1C6",
    errorRed: "#EF4444",
    darkTextColor: "#FFFFFF",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
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
          <Loader className="animate-spin h-10 w-10 text-emerald-600 mr-4" />
          <p className="text-xl font-semibold text-gray-800">
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
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push("/talentList")}
            className="font-semibold py-2 px-4 rounded-full transition-all duration-300 flex items-center shadow-md bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Talents
          </Button>
          <h1 className="text-3xl font-bold text-emerald-700 text-center flex-1 -ml-28">Your Messages</h1>
        </div>

        <Card className="rounded-2xl shadow-xl border-none backdrop-blur-sm bg-white/20">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-700 font-semibold flex gap-3">
              <MessagesSquare className="text-emerald-500"/>
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {conversations.length === 0 ? (
              <p className="text-center text-white/70 italic">No conversations found. Start a new one!</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(
                    (name) => name !== (session?.user?.userName || "")
                  ) || "Unknown User";

                  return (
                    <div
                      key={conversation.conversationId}
                      onClick={() => router.push(`/messages/${conversation.conversationId}`)}
                      className="flex items-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex-shrink-0 relative">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg">
                          {otherParticipant.charAt(0).toUpperCase()}
                        </div>
                        {/* Optional: Add an online indicator here */}
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-700 rounded-full ring-2 ring-white"></span>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <p className="font-semibold text-black text-lg">
                          {otherParticipant}
                        </p>
                        <p className="text-sm text-emerald-700/70">
                          Click to view messages
                        </p>
                      </div>

                      <MessageSquare className="h-6 w-6 text-emerald-500" />
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