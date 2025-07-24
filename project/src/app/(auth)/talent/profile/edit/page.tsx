"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { talentProfileSchema } from "@/schemas/profileSchema"; // Ensure this schema is defined
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ProfilePictureField } from "@/components/profile/ProfilePictureField"; // Ensure these components exist and are styled
import { TextField } from "@/components/profile/TextField";
import { TextareaField } from "@/components/profile/TextareaField";
import { ArrayField } from "@/components/profile/ArrayField";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { RatePlanSection } from "@/components/profile/RatePlanSection";
import { SocialLinkSection } from "@/components/profile/SocialLinkSection";
import { Loader2 as Loader, Save, X, Info, MapPin, Code, Briefcase, Star, Book, Globe } from "lucide-react";

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
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([]);

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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const fetchProfile = async () => {
        try {
          const response = await axios.get("/api/profile");
          if (response.data.success) {
            const data = response.data.data;
            form.reset(data);
            setCurrentProfilePicture(data.profilePicture);
            setPortfolioItems(data.portfolio || []);
            setRatePlans(data.ratePlans || []);
            setSocialLinks(data.socialLinks || []);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error fetching profile", {
            description: "Failed to load profile data. Please try again.",
            className: "bg-[#F44336] text-white border-[#D32F2F] backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
        }
      };
      fetchProfile();
    }
  }, [status, session, form]);

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
          description: "Profile updated successfully!",
          className: "bg-[#8DBCC7] text-white border-[#90D1CA] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        router.push("/talent/profile");
      } else {
        toast.error("Error", {
          description: response.data.message,
          className: "bg-[#F44336] text-white border-[#D32F2F] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      toast.error("Error", {
        description: "Failed to update profile. Please try again.",
        className: "bg-[#F44336] text-white border-[#D32F2F] backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#C4E1E6] p-4"> {/* Added p-4 for padding on small screens */}
        <Loader className="animate-spin h-10 w-10 text-[#8DBCC7] mr-3" />
        <p className="text-[#212121] text-xl font-semibold text-center"> {/* Added text-center */}
          Loading your profile for editing...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#C4E1E6] p-4"> {/* Added p-4 for padding */}
        <p className="text-[#F44336] text-lg font-semibold text-center"> {/* Added text-center */}
          Access denied. Please sign in as a talent to edit your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 lg:py-16 bg-[#C4E1E6] p-4"> {/* Added p-4 for overall padding */}
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-6 sm:p-8 bg-white rounded-xl shadow-xl border-t-4 border-[#8DBCC7]"> {/* Adjusted max-width and padding */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8"> {/* Changed to flex-col on small screens */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#212121] mb-4 sm:mb-0 text-center sm:text-left"> {/* Adjusted font size and text alignment */}
            Edit Your Talent Profile
          </h2>
          <Button
            onClick={() => router.push("/talent/profile")}
            className="w-full sm:w-auto bg-[#757575] hover:bg-[#616161] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center text-base"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8"> {/* Adjusted vertical spacing */}
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
            <Button
              type="submit"
              className="w-full bg-[#8DBCC7] hover:bg-[#A4CCD9] text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:bg-[#A4CCD9] disabled:cursor-not-allowed text-lg flex items-center justify-center"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin mr-2 h-6 w-6" />
                  Saving Profile...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save className="mr-2 h-6 w-6" />
                  Save Profile
                </span>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}