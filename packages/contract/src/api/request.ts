import { z } from "zod";
import { ApiMethod, ApiType, AccessLevel } from "../enums";

// API Config Schema
export const apiConfigSchema = z
  .object({
    // For query/crud
    filters: z
      .array(
        z.object({
          field: z.string(),
          operator: z.enum([
            "eq",
            "neq",
            "gt",
            "gte",
            "lt",
            "lte",
            "contains",
            "in",
          ]),
          value: z.unknown().optional(),
          param: z.string().optional(),
        }),
      )
      .optional(),
    sort: z
      .array(
        z.object({
          field: z.string(),
          direction: z.enum(["asc", "desc"]),
        }),
      )
      .optional(),
    limit: z.number().int().positive().optional(),
    // For aggregation
    aggregations: z
      .array(
        z.object({
          field: z.string(),
          function: z.enum(["count", "sum", "avg", "min", "max"]),
          alias: z.string(),
        }),
      )
      .optional(),
    groupBy: z.array(z.string()).optional(),
    // Response shaping
    select: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    // CRUD specifics
    allowCreate: z.boolean().optional(),
    allowUpdate: z.boolean().optional(),
    allowDelete: z.boolean().optional(),
  })
  .passthrough();
export type ApiConfigRequest = z.infer<typeof apiConfigSchema>;

// Create API
export const createApiRequestSchema = z.object({
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
  collectionId: z.string().optional(),
  method: z.nativeEnum(ApiMethod),
  apiType: z.nativeEnum(ApiType),
  config: apiConfigSchema.optional().default({}),
  accessLevel: z
    .nativeEnum(AccessLevel)
    .optional()
    .default(AccessLevel.Private),
  isActive: z.boolean().optional().default(true),
});
export type CreateApiRequest = z.infer<typeof createApiRequestSchema>;

// Update API
export const updateApiRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  config: apiConfigSchema.optional(),
  accessLevel: z.nativeEnum(AccessLevel).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateApiRequest = z.infer<typeof updateApiRequestSchema>;
