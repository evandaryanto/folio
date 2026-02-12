import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";

// API Key Schema (without sensitive data)
export const apiKeySchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  name: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(z.string()).nullable(),
  isActive: z.boolean(),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
  revokedAt: z.string().datetime().nullable(),
  revokedBy: ulidSchema.nullable(),
});
export type ApiKeyResponse = z.infer<typeof apiKeySchema>;

// API Key with raw key (only returned on creation)
export const apiKeyWithSecretSchema = apiKeySchema.extend({
  key: z.string(),
});
export type ApiKeyWithSecretResponse = z.infer<typeof apiKeyWithSecretSchema>;

// Get API Key Response
export const getApiKeyResponseSchema = z.object({
  apiKey: apiKeySchema,
});
export type GetApiKeyResponse = z.infer<typeof getApiKeyResponseSchema>;

// List API Keys Response
export const listApiKeysResponseSchema = z.object({
  apiKeys: z.array(apiKeySchema),
  pagination: paginationInfoSchema,
});
export type ListApiKeysResponse = z.infer<typeof listApiKeysResponseSchema>;

// Create API Key Response (includes the raw key)
export const createApiKeyResponseSchema = z.object({
  apiKey: apiKeyWithSecretSchema,
});
export type CreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>;

// Update API Key Response
export const updateApiKeyResponseSchema = z.object({
  apiKey: apiKeySchema,
});
export type UpdateApiKeyResponse = z.infer<typeof updateApiKeyResponseSchema>;

// Revoke API Key Response
export const revokeApiKeyResponseSchema = z.object({
  apiKey: apiKeySchema,
});
export type RevokeApiKeyResponse = z.infer<typeof revokeApiKeyResponseSchema>;

// Delete API Key Response
export const deleteApiKeyResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteApiKeyResponse = z.infer<typeof deleteApiKeyResponseSchema>;
