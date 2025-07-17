import { z } from 'zod';

const emailConfigSchema = z.object({
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.number().int().min(1, 'SMTP_PORT must be a valid port number'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SENDER_EMAIL: z.string().email('SENDER_EMAIL must be a valid email address'),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export const getEmailConfig = (): EmailConfig => {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
  };

  try {
    return emailConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(', ');
      throw new Error(`Email configuration error: ${errorMessage}`);
    }
    throw new Error('Unknown error validating email configuration');
  }
};