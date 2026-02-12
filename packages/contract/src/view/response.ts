import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { ViewType } from "../enums";
import { viewConfigSchema } from "./request";

// View Schema
export const viewSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  compositionId: ulidSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  viewType: z.nativeEnum(ViewType),
  config: viewConfigSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
});
export type ViewResponse = z.infer<typeof viewSchema>;

// Get View Response
export const getViewResponseSchema = z.object({
  view: viewSchema,
});
export type GetViewResponse = z.infer<typeof getViewResponseSchema>;

// List Views Response
export const listViewsResponseSchema = z.object({
  views: z.array(viewSchema),
  pagination: paginationInfoSchema,
});
export type ListViewsResponse = z.infer<typeof listViewsResponseSchema>;

// Create View Response
export const createViewResponseSchema = z.object({
  view: viewSchema,
});
export type CreateViewResponse = z.infer<typeof createViewResponseSchema>;

// Update View Response
export const updateViewResponseSchema = z.object({
  view: viewSchema,
});
export type UpdateViewResponse = z.infer<typeof updateViewResponseSchema>;

// Delete View Response
export const deleteViewResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteViewResponse = z.infer<typeof deleteViewResponseSchema>;
