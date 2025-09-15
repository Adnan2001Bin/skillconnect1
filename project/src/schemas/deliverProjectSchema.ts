import { z } from "zod";

export const deliverProjectSchema = z.object({
  files: z.array(z.string().url()).optional().default([]),
  note: z.string().max(1000).optional(),
});