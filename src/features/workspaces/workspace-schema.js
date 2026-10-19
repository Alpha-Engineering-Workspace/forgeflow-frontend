import { z } from 'zod';

export const workspaceSchema = z.strictObject({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(120, 'Use at most 120 characters.'),
});

export const uuidSchema = z.uuid();
