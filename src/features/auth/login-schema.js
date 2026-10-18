import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1, "Enter your password").max(200),
});
