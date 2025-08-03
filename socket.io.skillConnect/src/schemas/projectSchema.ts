import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must not exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must not exceed 1000 characters"),
  category: z.string().nonempty("Category is required"),
  services: z.array(z.string()).min(1, "At least one service is required"),
  budget: z.number().min(10, "Budget must be at least $10").max(100000, "Budget must not exceed $100,000"),
  timeline: z.number().min(1, "Timeline must be at least 1 day").max(365, "Timeline must not exceed 365 days"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters").max(1000, "Requirements must not exceed 1000 characters"),
  files: z.array(z.string()).optional(),
});