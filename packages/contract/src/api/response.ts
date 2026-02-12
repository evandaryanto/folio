import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { ApiMethod, ApiType, AccessLevel } from "../enums";
import { apiConfigSchema } from "./request";

// API Schema
export const apiSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  collectionId: ulidSchema.nullable(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  method: z.nativeEnum(ApiMethod),
  apiType: z.nativeEnum(ApiType),
  config: apiConfigSchema,
  accessLevel: z.nativeEnum(AccessLevel),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
});
export type ApiResponse = z.infer<typeof apiSchema>;

// Get API Response
export const getApiResponseSchema = z.object({
  api: apiSchema,
});
export type GetApiResponse = z.infer<typeof getApiResponseSchema>;

// List APIs Response
export const listApisResponseSchema = z.object({
  apis: z.array(apiSchema),
  pagination: paginationInfoSchema,
});
export type ListApisResponse = z.infer<typeof listApisResponseSchema>;

// Create API Response
export const createApiResponseSchema = z.object({
  api: apiSchema,
});
export type CreateApiResponse = z.infer<typeof createApiResponseSchema>;

// Update API Response
export const updateApiResponseSchema = z.object({
  api: apiSchema,
});
export type UpdateApiResponse = z.infer<typeof updateApiResponseSchema>;

// Delete API Response
export const deleteApiResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteApiResponse = z.infer<typeof deleteApiResponseSchema>;
