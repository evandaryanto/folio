import { z } from "zod";
import { BlockType } from "../enums";

// View block — references an existing view
export const viewBlockSchema = z.object({
  type: z.literal(BlockType.View),
  viewId: z.string().length(26),
  title: z.string().max(255).optional(),
});
export type ViewBlock = z.infer<typeof viewBlockSchema>;

// Text block — inline text content
export const textBlockSchema = z.object({
  type: z.literal(BlockType.Text),
  content: z.string(),
  format: z.enum(["plain", "markdown"]).optional().default("markdown"),
});
export type TextBlock = z.infer<typeof textBlockSchema>;

// Discriminated union of all block types
export const pageBlockSchema = z.discriminatedUnion("type", [
  viewBlockSchema,
  textBlockSchema,
]);
export type PageBlock = z.infer<typeof pageBlockSchema>;

// Create Page
export const createPageRequestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug can only contain lowercase letters, numbers, underscores, and hyphens",
    ),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  blocks: z.array(pageBlockSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});
export type CreatePageRequest = z.infer<typeof createPageRequestSchema>;

// Update Page
export const updatePageRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  blocks: z.array(pageBlockSchema).optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePageRequest = z.infer<typeof updatePageRequestSchema>;
