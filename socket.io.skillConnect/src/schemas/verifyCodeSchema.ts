import { z } from "zod";

export const verifyCodeSchema = z.object({
    verificationCode: z
    .string()
    .length(6, { message: "Verification code must be 6 digits" })
    .regex(/^\d+$/, { message: "Verification code must be numeric" }),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>