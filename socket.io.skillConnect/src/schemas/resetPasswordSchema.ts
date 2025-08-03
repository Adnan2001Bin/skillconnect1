import { z } from "zod";

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  token: z.string().nullable().optional(), // Allow string, null, or undefined
  action: z.enum(["request", "reset"]),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;