import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { AccessLevel } from "../enums";
import { compositionConfigSchema } from "./request";

// Composition Schema
export const compositionSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  config: compositionConfigSchema,
  accessLevel: z.nativeEnum(AccessLevel),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
});
export type CompositionResponse = z.infer<typeof compositionSchema>;

// Get Composition Response
export const getCompositionResponseSchema = z.object({
  composition: compositionSchema,
});
export type GetCompositionResponse = z.infer<
  typeof getCompositionResponseSchema
>;

// List Compositions Response
export const listCompositionsResponseSchema = z.object({
  compositions: z.array(compositionSchema),
  pagination: paginationInfoSchema,
});
export type ListCompositionsResponse = z.infer<
  typeof listCompositionsResponseSchema
>;

// Create Composition Response
export const createCompositionResponseSchema = z.object({
  composition: compositionSchema,
});
export type CreateCompositionResponse = z.infer<
  typeof createCompositionResponseSchema
>;

// Update Composition Response
export const updateCompositionResponseSchema = z.object({
  composition: compositionSchema,
});
export type UpdateCompositionResponse = z.infer<
  typeof updateCompositionResponseSchema
>;

// Delete Composition Response
export const deleteCompositionResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteCompositionResponse = z.infer<
  typeof deleteCompositionResponseSchema
>;
