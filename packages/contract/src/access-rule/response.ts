import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { accessConditionsSchema } from "./request";

// Access Rule Schema
export const accessRuleSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  roleId: ulidSchema.nullable(),
  resourceType: z.string(),
  resourceId: ulidSchema.nullable(),
  actions: z.array(z.string()).nullable(),
  conditions: accessConditionsSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AccessRuleResponse = z.infer<typeof accessRuleSchema>;

// Get Access Rule Response
export const getAccessRuleResponseSchema = z.object({
  accessRule: accessRuleSchema,
});
export type GetAccessRuleResponse = z.infer<typeof getAccessRuleResponseSchema>;

// List Access Rules Response
export const listAccessRulesResponseSchema = z.object({
  accessRules: z.array(accessRuleSchema),
  pagination: paginationInfoSchema,
});
export type ListAccessRulesResponse = z.infer<
  typeof listAccessRulesResponseSchema
>;

// Create Access Rule Response
export const createAccessRuleResponseSchema = z.object({
  accessRule: accessRuleSchema,
});
export type CreateAccessRuleResponse = z.infer<
  typeof createAccessRuleResponseSchema
>;

// Update Access Rule Response
export const updateAccessRuleResponseSchema = z.object({
  accessRule: accessRuleSchema,
});
export type UpdateAccessRuleResponse = z.infer<
  typeof updateAccessRuleResponseSchema
>;

// Delete Access Rule Response
export const deleteAccessRuleResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteAccessRuleResponse = z.infer<
  typeof deleteAccessRuleResponseSchema
>;
