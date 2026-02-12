import { randomBytes, createHash } from "crypto";
import type { ApiKeyRepository } from "@/repository/api-key";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  GetApiKeyResponse,
  ListApiKeysResponse,
  CreateApiKeyResponse,
  UpdateApiKeyResponse,
  RevokeApiKeyResponse,
  DeleteApiKeyResponse,
  ApiKeyResponse,
} from "@folio/contract/api-key";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { ApiKey } from "@folio/db/schema";

interface ApiKeyUsecaseDeps {
  apiKeyRepository: ApiKeyRepository;
  logger: Logger;
}

function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const bytes = randomBytes(32);
  const key = `fol_${bytes.toString("base64url")}`;
  const keyPrefix = key.substring(0, 12);
  const keyHash = createHash("sha256").update(key).digest("hex");
  return { key, keyPrefix, keyHash };
}

function toApiKeyResponse(apiKey: ApiKey): ApiKeyResponse {
  return {
    id: apiKey.id,
    workspaceId: apiKey.workspaceId,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes,
    isActive: apiKey.isActive,
    lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
    expiresAt: apiKey.expiresAt?.toISOString() ?? null,
    createdAt: apiKey.createdAt.toISOString(),
    createdBy: apiKey.createdBy,
    revokedAt: apiKey.revokedAt?.toISOString() ?? null,
    revokedBy: apiKey.revokedBy,
  };
}

export class ApiKeyUsecase {
  private apiKeyRepo: ApiKeyRepository;
  private logger: Logger;

  constructor({ apiKeyRepository, logger }: ApiKeyUsecaseDeps) {
    this.apiKeyRepo = apiKeyRepository;
    this.logger = logger;
  }

  async getApiKey(
    workspaceId: string,
    apiKeyId: string,
  ): Promise<ResponseResult<GetApiKeyResponse>> {
    try {
      const apiKeyResult = await this.apiKeyRepo.findById(apiKeyId);
      if (!apiKeyResult.ok) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      const apiKey = apiKeyResult.data;

      // Verify API key belongs to workspace
      if (apiKey.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok({
        apiKey: toApiKeyResponse(apiKey),
      });
    } catch (e) {
      this.logger.error("Failed to get API key", {
        error: e,
        workspaceId,
        apiKeyId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get API key"));
    }
  }

  async listApiKeys(
    workspaceId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListApiKeysResponse>> {
    try {
      const apiKeysResult = await this.apiKeyRepo.findByWorkspace(workspaceId);

      if (!apiKeysResult.ok) {
        return err(apiKeysResult.error);
      }

      return ok({
        apiKeys: apiKeysResult.data.map(toApiKeyResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list API keys", { error: e, workspaceId });
      return err(
        createError(ErrorCode.InternalError, "Failed to list API keys"),
      );
    }
  }

  async createApiKey(
    workspaceId: string,
    input: CreateApiKeyRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateApiKeyResponse>> {
    try {
      // Generate key
      const { key, keyPrefix, keyHash } = generateApiKey();

      // Create API key
      const createResult = await this.apiKeyRepo.create({
        workspaceId,
        name: input.name,
        keyPrefix,
        keyHash,
        scopes: input.scopes ?? [],
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      // Return response with the raw key (only time it's returned)
      return ok({
        apiKey: {
          ...toApiKeyResponse(createResult.data),
          key,
        },
      });
    } catch (e) {
      this.logger.error("Failed to create API key", {
        error: e,
        workspaceId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create API key"),
      );
    }
  }

  async updateApiKey(
    workspaceId: string,
    apiKeyId: string,
    input: UpdateApiKeyRequest,
  ): Promise<ResponseResult<UpdateApiKeyResponse>> {
    try {
      // Verify API key exists and belongs to workspace
      const existingResult = await this.apiKeyRepo.findById(apiKeyId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      // Update API key
      const updateResult = await this.apiKeyRepo.update(apiKeyId, {
        name: input.name,
        scopes: input.scopes,
        isActive: input.isActive,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        apiKey: toApiKeyResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update API key", {
        error: e,
        workspaceId,
        apiKeyId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update API key"),
      );
    }
  }

  async revokeApiKey(
    workspaceId: string,
    apiKeyId: string,
    revokedBy: string,
  ): Promise<ResponseResult<RevokeApiKeyResponse>> {
    try {
      // Verify API key exists and belongs to workspace
      const existingResult = await this.apiKeyRepo.findById(apiKeyId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      // Already revoked
      if (existingResult.data.revokedAt) {
        return err(
          createError(ErrorCode.InvalidOperation, "API key already revoked"),
        );
      }

      // Revoke API key
      const revokeResult = await this.apiKeyRepo.revoke(apiKeyId, {
        revokedAt: new Date(),
        revokedBy,
        isActive: false,
      });

      if (!revokeResult.ok) {
        return err(revokeResult.error);
      }

      return ok({
        apiKey: toApiKeyResponse(revokeResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to revoke API key", {
        error: e,
        workspaceId,
        apiKeyId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to revoke API key"),
      );
    }
  }

  async deleteApiKey(
    workspaceId: string,
    apiKeyId: string,
  ): Promise<ResponseResult<DeleteApiKeyResponse>> {
    try {
      // Verify API key exists and belongs to workspace
      const existingResult = await this.apiKeyRepo.findById(apiKeyId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      // Delete API key
      const deleteResult = await this.apiKeyRepo.delete(apiKeyId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete API key", {
        error: e,
        workspaceId,
        apiKeyId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete API key"),
      );
    }
  }
}
