import { z } from "zod";

export const createOrderSchema = z.object({
  talentId: z.string().min(1, "Talent ID is required"),
  ratePlan: z.object({
    type: z.string().min(1, "Rate plan type is required"),
    price: z.number().min(0, "Price must be non-negative"),
    description: z.string().min(1, "Rate plan description is required"),
    whatsIncluded: z.array(z.string()).optional(),
    deliveryDays: z.number().min(1, "Delivery days must be positive"),
  }),
  projectDetails: z.object({
    title: z.string().min(1, "Project title is required"),
    description: z.string().min(1, "Project description is required"),
  }),
});