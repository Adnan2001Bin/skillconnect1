import { z } from "zod";

export const createOrderSchema = z.object({
  talentId: z.string().min(1, "Talent ID is required"),
  ratePlan: z.object({
    type: z.enum(["Basic", "Standard", "Premium"], {
      errorMap: () => ({ message: "Rate plan type must be Basic, Standard, or Premium" }),
    }),
    description: z.string().min(1, "Description is required"),
    price: z.number().min(0, "Price must be a positive number"),
    whatsIncluded: z.array(z.string()).min(1, "At least one item must be included"),
    deliveryDays: z.number().int().min(1, "Delivery days must be at least 1"),
    revisions: z.number().int().min(0, "Revisions must be a non-negative integer"), // Added revisions field
  }),
  projectDetails: z.object({
    title: z.string().min(1, "Project title is required"),
    description: z.string().min(1, "Project description is required"),
  }),
});