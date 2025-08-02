
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import Image from "next/image";
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
  Loader,
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
} from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { Images } from "@/lib/images";
import { TalentProfileInput } from "@/schemas/profileSchema";

// Define RatePlan type to match talentProfileSchema
interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  description: string;
  price: number;
  whatsIncluded: string[];
  deliveryDays: number;
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
  const [selectedRatePlan, setSelectedRatePlan] = useState<RatePlan | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set());

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#17B169",
    activeTextColor: "#16423C",
    neutralTextColor: "#6A9C89",
    white: "#FFFFFF",
    inputBorderColor: "#16423C",
    errorRed: "#EF4444",
  };

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      const fetchTalentAndOrders = async () => {
        setIsLoading(true);
        try {
          // Fetch talent profile
          const talentResponse = await axios.get(`/api/profile/${params.id}`);
          if (talentResponse.data.success) {
            setTalent(talentResponse.data.data);

            // Fetch pending orders for the current client and talent
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
            }
          } else {
            toast.error("Error", {
              description:
                talentResponse.data.message || "Failed to fetch talent profile.",
              className:
                "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
              duration: 4000,
            });
            router.push("/talentList");
          }
        } catch (error) {
          console.error("Error fetching talent or orders:", error);
          toast.error("Error", {
            description: "An error occurred while fetching the talent profile.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
          router.push("/user/talents");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTalentAndOrders();
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, params.id, session, router]);

  // Helper function to get the category label
  const getCategoryLabel = (categoryValue: string | null | undefined) => {
    if (!categoryValue) return "";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  // Handle opening the order dialog
  const handleOpenOrderDialog = (ratePlan: RatePlan) => {
    if (session?.user?.role !== "user") {
      toast.error("Error", {
        description: "Only clients can request orders.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return;
    }
    if (pendingOrders.has(ratePlan.type)) {
      toast.error("Error", {
        description: `You already have a pending order for the ${ratePlan.type} plan.`,
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return;
    }
    setSelectedRatePlan(ratePlan);
    setProjectTitle("");
    setProjectDescription("");
    setIsOrderDialogOpen(true);
  };

  // Handle order submission
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

      if (response.data.success) {
        toast.success("Success", {
          description: "Order requested successfully.",
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setPendingOrders((prev) => new Set(prev).add(selectedRatePlan.type));
        setIsOrderDialogOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to request order.");
      }
    } catch (error) {
      console.error("Error requesting order:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to request order.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center animate-pulse"
        style={{ backgroundColor: colors.primary }}
      >
        <Loader
          className="animate-spin h-12 w-12 mr-4"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-2xl font-semibold"
          style={{ color: colors.activeTextColor }}
        >
          Loading talent profile...
        </p>
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
          Access denied or talent not found. Please sign in or try another
          profile.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 relative max-w-[94rem] mx-auto"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          style={{ borderColor: colors.inputBorderColor }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: colors.activeTextColor }}>
              Request Order: {selectedRatePlan?.type}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="projectTitle"
                className="text-sm font-medium"
                style={{ color: colors.activeTextColor }}
              >
                Project Title
              </label>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
                style={{
                  borderColor: colors.inputBorderColor,
                  color: colors.activeTextColor,
                }}
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
                style={{
                  borderColor: colors.inputBorderColor,
                  color: colors.activeTextColor,
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
              style={{
                borderColor: colors.accentColor,
                color: colors.accentColor,
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRequestOrder}
              disabled={isSubmitting || !projectTitle || !projectDescription}
              style={{
                backgroundColor: colors.accentColor,
                color: colors.white,
              }}
            >
              {isSubmitting ? (
                <Loader className="animate-spin h-5 w-5 mr-2" />
              ) : null}
              Request Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header: Profile Picture, Name, Category, Location */}
      <div className="relative z-10 mb-8">
        <Button
          onClick={() => router.push("/user/talents")}
          className="mb-6 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
          style={{ backgroundColor: colors.accentColor, color: colors.white }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = colors.accentColor)
          }
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Talents
        </Button>
        <div
          className="flex flex-col items-center md:flex-row md:items-start gap-6 bg-transparent rounded-lg shadow-sm shadow-[#16423C] p-6 border"
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
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.accentColor,
                }}
              >
                <Briefcase
                  className="h-16 w-16"
                  style={{ color: colors.white }}
                />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1
              className="text-3xl sm:text-4xl font-bold flex items-center"
              style={{ color: colors.activeTextColor }}
            >
              {talent.userName}
              {talent.isVerified && (
                <Verified
                  className="h-6 w-6 ml-2"
                  style={{ color: colors.accentColor }}
                />
              )}
            </h1>
            {talent.category && (
              <p
                className="text-lg mt-2 font-medium"
                style={{ color: colors.neutralTextColor }}
              >
                {getCategoryLabel(talent.category)}
              </p>
            )}
            {talent.location && (
              <p
                className="text-md mt-2 flex items-center justify-center md:justify-start"
                style={{ color: colors.neutralTextColor }}
              >
                <MapPin
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
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
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Info
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Bio
              </h3>
              <p
                className="text-base"
                style={{ color: colors.neutralTextColor }}
              >
                {talent.bio}
              </p>
            </div>
          )}

          {talent.aboutThisGig && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Info
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                About This Gig
              </h3>
              <p
                className="text-base"
                style={{ color: colors.neutralTextColor }}
              >
                {talent.aboutThisGig}
              </p>
            </div>
          )}

          {talent.skills && talent.skills.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Star
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.activeTextColor,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        colors.accentColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.primary)
                    }
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {talent.portfolio && talent.portfolio.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Package
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
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
                    <CarouselItem
                      key={index}
                      className="pl-4 basis-full sm:basis-1/2"
                    >
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
                          <h4
                            className="text-lg font-semibold mb-2"
                            style={{ color: colors.activeTextColor }}
                          >
                            {project.title}
                          </h4>
                          <p
                            className="text-sm mb-3 flex-grow"
                            style={{ color: colors.neutralTextColor }}
                          >
                            {project.description}
                          </p>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium mt-auto"
                              style={{ color: colors.accentColor }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                  colors.neutralTextColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                  colors.accentColor)
                              }
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
                  style={{
                    backgroundColor: colors.accentColor,
                    color: colors.white,
                  }}
                />
                <CarouselNext
                  className="hidden sm:flex"
                  style={{
                    backgroundColor: colors.accentColor,
                    color: colors.white,
                  }}
                />
              </Carousel>
            </div>
          )}

          {talent.socialLinks && talent.socialLinks.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Link2
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
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
                    style={{
                      backgroundColor: colors.accentColor,
                      color: colors.white,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        colors.neutralTextColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        colors.accentColor)
                    }
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
              className="bg-transparent rounded-lg shadow-md shadow-[#16423C] p-6 border sticky top-6"
              style={{ borderColor: colors.inputBorderColor }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <DollarSign
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
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
                      style={{ color: colors.activeTextColor }}
                    >
                      {plan.type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {talent.ratePlans.map((plan) => (
                  <TabsContent
                    key={plan.type}
                    value={plan.type}
                    className="mt-4"
                  >
                    <div
                      className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                      style={{
                        borderColor: colors.accentColor,
                        background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.accentColor}10)`,
                      }}
                    >
                      <h4
                        className="text-lg font-bold mb-2"
                        style={{ color: colors.accentColor }}
                      >
                        {plan.type}
                      </h4>
                      <p
                        className="text-2xl font-extrabold mb-2"
                        style={{ color: colors.activeTextColor }}
                      >
                        ${plan.price}
                      </p>
                      <p
                        className="text-sm mb-3"
                        style={{ color: colors.neutralTextColor }}
                      >
                        {plan.description}
                      </p>
                      <ul
                        className="text-sm space-y-1 mb-3"
                        style={{ color: colors.neutralTextColor }}
                      >
                        {plan.whatsIncluded.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <Check
                              className="h-4 w-4 mr-2 flex-shrink-0"
                              style={{ color: colors.accentColor }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div
                        className="pt-3 border-t flex items-center text-sm"
                        style={{
                          borderColor: colors.inputBorderColor,
                          color: colors.neutralTextColor,
                        }}
                      >
                        <CalendarDays
                          className="h-4 w-4 mr-2"
                          style={{ color: colors.accentColor }}
                        />
                        <span>Delivery in {plan.deliveryDays} days</span>
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
                                {pendingOrders.has(plan.type)
                                  ? "Pending Order"
                                  : "Request Order"}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {pendingOrders.has(plan.type) && (
                            <TooltipContent
                              style={{
                                backgroundColor: colors.errorRed,
                                color: colors.white,
                              }}
                            >
                              You already have a pending order for the{" "}
                              {plan.type} plan.
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
