import { z } from "zod";
import { ulidSchema } from "../common";
import { FieldType } from "../enums";
import { fieldOptionsSchema } from "./request";

// Field Schema
export const fieldSchema = z.object({
  id: ulidSchema,
  collectionId: ulidSchema,
  slug: z.string(),
  name: z.string(),
  fieldType: z.nativeEnum(FieldType),
  isRequired: z.boolean(),
  isUnique: z.boolean(),
  defaultValue: z.unknown().nullable(),
  options: fieldOptionsSchema.nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type FieldResponse = z.infer<typeof fieldSchema>;

// Get Field Response
export const getFieldResponseSchema = z.object({
  field: fieldSchema,
});
export type GetFieldResponse = z.infer<typeof getFieldResponseSchema>;

// List Fields Response
export const listFieldsResponseSchema = z.object({
  fields: z.array(fieldSchema),
});
export type ListFieldsResponse = z.infer<typeof listFieldsResponseSchema>;

// Create Field Response
export const createFieldResponseSchema = z.object({
  field: fieldSchema,
});
export type CreateFieldResponse = z.infer<typeof createFieldResponseSchema>;

// Update Field Response
export const updateFieldResponseSchema = z.object({
  field: fieldSchema,
});
export type UpdateFieldResponse = z.infer<typeof updateFieldResponseSchema>;

// Delete Field Response
export const deleteFieldResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteFieldResponse = z.infer<typeof deleteFieldResponseSchema>;
