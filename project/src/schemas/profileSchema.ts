import { z } from "zod";

export const userProfileSchema = z.object({
  profilePicture: z.string().url({ message: "Invalid URL for profile picture" }).optional().nullable(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters" }).optional().nullable(),
  location: z.string().max(100, { message: "Location cannot exceed 100 characters" }).optional().nullable(),
  industry: z.string().max(100, { message: "Industry cannot exceed 100 characters" }).optional().nullable(),
  preferences: z.array(z.string()).optional(),
  languageProficiency: z.array(z.string()).optional(),
});

export const talentProfileSchema = z.object({
  profilePicture: z.string().url({ message: "Invalid URL for profile picture" }).optional().nullable(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters" }).optional().nullable(),
  location: z.string().max(100, { message: "Location cannot exceed 100 characters" }).optional().nullable(),
  category: z.string().min(1, { message: "Category is required" }).optional(),
  services: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  portfolio: z.array(
    z.object({
      title: z.string().min(1, { message: "Portfolio title is required" }),
      description: z.string().min(1, { message: "Portfolio description is required" }),
      imageUrl: z.string().url({ message: "Invalid image URL" }).optional().nullable(),
      projectUrl: z.string().url({ message: "Invalid project URL" }).optional().nullable(),
    })
  ).optional(),
  ratePlans: z.array(
    z.object({
      type: z.enum(["Basic", "Standard", "Premium"]),
      price: z.number().min(0, { message: "Price must be non-negative" }),
      description: z.string().min(1, { message: "Description is required" }),
      whatsIncluded: z.array(z.string()).min(1, { message: "At least one item must be included" }),
      deliveryDays: z.number().min(1, { message: "Delivery days must be at least 1" }),
      revisions: z.number().min(0, { message: "Revisions must be non-negative" }), // Added revisions field
    })
  ).optional(),
  aboutThisGig: z.string().max(1000, { message: "About this Gig cannot exceed 1000 characters" }).optional().nullable(),
  whatIOffer: z.array(z.string()).optional(),
  socialLinks: z.array(
    z.object({
      platform: z.string().min(1, { message: "Platform name is required" }),
      url: z.string().url({ message: "Invalid URL" }),
    })
  ).optional(),
  languageProficiency: z.array(z.string()).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type TalentProfileInput = z.infer<typeof talentProfileSchema>;