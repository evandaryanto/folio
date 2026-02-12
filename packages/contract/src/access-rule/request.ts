import { z } from "zod";

// Access Conditions Schema
export const accessConditionsSchema = z
  .object({
    // Row-level conditions
    where: z.record(z.string(), z.unknown()).optional(),
    // Field-level restrictions
    allowedFields: z.array(z.string()).optional(),
    deniedFields: z.array(z.string()).optional(),
  })
  .passthrough();
export type AccessConditionsRequest = z.infer<typeof accessConditionsSchema>;

// Create Access Rule
export const createAccessRuleRequestSchema = z.object({
  roleId: z.string().optional(),
  resourceType: z.string().min(1).max(50),
  resourceId: z.string().optional(),
  actions: z.array(z.string()).optional().default([]),
  conditions: accessConditionsSchema.optional(),
});
export type CreateAccessRuleRequest = z.infer<
  typeof createAccessRuleRequestSchema
>;

// Update Access Rule
export const updateAccessRuleRequestSchema = z.object({
  actions: z.array(z.string()).optional(),
  conditions: accessConditionsSchema.nullable().optional(),
});
export type UpdateAccessRuleRequest = z.infer<
  typeof updateAccessRuleRequestSchema
>;
