import type { ApiKey, NewApiKey } from "@folio/db/schema";

export type CreateApiKeyInput = Omit<NewApiKey, "id" | "createdAt">;

export type UpdateApiKeyInput = Partial<
  Pick<ApiKey, "name" | "scopes" | "isActive" | "lastUsedAt">
>;

export interface RevokeApiKeyInput {
  revokedAt: Date;
  revokedBy: string;
  isActive: false;
}
