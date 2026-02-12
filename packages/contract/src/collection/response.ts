import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";

// Collection Schema
export const collectionSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  isActive: z.boolean(),
  version: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
});
export type CollectionResponse = z.infer<typeof collectionSchema>;

// Get Collection Response
export const getCollectionResponseSchema = z.object({
  collection: collectionSchema,
});
export type GetCollectionResponse = z.infer<typeof getCollectionResponseSchema>;

// List Collections Response
export const listCollectionsResponseSchema = z.object({
  collections: z.array(collectionSchema),
  pagination: paginationInfoSchema,
});
export type ListCollectionsResponse = z.infer<
  typeof listCollectionsResponseSchema
>;

// Create Collection Response
export const createCollectionResponseSchema = z.object({
  collection: collectionSchema,
});
export type CreateCollectionResponse = z.infer<
  typeof createCollectionResponseSchema
>;

// Update Collection Response
export const updateCollectionResponseSchema = z.object({
  collection: collectionSchema,
});
export type UpdateCollectionResponse = z.infer<
  typeof updateCollectionResponseSchema
>;

// Delete Collection Response
export const deleteCollectionResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteCollectionResponse = z.infer<
  typeof deleteCollectionResponseSchema
>;
