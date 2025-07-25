"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SocialLinkSection } from "@/components/profile/SocialLinkSection";
import { talentProfileSchema, TalentProfileInput } from "@/schemas/profileSchema";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { RatePlanSection } from "@/components/profile/RatePlanSection";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { SelectField } from "@/components/profile/SelectField";
import { TextareaField } from "@/components/profile/TextareaField";
import { TextField } from "@/components/profile/TextField";
import { MultiSelect } from "@/components/talent/MultiSelect";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, User, Book, Star, Link } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Images } from "@/lib/images";
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { ProfilePictureField } from "@/components/profile/ProfilePictureField";
import { ArrayField } from "@/components/profile/ArrayField";
import Image from "next/image";

export default function TalentProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<
    { title: string; description: string; imageUrl?: string | null; projectUrl?: string | null }[]
  >([]);
  const [ratePlans, setRatePlans] = useState<
    { type: "Basic" | "Standard" | "Premium"; price: number; description: string; whatsIncluded: string[]; deliveryDays: number }[]
  >([]);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
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
      socialLinks: [],
      languageProficiency: [],
      category: "",
      services: [],
    },
    reValidateMode: "onBlur",
  });

  const progressFields = [
    "profilePicture",
    "bio",
    "location",
    "category",
    "services",
    "skills",
    "portfolio",
    "ratePlans",
    "aboutThisGig",
    "whatIOffer",
    "socialLinks",
    "languageProficiency",
  ];

  const fieldLabels: { [key: string]: string } = {
    profilePicture: "Profile Picture",
    bio: "Bio",
    location: "Location",
    category: "Category",
    services: "Services",
    skills: "Skills",
    portfolio: "Portfolio",
    ratePlans: "Rate Plans",
    aboutThisGig: "About This Gig",
    whatIOffer: "What I Offer",
    socialLinks: "Social Links",
    languageProficiency: "Language Proficiency",
  };

  const steps = [
    { title: "Personal Info", fields: ["profilePicture", "bio", "location"] },
    { title: "Category & Services", fields: ["category", "services"] },
    { title: "Skills & Portfolio", fields: ["skills", "portfolio"] },
    { title: "Gig Details", fields: ["ratePlans", "aboutThisGig", "whatIOffer"] },
    { title: "Social & Language", fields: ["socialLinks", "languageProficiency"] },
  ];

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchProfileAndLoadLocal = async () => {
        try {
          const response = await axios.get("/api/profile");
          let data = response.data.data || {};

          if (typeof window !== "undefined") {
            const savedFormData = localStorage.getItem("talentProfileDraft");
            if (savedFormData) {
              try {
                const draft = JSON.parse(savedFormData);
                data = {
                  ...data,
                  ...Object.fromEntries(
                    Object.entries(draft).filter(([_, value]) =>
                      Array.isArray(value) ? value.length > 0 : !!value
                    )
                  ),
                };
              } catch (parseError) {
                console.error("Error parsing saved form data:", parseError);
                localStorage.removeItem("talentProfileDraft");
              }
            }
          }

          form.reset({
            ...data,
            category: data.category || "",
            services: data.services || [],
            portfolio: data.portfolio || [],
            ratePlans: data.ratePlans || [],
            socialLinks: data.socialLinks || [],
            skills: data.skills || [],
            whatIOffer: data.whatIOffer || [],
            languageProficiency: data.languageProficiency || [],
          });
          setCurrentProfilePicture(data.profilePicture || null);
          setPortfolioItems(data.portfolio || []);
          setRatePlans(data.ratePlans || []);
          setSocialLinks(data.socialLinks || []);
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error fetching profile", {
            description: "Failed to load profile data. Please try again.",
            className: "bg-red-700 text-white border-red-800 bg-opacity-80",
            duration: 4000,
          });
        }
      };
      fetchProfileAndLoadLocal();
    }
  }, [status, session, form]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const subscription = form.watch((value, { name }) => {
        if (name) {
          localStorage.setItem("talentProfileDraft", JSON.stringify(value));
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form]);

  useEffect(() => {
    const calculateCompletion = () => {
      const filledFields = progressFields.filter((field) => {
        const value = form.getValues(field as keyof TalentProfileInput);
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
      });
      const percentage = Math.round((filledFields.length / progressFields.length) * 100);
      setCompletionPercentage(percentage);
    };
    calculateCompletion();
    const subscription = form.watch(() => calculateCompletion());
    return () => subscription.unsubscribe();
  }, [form]);

  const handleNextStep = async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await form.trigger(currentFields as (keyof TalentProfileInput)[]);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      console.log("Validation errors:", form.formState.errors);
      toast.error("Validation Error", {
        description: "Please fill out all required fields correctly before proceeding.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentProfileDraft");
    }
    router.push("/talent/profile");
  };

  const onSubmit = async (data: TalentProfileInput) => {
    console.log("Submitting profile data:", data);
    try {
      const response = await axios.patch("/api/profile", data);
      if (response.data.success) {
        toast.success("Profile Updated", {
          description: "Your profile has been successfully updated.",
          className: "bg-[#8DBCC7] text-white border-[#90D1CA] shadow-lg",
          duration: 4000,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("talentProfileDraft");
        }
        router.push("/talent/profile");
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Update Failed", {
        description: "Failed to update profile. Please try again.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <div className="animate-spin h-16 w-16 text-[#8DBCC7] mr-4" />
        <p className="text-[#212121] text-2xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-red-600 text-xl font-bold">Access denied. Please sign in as a talent.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-start px-4 py-6 sm:py-8 md:py-12 lg:py-16 relative">
      <div className="absolute inset-0 z-0">
        <Image
          src={Images.talentProfileBackground}
          alt="Abstract digital background"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="opacity-40"
        />
      </div>
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-transparent">
        <ProfileProgress
          completionPercentage={completionPercentage}
          filledFieldStatus={progressFields.reduce((acc, field) => {
            const value = form.getValues(field as keyof TalentProfileInput);
            acc[field] = Array.isArray(value) ? value.length > 0 : !!value;
            return acc;
          }, {} as { [key: string]: boolean })}
          fieldLabels={fieldLabels}
          progressFields={progressFields}
        />
        <div className="flex-1 p-6 sm:p-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-r-2xl">
          <h1 className="text-3xl font-bold text-[#212121] mb-6">Edit Your Talent Profile</h1>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {steps[currentStep].fields.includes("profilePicture") && (
                <ProfilePictureField
                  control={form.control}
                  name="profilePicture"
                  label="Profile Picture"
                  currentProfilePicture={currentProfilePicture}
                  setCurrentProfilePicture={setCurrentProfilePicture}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              )}
              {steps[currentStep].fields.includes("bio") && (
                <TextField
                  control={form.control}
                  name="bio"
                  label="Bio"
                  placeholder="Tell us about yourself"
                  Icon={User}
                />
              )}
              {steps[currentStep].fields.includes("location") && (
                <TextField
                  control={form.control}
                  name="location"
                  label="Location"
                  placeholder="Your city or country"
                  Icon={MapPin}
                />
              )}
              {steps[currentStep].fields.includes("category") && (
                <SelectField
                  control={form.control}
                  name="category"
                  label="Category"
                  placeholder="Select your category"
                  options={categories}
                  Icon={Briefcase}
                />
              )}
              {steps[currentStep].fields.includes("services") && (
                <MultiSelect
                  control={form.control}
                  name="services"
                  label="Services"
                  placeholder="Select services"
                  options={
                    form.watch("category") &&
                    servicesByCategory[form.watch("category") as keyof typeof servicesByCategory]
                      ? servicesByCategory[
                          form.watch("category") as keyof typeof servicesByCategory
                        ].map((service: string) => ({
                          value: service,
                          label: service,
                        }))
                      : []
                  }
                  Icon={Star}
                />
              )}
              {steps[currentStep].fields.includes("skills") && (
                <ArrayField
                  control={form.control}
                  name="skills"
                  label="Skills"
                  placeholder="Add your skills (e.g., React, Node.js)"
                  Icon={Star}
                />
              )}
              {steps[currentStep].fields.includes("portfolio") && (
                <PortfolioSection
                  portfolioItems={portfolioItems}
                  setPortfolioItems={setPortfolioItems}
                  form={form}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              )}
              {steps[currentStep].fields.includes("ratePlans") && (
                <RatePlanSection
                  ratePlans={ratePlans}
                  setRatePlans={setRatePlans}
                  form={form}
                />
              )}
              {steps[currentStep].fields.includes("aboutThisGig") && (
                <TextareaField
                  control={form.control}
                  name="aboutThisGig"
                  label="About This Gig"
                  placeholder="Describe what you offer in your gig"
                  Icon={Book}
                />
              )}
              {steps[currentStep].fields.includes("whatIOffer") && (
                <ArrayField
                  control={form.control}
                  name="whatIOffer"
                  label="What I Offer"
                  placeholder="Add what you offer (e.g., Custom websites, SEO)"
                  Icon={Star}
                />
              )}
              {steps[currentStep].fields.includes("socialLinks") && (
                <SocialLinkSection
                  socialLinks={socialLinks}
                  setSocialLinks={setSocialLinks}
                  form={form}
                />
              )}
              {steps[currentStep].fields.includes("languageProficiency") && (
                <ArrayField
                  control={form.control}
                  name="languageProficiency"
                  label="Language Proficiency"
                  placeholder="Add languages (e.g., English, Spanish)"
                  Icon={User}
                />
              )}
              <div className="flex justify-between mt-8">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    className="bg-[#757575] hover:bg-[#616161] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      onClick={handlePreviousStep}
                      className="bg-[#757575] hover:bg-[#616161] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                      disabled={isUploading}
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    if (currentStep < steps.length - 1) {
                      await handleNextStep();
                    } else {
                      await form.handleSubmit(onSubmit)();
                    }
                  }}
                  className="bg-[#8DBCC7] hover:bg-[#90D1CA] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  disabled={isUploading}
                >
                  {currentStep < steps.length - 1 ? "Next" : "Save Profile"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}