"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { talentProfileSchema } from "@/schemas/profileSchema";
import { toast } from "sonner";
import axios from "axios";
import { motion } from "framer-motion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 as Loader, ArrowRight, ArrowLeft, Info, MapPin, Code, Briefcase, Star, Globe, Book } from "lucide-react";
import { Images } from "@/lib/images";
import Image from "next/image";
import { ProfilePictureField } from "@/components/profile/ProfilePictureField";
import { TextField } from "@/components/profile/TextField";
import { TextareaField } from "@/components/profile/TextareaField";
import { ArrayField } from "@/components/profile/ArrayField";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { RatePlanSection } from "@/components/profile/RatePlanSection";
import { SocialLinkSection } from "@/components/profile/SocialLinkSection";
import { ProfileProgress } from "@/components/profile/ProfileProgress";

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
  education?: string[];
  experience?: string[];
  socialLinks?: { platform: string; url: string }[];
  languageProficiency?: string[];
}

export default function TalentProfileCompletionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<
    {
      title: string;
      description: string;
      imageUrl?: string | null;
      projectUrl?: string | null;
    }[]
  >([]);
  const [ratePlans, setRatePlans] = useState<
    {
      type: "Basic" | "Standard" | "Premium";
      price: number;
      description: string;
      whatsIncluded: string[];
      deliveryDays: number;
    }[]
  >([]);
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([]);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<TalentProfileInput>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      profilePicture: null,
      bio: null,
      location: null,
      skills: [],
      portfolio: [],
      ratePlans: [],
      aboutThisGig: null,
      whatIOffer: [],
      education: [],
      experience: [],
      socialLinks: [],
      languageProficiency: [],
    },
  });

  const progressFields = [
    "profilePicture",
    "bio",
    "location",
    "skills",
    "portfolio",
    "ratePlans",
    "aboutThisGig",
    "whatIOffer",
    "education",
    "experience",
    "socialLinks",
    "languageProficiency",
  ];

  const fieldGroups = [
    ["profilePicture", "bio", "location"],
    ["skills", "portfolio"],
    ["ratePlans", "aboutThisGig", "whatIOffer"],
    ["education", "experience", "socialLinks", "languageProficiency"],
  ];

  const fieldLabels: { [key: string]: string } = {
    profilePicture: "Profile Picture",
    bio: "Bio",
    location: "Location",
    skills: "Skills",
    portfolio: "Portfolio",
    ratePlans: "Rate Plans",
    aboutThisGig: "About This Gig",
    whatIOffer: "What I Offer",
    education: "Education",
    experience: "Experience",
    socialLinks: "Social Links",
    languageProficiency: "Language Proficiency",
  };

  const calculateCompletion = useCallback((values: TalentProfileInput) => {
    let filledCount = 0;
    const filledStatus: { [key: string]: boolean } = {};

    progressFields.forEach((field) => {
      const fieldValue = values[field as keyof TalentProfileInput];
      let isFilled = false;
      if (Array.isArray(fieldValue)) {
        isFilled = fieldValue.length > 0;
      } else {
        isFilled = !!fieldValue;
      }
      filledStatus[field] = isFilled;
      if (isFilled) {
        filledCount++;
      }
    });

    const percentage = Math.round((filledCount / progressFields.length) * 100);
    return { percentage, filledStatus };
  }, []);

  const [filledFieldStatus, setFilledFieldStatus] = useState<{
    [key: string]: boolean;
  }>(progressFields.reduce((acc, field) => ({ ...acc, [field]: false }), {}));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/profile");
        if (response.data.success) {
          const profileData = response.data.data;
          form.reset(profileData);
          setCurrentProfilePicture(profileData.profilePicture);
          setPortfolioItems(profileData.portfolio || []);
          setRatePlans(profileData.ratePlans || []);
          setSocialLinks(profileData.socialLinks || []);
          const { percentage, filledStatus } = calculateCompletion(profileData);
          setCompletionPercentage(percentage);
          setFilledFieldStatus(filledStatus);
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
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, form, calculateCompletion]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      const { percentage, filledStatus } = calculateCompletion(values as TalentProfileInput);
      setCompletionPercentage(percentage);
      setFilledFieldStatus(filledStatus);
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCompletion]);

  const onSubmit = async (data: TalentProfileInput) => {
    try {
      const response = await axios.patch("/api/profile", {
        ...data,
        portfolio: portfolioItems,
        ratePlans: ratePlans,
        socialLinks: socialLinks,
      });
      if (response.data.success) {
        toast.success("Success", {
          description: "Profile updated successfully",
          className: "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setTimeout(() => {
          router.replace("/dashboard");
        }, 2000);
      } else {
        toast.error("Error", {
          description: response.data.message,
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      toast.error("Error", {
        description: "Failed to update profile. Please try again.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handleNextStep = async () => {
    const currentFields = fieldGroups[currentStep];
    const isValid = await form.trigger(currentFields as (keyof TalentProfileInput)[]);
    if (isValid && currentStep < fieldGroups.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (!isValid) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields for this section.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9]">
        <Loader className="animate-spin h-8 w-8 text-[#2E7D32] mr-2" />
        <p className="text-[#212121] text-lg font-semibold">
          Loading your SkillConnect journey...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9]">
        <p className="text-red-600 text-lg font-semibold">
          Access denied. Please sign in as a talent to complete your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9] px-4 py-6 sm:py-8 md:py-12 lg:py-16 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={Images.workspaceBackground}
          alt="Abstract digital background"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32]/50 to-transparent"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white"
      >
        <ProfileProgress
          completionPercentage={completionPercentage}
          filledFieldStatus={filledFieldStatus}
          fieldLabels={fieldLabels}
          progressFields={progressFields}
        />
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#212121] mb-2 leading-tight">
              Complete Your Talent Profile
            </h2>
            <p className="text-[#757575] text-sm sm:text-base mt-2">
              Fill in your details to showcase your skills on SkillConnect.
            </p>
            <p className="text-[#4CAF50] font-semibold mt-2">
              Step {currentStep + 1} of {fieldGroups.length}
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  <ProfilePictureField
                    control={form.control}
                    name="profilePicture"
                    label="Profile Picture"
                    currentProfilePicture={currentProfilePicture}
                    setCurrentProfilePicture={setCurrentProfilePicture}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                  <TextareaField
                    control={form.control}
                    name="bio"
                    label="Bio"
                    placeholder="Tell us about your experience, expertise, and what makes you unique as a talent."
                    Icon={Info}
                  />
                  <TextField
                    control={form.control}
                    name="location"
                    label="Location"
                    placeholder="e.g., London, UK or Remote"
                    Icon={MapPin}
                  />
                </motion.div>
              )}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  <ArrayField
                    control={form.control}
                    name="skills"
                    label="Skills"
                    placeholder="e.g., React, UI/UX Design, Copywriting (press comma or enter to add)"
                    Icon={Code}
                  />
                  <PortfolioSection
                    portfolioItems={portfolioItems}
                    setPortfolioItems={setPortfolioItems}
                    form={form}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  <RatePlanSection
                    ratePlans={ratePlans}
                    setRatePlans={setRatePlans}
                    form={form}
                  />
                  <TextareaField
                    control={form.control}
                    name="aboutThisGig"
                    label="About This Gig"
                    placeholder="Provide a detailed description of the services you offer in your gig."
                    Icon={Briefcase}
                  />
                  <ArrayField
                    control={form.control}
                    name="whatIOffer"
                    label="What I Offer"
                    placeholder="e.g., Custom Website Design, SEO Optimization, Content Writing (press comma or enter to add)"
                    Icon={Star}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  <ArrayField
                    control={form.control}
                    name="education"
                    label="Education"
                    placeholder="e.g., BSc in Computer Science, University of XYZ (press comma or enter to add)"
                    Icon={Book}
                  />
                  <ArrayField
                    control={form.control}
                    name="experience"
                    label="Experience"
                    placeholder="e.g., Senior Web Developer at Acme Corp (press comma or enter to add)"
                    Icon={Briefcase}
                  />
                  <SocialLinkSection
                    socialLinks={socialLinks}
                    setSocialLinks={setSocialLinks}
                    form={form}
                  />
                  <ArrayField
                    control={form.control}
                    name="languageProficiency"
                    label="Language Proficiency"
                    placeholder="e.g., English (Fluent), Spanish (Conversational) (press comma or enter to add)"
                    Icon={Globe}
                  />
                </motion.div>
              )}
              <div className="flex justify-between items-center mt-6">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    onClick={handlePreviousStep}
                    className="bg-[#757575] hover:bg-[#616161] text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" /> Previous
                  </Button>
                )}
                {currentStep < fieldGroups.length - 1 && (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="ml-auto bg-[#4CAF50] hover:bg-[#2E7D32] text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center"
                  >
                    Next <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
                {currentStep === fieldGroups.length - 1 && (
                  <Button
                    type="submit"
                    className="w-[60%] bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 focus:ring-[#4CAF50] focus:ring-offset-[#F1F8E9] disabled:bg-[#757575] disabled:cursor-not-allowed text-md"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader className="animate-spin mr-2 h-5 w-5" />
                        Saving Profile...
                      </span>
                    ) : (
                      "Save My SkillConnect Profile"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <p className="text-[#757575] text-sm">
              Decide later?{" "}
              <a
                href="/dashboard"
                className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200"
              >
                Go to Dashboard
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}