import { z } from "zod";

// Create API Key
export const createApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional(),
});
export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>;

// Update API Key
export const updateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  scopes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateApiKeyRequest = z.infer<typeof updateApiKeyRequestSchema>;
