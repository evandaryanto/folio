import { z } from "zod";
import { FieldType } from "../enums";

// Field Options Schema
export const fieldOptionsSchema = z
  .object({
    // select / multi_select
    choices: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .optional(),
    // number
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
    // text
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    // relation
    relatedCollectionId: z.string().optional(),
    relatedFieldSlug: z.string().optional(),
  })
  .passthrough();
export type FieldOptions = z.infer<typeof fieldOptionsSchema>;

// Create Field
export const createFieldRequestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_]+$/,
      "Slug can only contain lowercase letters, numbers, and underscores",
    ),
  name: z.string().min(1).max(255),
  fieldType: z.nativeEnum(FieldType),
  isRequired: z.boolean().optional().default(false),
  isUnique: z.boolean().optional().default(false),
  defaultValue: z.unknown().optional(),
  options: fieldOptionsSchema.optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateFieldRequest = z.infer<typeof createFieldRequestSchema>;

// Update Field
export const updateFieldRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  defaultValue: z.unknown().nullable().optional(),
  options: fieldOptionsSchema.nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateFieldRequest = z.infer<typeof updateFieldRequestSchema>;
