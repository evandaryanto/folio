import { z } from "zod";

// Create Collection
export const createCollectionRequestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
});
export type CreateCollectionRequest = z.infer<
  typeof createCollectionRequestSchema
>;

// Update Collection
export const updateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCollectionRequest = z.infer<
  typeof updateCollectionRequestSchema
>;
