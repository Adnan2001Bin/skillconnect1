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
  Loader2 as Loader,
  Edit,
  MapPin,
  Link2,
  Languages,
  Star,
  User,
  Check,
  DollarSign,
  Info,
  Package,
  CalendarDays,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Images } from "@/lib/images";

interface TalentProfileInput {
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
  }[];
  aboutThisGig?: string | null;
  whatIOffer?: string[];
  socialLinks?: { platform: string; url: string }[];
  languageProficiency?: string[];
  category?: string;
  services?: string[];
  isVerified: boolean; // Added field
  rejectionReason?: string | null; // Added field
}

export default function TalentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<TalentProfileInput | null>(null);

  // Define new color variables
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
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error fetching profile", {
            description: "Failed to load profile data. Please try again.",
            className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        }
      };
      fetchProfile();
    }
  }, [status, session]);

  // Helper function to get the category label
  const getCategoryLabel = (categoryValue: string | null | undefined) => {
    if (!categoryValue) return "";
    const foundCategory = categories.find(cat => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  // Helper function to get profile status
  const getProfileStatus = () => {
    if (!profileData) return { status: "Loading", color: grayTextColor, message: "Loading profile status..." };
    if (profileData.isVerified) {
      return { status: "Approved", color: "#10B981", message: "Your profile is approved and visible to clients." };
    } else if (profileData.rejectionReason) {
      return { 
        status: "Rejected", 
        color: "#EF4444", 
        message: `Your profile was rejected. Reason: ${profileData.rejectionReason}. Please update your profile and resubmit for review.` 
      };
    } else {
      return { status: "Under Approval", color: "#F59E0B", message: "Your profile is under review by our admin team. You can still edit your profile." };
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: lightAccentColor }}>
        <Loader className="animate-spin h-10 w-10 mr-3" style={{ color: primaryColor }} />
        <p className="text-xl font-semibold" style={{ color: darkTextColor }}>
          Loading your profile...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: lightAccentColor }}>
        <p className="text-lg font-semibold text-red-600">
          Access denied. Please sign in as a talent to view your profile.
        </p>
      </div>
    );
  }

  const profileStatus = getProfileStatus();

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 mt-17 relative max-w-7xl mx-auto shadow-xl rounded-lg overflow-hidden border border-gray-200"
      style={{
        backgroundImage: `url(${
          Images.talentProfileBackground
            ? Images.talentProfileBackground.src
            : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 z-0"></div>

      <div className="relative z-10 p-6 lg:p-10 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 flex-shrink-0">
          <div className="bg-transparent rounded-lg shadow-gray-600 shadow-lg p-6 pb-8 border text-center relative pt-20 Card" style={{ borderColor: secondaryColor }}>
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              {profileData?.profilePicture ? (
                <Image
                  src={profileData.profilePicture}
                  alt="Profile Picture"
                  width={140}
                  height={140}
                  className="rounded-full object-cover border-4 shadow-lg h-[8.75rem] w-[8.75rem]"
                  style={{ borderColor: lightAccentColor }}
                />
              ) : (
                <div className="w-[8.75rem] h-[8.75rem] rounded-full flex items-center justify-center border-4 shadow-lg" style={{ backgroundColor: lightAccentColor, borderColor: primaryColor }}>
                  <User className="h-20 w-20 text-white" />
                </div>
              )}
            </div>

            <h1 className="mt-6 text-3xl font-bold text-gray-800">
              {session?.user?.userName || "Talent Name"}
            </h1>
            {profileData?.category && (
              <p className="text-lg mt-2 font-medium" style={{ color: grayTextColor }}>
                {getCategoryLabel(profileData.category)}
              </p>
            )}
            {profileData?.location && (
              <p className="text-md mt-3 flex items-center justify-center" style={{ color: grayTextColor }}>
                <MapPin className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                {profileData.location}
              </p>
            )}

            <hr className="my-6 border-t border-gray-200" />

            {profileData?.socialLinks && profileData.socialLinks.length > 0 && (
              <div className="text-left mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Link2 className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                  Social Links
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profileData.socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-white px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium shadow-sm"
                      style={{ backgroundColor: secondaryColor, transitionProperty: "background-color", transitionDuration: "200ms" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {profileData?.languageProficiency && profileData.languageProficiency.length > 0 && (
              <div className="text-left mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Languages className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.languageProficiency.map((lang, index) => (
                    <Badge
                      key={index}
                      className="text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
                      style={{ backgroundColor: lightAccentColor, transitionProperty: "background-color", transitionDuration: "200ms" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = lightAccentColor}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button
                onClick={() => router.push("/talent/profile/edit")}
                className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 space-y-8">
          {/* Profile Status Section */}
          <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="h-6 w-6 mr-2" style={{ color: profileStatus.color }} />
              Profile Status
            </h3>
            <p className="text-lg font-medium" style={{ color: profileStatus.color }}>
              {profileStatus.status}
            </p>
            <p className="text-gray-700 leading-relaxed text-md mt-2">
              {profileStatus.message}
            </p>
            {!profileData?.isVerified && (
              <Button
                onClick={() => router.push("/talent/profile/edit")}
                className="mt-4 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <Edit className="h-5 w-5 mr-2" />
                {profileData?.rejectionReason ? "Revise Profile" : "Complete Profile"}
              </Button>
            )}
          </div>

          {profileData?.category && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Briefcase className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                Category
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">{getCategoryLabel(profileData.category)}</p>
            </div>
          )}

          {profileData?.services && profileData.services.length > 0 && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Star className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                Services
              </h3>
              <div className="flex flex-wrap gap-3">
                {profileData.services.map((service, index) => (
                  <Badge
                    key={index}
                    className="text-gray-800 px-4 py-2 rounded-full text-base font-medium shadow-sm"
                    style={{ backgroundColor: lightAccentColor, transitionProperty: "background-color", transitionDuration: "200ms" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = lightAccentColor}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profileData?.skills && profileData.skills.length > 0 && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Star className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {profileData.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="text-gray-800 px-4 py-2 rounded-full text-base font-medium shadow-sm"
                    style={{ backgroundColor: lightAccentColor, transitionProperty: "background-color", transitionDuration: "200ms" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = lightAccentColor}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profileData?.aboutThisGig && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Info className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                About This Gig
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">{profileData.aboutThisGig}</p>
            </div>
          )}

          {profileData?.whatIOffer && profileData.whatIOffer.length > 0 && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Check className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                What I Offer
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-gray-700">
                {profileData.whatIOffer.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profileData?.ratePlans && profileData.ratePlans.length > 0 && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <DollarSign className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                My Rate Plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileData.ratePlans.map((plan, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full"
                    style={{ borderColor: accentColor, background: `linear-gradient(to bottom right, ${lightAccentColor}10, ${secondaryColor}10)` }}
                  >
                    <div>
                      <h4 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
                        {plan.type}
                      </h4>
                      <p className="text-3xl font-extrabold text-gray-900 mb-3">${plan.price}</p>
                      <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                      <ul className="text-gray-700 space-y-1 mb-4 text-sm">
                        {plan.whatsIncluded.map((item, i) => (
                          <li key={i} className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto pt-4 border-t flex items-center text-sm text-gray-600" style={{ borderColor: lightAccentColor }}>
                      <CalendarDays className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                      <span>Delivery in {plan.deliveryDays} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileData?.portfolio && profileData.portfolio.length > 0 && (
            <div className="bg-transparent rounded-lg shadow-lg shadow-gray-400 p-6 border" style={{ borderColor: secondaryColor }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Package className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
                My Portfolio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {profileData.portfolio.map((project, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    style={{ borderColor: lightAccentColor }}
                  >
                    {project.imageUrl && (
                      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={project.imageUrl}
                          alt={project.title}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-t-lg"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="text-xl font-semibold text-gray-800 mb-2">{project.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center font-medium text-sm transition-colors duration-200"
                          style={{ color: primaryColor }}
                          onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                          onMouseLeave={(e) => e.currentTarget.style.color = primaryColor}
                        >
                          View Project <Link2 className="h-4 w-4 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!profileData && (
            <div className="text-center py-10 rounded-lg shadow-inner border border-dashed" style={{ backgroundColor: lightAccentColor, borderColor: primaryColor }}>
              <p className="text-lg" style={{ color: grayTextColor }}>
                No detailed profile data available yet. <br /> Click "Edit Profile" to set up your comprehensive profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}