"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userProfileSchema } from "@/schemas/profileSchema";
import { toast } from "sonner";
import axios from "axios";
import { motion } from "framer-motion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 as Loader, ArrowRight, ArrowLeft, Info, MapPin, Briefcase, Star, Globe } from "lucide-react";
import { Images } from "@/lib/images";
import Image from "next/image";
import { ProfilePictureField } from "@/components/profile/ProfilePictureField";
import { TextField } from "@/components/profile/TextField";
import { TextareaField } from "@/components/profile/TextareaField";
import { ArrayField } from "@/components/profile/ArrayField";
import { SelectField } from "@/components/profile/SelectField";
import { ProfileProgress } from "@/components/profile/ProfileProgress";

interface UserProfileInput {
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
  industry?: string | null;
  preferences?: string[];
  languageProficiency?: string[];
  role?: "user" | "talent";
}

export default function UserProfileCompletionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      profilePicture: null,
      bio: null,
      location: null,
      industry: null,
      preferences: [],
      languageProficiency: [],
      role: "user",
    },
  });

  const progressFields = [
    "profilePicture",
    "bio",
    "location",
    "industry",
    "preferences",
    "languageProficiency",
  ];

  const fieldGroups = [
    ["profilePicture", "bio", "location"],
    ["industry", "preferences", "languageProficiency", "role"],
  ];

  const fieldLabels: { [key: string]: string } = {
    profilePicture: "Profile Picture",
    bio: "Bio",
    location: "Location",
    industry: "Industry",
    preferences: "Key Skills / Talents",
    languageProficiency: "Language Proficiency",
    role: "User Role",
  };

  const calculateCompletion = useCallback((values: UserProfileInput) => {
    let filledCount = 0;
    const filledStatus: { [key: string]: boolean } = {};

    progressFields.forEach((field) => {
      const fieldValue = values[field as keyof UserProfileInput];
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
          form.reset(response.data.data);
          setCurrentProfilePicture(response.data.data.profilePicture);
          const { percentage, filledStatus } = calculateCompletion(response.data.data);
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
      const { percentage, filledStatus } = calculateCompletion(values as UserProfileInput);
      setCompletionPercentage(percentage);
      setFilledFieldStatus(filledStatus);
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCompletion]);

  const onSubmit = async (data: UserProfileInput) => {
    try {
      const response = await axios.patch("/api/profile", data);
      if (response.data.success) {
        toast.success("Success", {
          description: "Profile updated successfully",
          className: "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setTimeout(() => {
          router.replace("/home");
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
    const isValid = await form.trigger(currentFields as (keyof UserProfileInput)[]);
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

  if (
    status !== "authenticated" ||
    (session?.user?.role !== "user" && session?.user?.role !== "talent")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9]">
        <p className="text-red-600 text-lg font-semibold">
          Access denied. Please sign in as a user or talent to complete your profile.
        </p>
      </div>
    );
  }

  const industryOptions = [
    { value: "technology", label: "Technology" },
    { value: "marketing", label: "Marketing & Advertising" },
    { value: "design", label: "Creative & Design" },
    { value: "finance", label: "Finance & Accounting" },
    { value: "education", label: "Education & Training" },
    { value: "healthcare", label: "Healthcare" },
    { value: "business", label: "Business & Consulting" },
    { value: "other", label: "Other" },
  ];

  const roleOptions = [
    { value: "user", label: "No (I'm looking for talent)" },
    { value: "talent", label: "Yes (I want to offer my skills)" },
  ];

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
              Complete Your Profile
            </h2>
            <p className="text-[#757575] text-sm sm:text-base mt-2">
              Fill in your details to tailor your SkillConnect experience.
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
                    placeholder="Tell us about yourself, your skills, and what you're looking for."
                    Icon={Info}
                  />
                  <TextField
                    control={form.control}
                    name="location"
                    label="Location"
                    placeholder="e.g., New York, USA or Remote"
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
                  <SelectField
                    control={form.control}
                    name="industry"
                    label="Industry"
                    placeholder="Select your primary industry"
                    options={industryOptions}
                    Icon={Briefcase}
                  />
                  <ArrayField
                    control={form.control}
                    name="preferences"
                    label="Key Skills / Talents"
                    placeholder="e.g., Web Development, Graphic Design, Copywriting (press comma or enter to add)"
                    Icon={Star}
                  />
                  <ArrayField
                    control={form.control}
                    name="languageProficiency"
                    label="Language Proficiency"
                    placeholder="e.g., English, Spanish, Mandarin (press comma or enter to add)"
                    Icon={Globe}
                  />
                  {session?.user?.role === "user" && (
                    <SelectField
                      control={form.control}
                      name="role"
                      label="Are you a Talent?"
                      placeholder="Select your primary role"
                      options={roleOptions}
                      Icon={Briefcase}
                    />
                  )}
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
                    className="w-[60%] bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 focus:ring-[#4CAF50] focus:ring-offset-[#F1F8E9] disabled:bg-[#757575] disabled:cursor-not-allowed text-lg"
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
                href="/home"
                className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200"
              >
                Go to Home
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}