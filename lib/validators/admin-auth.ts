import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;
