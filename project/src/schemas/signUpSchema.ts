
import { z } from "zod";

export const signUpSchema = z.object({
  userName: z
    .string()
    .min(2, { message: "Username must be at least 2 characters" })
    .max(50, { message: "Username cannot exceed 50 characters" })
    .trim(),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),

});

export type SignUpInput = z.infer<typeof signUpSchema>;
