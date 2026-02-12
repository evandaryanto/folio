import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { pageBlockSchema } from "./request";

// Page Schema
export const pageSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  blocks: z.array(pageBlockSchema),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
});
export type PageResponse = z.infer<typeof pageSchema>;

// Get Page Response
export const getPageResponseSchema = z.object({
  page: pageSchema,
});
export type GetPageResponse = z.infer<typeof getPageResponseSchema>;

// List Pages Response
export const listPagesResponseSchema = z.object({
  pages: z.array(pageSchema),
  pagination: paginationInfoSchema,
});
export type ListPagesResponse = z.infer<typeof listPagesResponseSchema>;

// Create Page Response
export const createPageResponseSchema = z.object({
  page: pageSchema,
});
export type CreatePageResponse = z.infer<typeof createPageResponseSchema>;

// Update Page Response
export const updatePageResponseSchema = z.object({
  page: pageSchema,
});
export type UpdatePageResponse = z.infer<typeof updatePageResponseSchema>;

// Delete Page Response
export const deletePageResponseSchema = z.object({
  success: z.boolean(),
});
export type DeletePageResponse = z.infer<typeof deletePageResponseSchema>;
