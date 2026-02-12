import { z } from "zod";
import {
  AccessLevel,
  FilterOperator,
  JoinType,
  AggregateFunction,
  SortDirection,
} from "../enums";

// Composition Config Schema
export const compositionConfigSchema = z
  .object({
    // Source collection
    from: z.string(),
    // Joins
    joins: z
      .array(
        z.object({
          collection: z.string(),
          on: z.object({
            left: z.string(),
            right: z.string(),
          }),
          type: z.nativeEnum(JoinType),
        }),
      )
      .optional(),
    // Filtering
    filters: z
      .array(
        z.object({
          field: z.string(),
          operator: z.nativeEnum(FilterOperator),
          value: z.unknown().optional(),
          param: z.string().optional(),
        }),
      )
      .optional(),
    // Aggregation
    groupBy: z.array(z.string()).optional(),
    aggregations: z
      .array(
        z.object({
          field: z.string(),
          function: z.nativeEnum(AggregateFunction),
          alias: z.string(),
        }),
      )
      .optional(),
    // Output
    select: z.array(z.string()).optional(),
    sort: z
      .array(
        z.object({
          field: z.string(),
          direction: z.nativeEnum(SortDirection),
        }),
      )
      .optional(),
    limit: z.number().int().positive().optional(),
  })
  .passthrough();
export type CompositionConfigRequest = z.infer<typeof compositionConfigSchema>;

// Create Composition
export const createCompositionRequestSchema = z.object({
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
  config: compositionConfigSchema,
  accessLevel: z
    .nativeEnum(AccessLevel)
    .optional()
    .default(AccessLevel.Private),
  isActive: z.boolean().optional().default(true),
});
export type CreateCompositionRequest = z.infer<
  typeof createCompositionRequestSchema
>;

// Update Composition
export const updateCompositionRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  config: compositionConfigSchema.optional(),
  accessLevel: z.nativeEnum(AccessLevel).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCompositionRequest = z.infer<
  typeof updateCompositionRequestSchema
>;
