"use client";

import { categories } from "@/lib/categoriesAndServices";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Edit,
  MapPin,
  Link2,
  Languages,
  Star,
  Check,
  DollarSign,
  Info,
  Package,
  CalendarDays,
  Briefcase,
  Verified,

} from "lucide-react";
import { toast } from "sonner";
import { Images } from "@/lib/images";
import Loader from "@/components/Loader";

interface TalentProfileInput {
  userName?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  portfolio?: {
    title: string;
    description: string;
    imageUrl?: string | null;
    projectUrl?: string | null;
  }[];
  ratePlans?: {
    type: "Basic" | "Standard" | "Premium";
    price: number;
    description: string;
    whatsIncluded: string[];
    deliveryDays: number;
    revisions: number; // Added revisions field
  }[];
  aboutThisGig?: string | null;
  whatIOffer?: string[];
  socialLinks?: { platform: string; url: string }[];
  languageProficiency?: string[];
  category?: string;
  services?: string[];
  isVerified: boolean;
  rejectionReason?: string | null;
}

export default function TalentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<TalentProfileInput | null>(null);

  // Define color variables
  const primaryColor = "#8DBCC7";
  const secondaryColor = "#A4CCD9";
  const accentColor = "#90D1CA";
  const lightAccentColor = "#C4E1E6";
  const darkTextColor = "#212121";
  const grayTextColor = "#757575";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchProfile = async () => {
        try {
          const response = await axios.get("/api/profile");
          if (response.data.success) {
            setProfileData(response.data.data);
          } else {
            toast.error("Error", {
              description: response.data.message || "Failed to load profile data.",
              className:
                "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
              duration: 4000,
            });
            router.push("/talent/dashboard");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error", {
            description: "Failed to load profile data. Please try again.",
            className:
              "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
          router.push("/talent/dashboard");
        }
      };
      fetchProfile();
    }
  }, [status, session, router]);

  // Helper function to get the category label
  const getCategoryLabel = (categoryValue: string | null | undefined) => {
    if (!categoryValue) return "";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  // Helper function to get profile status
  const getProfileStatus = () => {
    if (!profileData)
      return {
        status: "Loading",
        color: grayTextColor,
        message: "Loading profile status...",
      };
    if (profileData.isVerified) {
      return {
        status: "Approved",
        color: "#10B981",
        message: "Your profile is approved and visible to clients.",
      };
    } else if (profileData.rejectionReason) {
      return {
        status: "Rejected",
        color: "#EF4444",
        message: `Your profile was rejected. Reason: ${profileData.rejectionReason}. Please update your profile and resubmit for review.`,
      };
    } else {
      return {
        status: "Under Approval",
        color: "#F59E0B",
        message:
          "Your profile is under review by our admin team. You can still edit your profile.",
      };
    }
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-white px-4"
      >
        <Loader
          text="Loading your profile..."
          color="#000000"
          bgColor={accentColor}
          size="large"
        />
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: lightAccentColor }}
      >
        <p className="text-lg font-semibold text-red-600">
          Access denied. Please sign in as a talent to view your profile.
        </p>
      </div>
    );
  }

  const profileStatus = getProfileStatus();

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 relative max-w-[94rem] mx-auto"
      style={{
        backgroundImage: `url(${
          Images.talentProfileBackground ? Images.talentProfileBackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative z-10 mb-8 mt-19">
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => router.push("/talent/profile/edit")}
            className="font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center shadow-md"
            style={{ backgroundColor: accentColor, color: darkTextColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = secondaryColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = accentColor)
            }
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Status */}
        <div
          className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border mb-6"
          style={{ borderColor: primaryColor }}
        >
          <div className="flex items-center gap-4">
            <Badge
              style={{
                backgroundColor: profileStatus.color,
                color: "#FFFFFF",
              }}
              className="px-3 py-1 rounded-full text-sm font-medium"
            >
              {profileStatus.status}
            </Badge>
            <p style={{ color: darkTextColor }}>{profileStatus.message}</p>
          </div>
        </div>

        {/* Header: Profile Picture, Name, Category, Location */}
        <div
          className="flex flex-col items-center md:flex-row md:items-start gap-6 bg-transparent rounded-lg shadow-sm shadow-[#212121] p-6 border"
          style={{ borderColor: primaryColor }}
        >
          <div className="flex-shrink-0">
            {profileData?.profilePicture ? (
              <Image
                src={profileData.profilePicture}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 shadow-md w-32 h-32"
                style={{ borderColor: accentColor }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md"
                style={{
                  backgroundColor: primaryColor,
                  borderColor: accentColor,
                }}
              >
                <Briefcase
                  className="h-16 w-16"
                  style={{ color: darkTextColor }}
                />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1
              className="text-3xl sm:text-4xl font-bold flex items-center"
              style={{ color: darkTextColor }}
            >
              {profileData?.userName || "Your Name"}
              {profileData?.isVerified && (
                <Verified
                  className="h-6 w-6 ml-2"
                  style={{ color: accentColor }}
                />
              )}
            </h1>
            {profileData?.category && (
              <p
                className="text-lg mt-2 font-medium"
                style={{ color: grayTextColor }}
              >
                {getCategoryLabel(profileData.category)}
              </p>
            )}
            {profileData?.location && (
              <p
                className="text-md mt-2 flex items-center justify-center md:justify-start"
                style={{ color: grayTextColor }}
              >
                <MapPin
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                {profileData.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8">
        {/* Left Section: Bio, About This Gig, Skills, Portfolio, Social Links, Languages */}
        <div className="w-full lg:w-3/5 space-y-6">
          {profileData?.bio && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Info
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                Bio
              </h3>
              <p
                className="text-base"
                style={{ color: grayTextColor }}
              >
                {profileData.bio}
              </p>
            </div>
          )}

          {profileData?.aboutThisGig && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Info
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                About This Gig
              </h3>
              <p
                className="text-base"
                style={{ color: grayTextColor }}
              >
                {profileData.aboutThisGig}
              </p>
            </div>
          )}

          {profileData?.skills && profileData.skills.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Star
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: primaryColor,
                      color: darkTextColor,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = accentColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = primaryColor)
                    }
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profileData?.portfolio && profileData.portfolio.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Package
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
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
                  {profileData.portfolio.map((project, index) => (
                    <CarouselItem
                      key={index}
                      className="pl-4 basis-full sm:basis-1/2"
                    >
                      <div
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
                        style={{ borderColor: primaryColor }}
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
                            style={{ color: darkTextColor }}
                          >
                            {project.title}
                          </h4>
                          <p
                            className="text-sm mb-3 flex-grow"
                            style={{ color: grayTextColor }}
                          >
                            {project.description}
                          </p>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium mt-auto"
                              style={{ color: accentColor }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = secondaryColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = accentColor)
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
                    backgroundColor: accentColor,
                    color: darkTextColor,
                  }}
                />
                <CarouselNext
                  className="hidden sm:flex"
                  style={{
                    backgroundColor: accentColor,
                    color: darkTextColor,
                  }}
                />
              </Carousel>
            </div>
          )}

          {profileData?.socialLinks && profileData.socialLinks.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Link2
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                Social Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: accentColor,
                      color: darkTextColor,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = secondaryColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = accentColor)
                    }
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {profileData?.languageProficiency && profileData.languageProficiency.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-3 flex items-center"
                style={{ color: darkTextColor }}
              >
                <Languages
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.languageProficiency.map((language, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: primaryColor,
                      color: darkTextColor,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = accentColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = primaryColor)
                    }
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Rate Plans */}
        <div className="w-full lg:w-2/5">
          {profileData?.ratePlans && profileData.ratePlans.length > 0 && (
            <div
              className="bg-transparent rounded-lg shadow-md shadow-[#212121] p-6 border sticky top-6"
              style={{ borderColor: primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: darkTextColor }}
              >
                <DollarSign
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                Rate Plans
              </h3>
              <Tabs defaultValue={profileData.ratePlans[0]?.type} className="w-full">
                <TabsList
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${profileData.ratePlans.length}, minmax(0, 1fr))`,
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                  }}
                >
                  {profileData.ratePlans.map((plan) => (
                    <TabsTrigger
                      key={plan.type}
                      value={plan.type}
                      className="data-[state=active]:bg-accent data-[state=active]:text-dark font-medium py-1 px-4 rounded-md transition-colors duration-200"
                      style={{ color: darkTextColor }}
                    >
                      {plan.type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {profileData.ratePlans.map((plan) => (
                  <TabsContent
                    key={plan.type}
                    value={plan.type}
                    className="mt-4"
                  >
                    <div
                      className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                      style={{
                        borderColor: accentColor,
                        background: `linear-gradient(to bottom right, ${primaryColor}10, ${accentColor}10)`,
                      }}
                    >
                      <h4
                        className="text-lg font-bold mb-2"
                        style={{ color: accentColor }}
                      >
                        {plan.type}
                      </h4>
                      <p
                        className="text-2xl font-extrabold mb-2"
                        style={{ color: darkTextColor }}
                      >
                        ${plan.price}
                      </p>
                      <p
                        className="text-sm mb-3"
                        style={{ color: grayTextColor }}
                      >
                        {plan.description}
                      </p>
                      <ul
                        className="text-sm space-y-1 mb-3"
                        style={{ color: grayTextColor }}
                      >
                        {plan.whatsIncluded.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <Check
                              className="h-4 w-4 mr-2 flex-shrink-0"
                              style={{ color: accentColor }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div
                        className="pt-3 border-t flex items-center text-sm"
                        style={{
                          borderColor: primaryColor,
                          color: grayTextColor,
                        }}
                      >
                        <CalendarDays
                          className="h-4 w-4 mr-2"
                          style={{ color: accentColor }}
                        />
                        <span>Delivery in {plan.deliveryDays} days</span>
                      </div>
                      <div
                        className="pt-3 border-t flex items-center text-sm"
                        style={{
                          borderColor: primaryColor,
                          color: grayTextColor,
                        }}
                      >
                        <Star
                          className="h-4 w-4 mr-2"
                          style={{ color: accentColor }}
                        />
                        <span>{plan.revisions} Revisions</span>
                      </div>
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