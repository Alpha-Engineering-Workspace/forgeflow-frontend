import { z } from "zod";

export const resendVerificationSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
});
