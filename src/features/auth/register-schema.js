import { z } from "zod";

export const registerSchema = z.strictObject({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(12, "Use at least 12 characters").max(72).refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "Password cannot exceed 72 UTF-8 bytes",
  ),
});
