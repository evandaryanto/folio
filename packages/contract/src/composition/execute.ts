import { z } from "zod";
import { compositionConfigSchema } from "./request";

/**
 * Response schema for composition execution
 */
export const executeCompositionResponseSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  metadata: z.object({
    count: z.number(),
    compositionId: z.string(),
    executedAt: z.string().datetime(),
  }),
});
export type ExecuteCompositionResponse = z.infer<
  typeof executeCompositionResponseSchema
>;

/**
 * Request schema for composition preview (test without saving)
 */
export const previewCompositionRequestSchema = z.object({
  config: compositionConfigSchema,
  params: z.record(z.string(), z.unknown()).optional(),
});
export type PreviewCompositionRequest = z.infer<
  typeof previewCompositionRequestSchema
>;

/**
 * Response schema for composition preview
 */
export const previewCompositionResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.record(z.string(), z.unknown())).optional(),
  metadata: z
    .object({
      count: z.number(),
      executedAt: z.string().datetime(),
    })
    .optional(),
  error: z
    .object({
      message: z.string(),
      field: z.string().optional(),
    })
    .optional(),
});
export type PreviewCompositionResponse = z.infer<
  typeof previewCompositionResponseSchema
>;
