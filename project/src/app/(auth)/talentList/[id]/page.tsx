"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js"; // Import Stripe.js
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  MapPin,
  Link2,
  Star,
  Check,
  DollarSign,
  Info,
  Package,
  CalendarDays,
  Briefcase,
  Verified,
  Loader2,
  MessageSquare,
  Edit,
  Trash2,
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { Images } from "@/lib/images";
import { TalentProfileInput } from "@/schemas/profileSchema";
import Loader from "@/components/Loader";
import io, { Socket } from "socket.io-client";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Define RatePlan type to match talentProfileSchema
interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  description: string;
  price: number;
  whatsIncluded: string[];
  deliveryDays: number;
  revisions: number;
}

// Define Order type for orders fetched from API
interface Order {
  _id: string;
  talentId: string;
  clientId: string;
  ratePlan: RatePlan;
  projectDetails: {
    title: string;
    description: string;
  };
  status: string;
}

// Define Message type for chat
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

interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
  role: "talent";
  isVerified: boolean;
}

export default function UserTalentProfilePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRatePlan, setSelectedRatePlan] = useState<RatePlan | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const colors = {
    primary: "#16423C",
    secondaryDarkGray: "rgba(106,156,137, 0)",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#6A9C89",
    white: "#FFFFFF",
    inputBorderColor: "#6A9C89",
    errorRed: "#EF4444",
  };

  useEffect(() => {
    if (status === "authenticated" && params.id) {
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

      const fetchTalentAndOrders = async () => {
        setIsLoading(true);
        try {
          const talentResponse = await axios.get(`/api/profile/${params.id}`);
          if (talentResponse.data.success) {
            setTalent(talentResponse.data.data);

            if (session?.user?.role === "user") {
              const ordersResponse = await axios.get("/api/orders", {
                params: {
                  talentId: params.id,
                  clientId: session.user._id,
                  status: "pending",
                },
              });
              if (ordersResponse.data.success) {
                const pendingTypes = new Set<string>(
                  ordersResponse.data.data.map((order: Order) => order.ratePlan.type)
                );
                setPendingOrders(pendingTypes);
              }

              socketInstance.emit("getMessages", { otherUserId: params.id });
            }
          } else {
            toast.error("Error", {
              description: talentResponse.data.message || "Failed to fetch talent profile.",
              className: "bg-red-600 text-white border-red-700 bg-opacity-80",
              duration: 4000,
            });
            router.push("/talentList");
          }
        } catch (error) {
          console.error("Error fetching talent or orders:", error);
          toast.error("Error", {
            description: "An error occurred while fetching the talent profile.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
          router.push("/user/talents");
        } finally {
          setIsLoading(false);
        }
      };

      fetchTalentAndOrders();

      return () => {
        socketInstance.disconnect();
      };
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, params.id, session, router]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getCategoryLabel = (categoryValue: string | null | undefined) => {
    if (!categoryValue) return "";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  const handleOpenOrderDialog = (ratePlan: RatePlan) => {
    if (session?.user?.role !== "user") {
      toast.error("Error", {
        description: "Only clients can request orders.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
      return;
    }
    if (pendingOrders.has(ratePlan.type)) {
      toast.error("Error", {
        description: `You already have a pending order for the ${ratePlan.type} plan.`,
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
      return;
    }
    setSelectedRatePlan(ratePlan);
    setProjectTitle("");
    setProjectDescription("");
    setIsOrderDialogOpen(true);
  };

  const handleRequestOrder = async () => {
    if (!selectedRatePlan || !talent) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/orders", {
        talentId: talent._id,
        ratePlan: selectedRatePlan,
        projectDetails: {
          title: projectTitle,
          description: projectDescription,
        },
      });

      if (response.data.success && response.data.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Stripe.js failed to load.");
        }
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId,
        });
        if (error) {
          throw new Error(error.message);
        }
      } else {
        throw new Error(response.data.message || "Failed to initiate payment.");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to initiate payment.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !talent) return;
    socket.emit("sendMessage", {
      receiverId: talent._id,
      content: newMessage,
    });
    setNewMessage("");
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
      <div className="min-h-screen flex items-center justify-center animate-pulse bg-emerald-50">
        <Loader text="Loading talent profile.." color="#000000" bgColor="#90D1CA" size="large" />
      </div>
    );
  }

  if (status !== "authenticated" || !talent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <p className="text-xl font-bold" style={{ color: colors.errorRed }}>
          Access denied or talent not found. Please sign in or try another profile.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 relative max-w-[94rem] mx-auto"
      style={{
        backgroundImage: `url(${Images.userViewbackground ? Images.userViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" style={{ borderColor: colors.inputBorderColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.activeTextColor }}>
              Request Order: {selectedRatePlan?.type}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="projectTitle" className="text-sm font-medium" style={{ color: colors.activeTextColor }}>
                Project Title
              </label>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
                style={{ borderColor: colors.inputBorderColor, color: colors.activeTextColor }}
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="projectDescription"
                className="text-sm font-medium"
                style={{ color: colors.activeTextColor }}
              >
                Project Description
              </label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project"
                rows={4}
                style={{ borderColor: colors.inputBorderColor, color: colors.primary }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
              style={{ borderColor: colors.accentColor, color: colors.accentColor }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRequestOrder}
              disabled={isSubmitting || !projectTitle || !projectDescription}
              style={{ backgroundColor: colors.accentColor, color: colors.white }}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" style={{ borderColor: colors.inputBorderColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.activeTextColor }}>
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message"
              style={{ borderColor: colors.inputBorderColor, color: colors.activeTextColor }}
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
              style={{ backgroundColor: colors.accentColor, color: colors.white }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      {session?.user?.role === "user" && (
        <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
          <DialogContent className="sm:max-w-[500px]" style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.3)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.activeTextColor }}>
                Chat with {talent.userName}
              </DialogTitle>
            </DialogHeader>
            <div
              className="max-h-96 overflow-y-auto p-4"
              style={{ backgroundColor: "rgba(163,209,198, 0.6)", borderColor: colors.inputBorderColor }}
              ref={chatContainerRef}
            >
              {messages.length === 0 ? (
                <p style={{ color: colors.neutralTextColor }}>No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`mb-4 flex ${message.senderId.userName === session.user.userName ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg shadow-sm ${
                        message.senderId.userName === session.user.userName
                          ? "bg-accent text-white"
                          : "bg-primary text-white"
                      }`}
                      style={{
                        backgroundColor:
                          message.senderId.userName === session.user.userName ? colors.accentColor : colors.primary,
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
                              style={{ color: colors.white }}
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
                      <p className="text-xs text-gray-300 mt-1">
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
                style={{ borderColor: colors.inputBorderColor, color: colors.white }}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                style={{ backgroundColor: colors.accentColor, color: colors.white }}
                disabled={!newMessage.trim()}
              >
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header: Profile Picture, Name, Category, Location */}
      <div className="relative z-10 mb-8" style={{ backgroundColor: "rgba(163,209,198, 0.2)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            onClick={() => router.push("/talentList")}
            className="font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
            style={{ backgroundColor: colors.accentColor, color: colors.white }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.neutralTextColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Talents
          </Button>
          {session?.user?.role === "user" && (
            <Button
              onClick={() => setIsChatDialogOpen(true)}
              className="font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
              style={{ backgroundColor: colors.accentColor, color: colors.white }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.neutralTextColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Message Talent
            </Button>
          )}
        </div>
        <div
          className="flex flex-col items-center md:flex-row md:items-start gap-6 bg-transparent rounded-lg shadow-sm shadow-[#16423C] p-6 border mt-4"
          style={{ borderColor: colors.inputBorderColor }}
        >
          <div className="flex-shrink-0">
            {talent.profilePicture ? (
              <Image
                src={talent.profilePicture}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 shadow-md w-32 h-32"
                style={{ borderColor: colors.accentColor }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md"
                style={{ backgroundColor: colors.primary, borderColor: colors.accentColor }}
              >
                <Briefcase className="h-16 w-16" style={{ color: colors.white }} />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center" style={{ color: colors.activeTextColor }}>
              {talent.userName}
              {talent.isVerified && (
                <Verified className="h-6 w-6 ml-2" style={{ color: colors.accentColor }} />
              )}
            </h1>
            {talent.category && (
              <p className="text-lg mt-2 font-medium" style={{ color: colors.neutralTextColor }}>
                {getCategoryLabel(talent.category)}
              </p>
            )}
            {talent.location && (
              <p
                className="text-md mt-2 flex items-center justify-center md:justify-start"
                style={{ color: colors.neutralTextColor }}
              >
                <MapPin className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                {talent.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8">
        {/* Left Section: Bio, About This Gig, Skills, Portfolio, Social Links */}
        <div className="w-full lg:w-3/5 space-y-6">
          {talent.bio && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border"
              style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.2)" }}
            >
              <h3 className="text-xl font-bold mb-3 flex items-center" style={{ color: colors.activeTextColor }}>
                <Info className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                Bio
              </h3>
              <p className="text-base" style={{ color: colors.neutralTextColor }}>
                {talent.bio}
              </p>
            </div>
          )}

          {talent.aboutThisGig && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border"
              style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.2)" }}
            >
              <h3 className="text-xl font-bold mb-3 flex items-center" style={{ color: colors.activeTextColor }}>
                <Info className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                About This Gig
              </h3>
              <p className="text-base" style={{ color: colors.neutralTextColor }}>
                {talent.aboutThisGig}
              </p>
            </div>
          )}

          {talent.skills && talent.skills.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border"
              style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.2)" }}
            >
              <h3 className="text-xl font-bold mb-3 flex items-center" style={{ color: colors.activeTextColor }}>
                <Star className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{ backgroundColor: colors.primary, color: colors.activeTextColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {talent.portfolio && talent.portfolio.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border"
              style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.2)" }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: colors.activeTextColor }}>
                <Package className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                Portfolio
              </h3>
              <Carousel
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent className="-ml-4">
                  {talent.portfolio.map((project, index) => (
                    <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2">
                      <div
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
                        style={{ borderColor: colors.inputBorderColor }}
                      >
                        {project.imageUrl && (
                          <div className="relative w-full h-48">
                            <Image
                              src={project.imageUrl}
                              alt={project.title}
                              fill
                              className="object-cover rounded-t-lg"
                            />
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-grow">
                          <h4 className="text-lg font-semibold mb-2" style={{ color: colors.activeTextColor }}>
                            {project.title}
                          </h4>
                          <p className="text-sm mb-3 flex-grow" style={{ color: colors.neutralTextColor }}>
                            {project.description}
                          </p>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium mt-auto"
                              style={{ color: colors.accentColor }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = colors.neutralTextColor)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = colors.accentColor)}
                            >
                              View Project <Link2 className="h-4 w-4 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className="hidden sm:flex"
                  style={{ backgroundColor: colors.accentColor, color: colors.white }}
                />
                <CarouselNext
                  className="hidden sm:flex"
                  style={{ backgroundColor: colors.accentColor, color: colors.white }}
                />
              </Carousel>
            </div>
          )}

          {talent.socialLinks && talent.socialLinks.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border"
              style={{ borderColor: colors.inputBorderColor, backgroundColor: "rgba(163,209,198, 0.2)" }}
            >
              <h3 className="text-xl font-bold mb-3 flex items-center" style={{ color: colors.activeTextColor }}>
                <Link2 className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                Social Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {talent.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{ backgroundColor: colors.accentColor, color: colors.white }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.neutralTextColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accentColor)}
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Rate Plans */}
        <div className="w-full lg:w-2/5">
          {talent.ratePlans && talent.ratePlans.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-sm shadow-[#6A9C89] p-6 border sticky top-6"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: colors.activeTextColor }}>
                <DollarSign className="h-5 w-5 mr-2" style={{ color: colors.accentColor }} />
                Rate Plans
              </h3>
              <Tabs defaultValue={talent.ratePlans[0]?.type} className="w-full">
                <TabsList
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${talent.ratePlans.length}, minmax(0, 1fr))`,
                    backgroundColor: colors.primary,
                    borderColor: colors.inputBorderColor,
                  }}
                >
                  {talent.ratePlans.map((plan) => (
                    <TabsTrigger
                      key={plan.type}
                      value={plan.type}
                      className="data-[state=active]:bg-accent data-[state=active]:text-white font-medium py-1 px-4 rounded-md transition-colors duration-200"
                      style={{ color: colors.neutralTextColor }}
                    >
                      {plan.type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {talent.ratePlans.map((plan) => (
                  <TabsContent key={plan.type} value={plan.type} className="mt-4">
                    <div
                      className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                      style={{ borderColor: colors.accentColor }}
                    >
                      <h4 className="text-lg font-bold mb-2" style={{ color: colors.accentColor }}>
                        {plan.type}
                      </h4>
                      <p className="text-2xl font-extrabold mb-2" style={{ color: colors.activeTextColor }}>
                        ${plan.price}
                      </p>
                      <p className="text-sm mb-3" style={{ color: colors.neutralTextColor }}>
                        {plan.description}
                      </p>
                      <ul className="text-sm space-y-1 mb-3" style={{ color: colors.activeTextColor }}>
                        {plan.whatsIncluded.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <Check className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: colors.accentColor }} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div
                        className="pt-3 border-t flex items-center text-sm"
                        style={{ borderColor: colors.inputBorderColor, color: colors.activeTextColor }}
                      >
                        <CalendarDays className="h-4 w-4 mr-2" style={{ color: colors.accentColor }} />
                        <span>Delivery in {plan.deliveryDays} days</span>
                      </div>
                      <div
                        className="pt-3 border-t flex items-center text-sm"
                        style={{ borderColor: colors.inputBorderColor, color: colors.activeTextColor }}
                      >
                        <Star className="h-4 w-4 mr-2" style={{ color: colors.accentColor }} />
                        <span>{plan.revisions} Revisions</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                className="w-full mt-4 rounded-full font-semibold"
                                style={{
                                  backgroundColor: pendingOrders.has(plan.type)
                                    ? colors.neutralTextColor
                                    : colors.accentColor,
                                  color: colors.white,
                                }}
                                onClick={() => handleOpenOrderDialog(plan)}
                                disabled={pendingOrders.has(plan.type)}
                              >
                                {pendingOrders.has(plan.type) ? "Pending Order" : "Request Order"}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {pendingOrders.has(plan.type) && (
                            <TooltipContent style={{ backgroundColor: colors.errorRed, color: colors.white }}>
                              You already have a pending order for the {plan.type} plan.
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
