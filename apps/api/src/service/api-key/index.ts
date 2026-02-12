import type { ApiKeyUsecase } from "@/usecase/api-key";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  GetApiKeyResponse,
  ListApiKeysResponse,
  CreateApiKeyResponse,
  UpdateApiKeyResponse,
  RevokeApiKeyResponse,
  DeleteApiKeyResponse,
} from "@folio/contract/api-key";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface ApiKeyServiceDeps {
  apiKeyUsecase: ApiKeyUsecase;
}

export class ApiKeyService {
  private apiKeyUsecase: ApiKeyUsecase;

  constructor({ apiKeyUsecase }: ApiKeyServiceDeps) {
    this.apiKeyUsecase = apiKeyUsecase;
  }

  async getApiKey(
    workspaceId: string,
    apiKeyId: string,
  ): Promise<ServiceResult<GetApiKeyResponse>> {
    try {
      const result = await this.apiKeyUsecase.getApiKey(workspaceId, apiKeyId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get API key");
    }
  }

  async listApiKeys(
    workspaceId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListApiKeysResponse>> {
    try {
      const result = await this.apiKeyUsecase.listApiKeys(workspaceId, options);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list API keys");
    }
  }

  async createApiKey(
    workspaceId: string,
    input: CreateApiKeyRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateApiKeyResponse>> {
    try {
      const result = await this.apiKeyUsecase.createApiKey(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create API key");
    }
  }

  async updateApiKey(
    workspaceId: string,
    apiKeyId: string,
    input: UpdateApiKeyRequest,
  ): Promise<ServiceResult<UpdateApiKeyResponse>> {
    try {
      const result = await this.apiKeyUsecase.updateApiKey(
        workspaceId,
        apiKeyId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update API key");
    }
  }

  async revokeApiKey(
    workspaceId: string,
    apiKeyId: string,
    revokedBy: string,
  ): Promise<ServiceResult<RevokeApiKeyResponse>> {
    try {
      const result = await this.apiKeyUsecase.revokeApiKey(
        workspaceId,
        apiKeyId,
        revokedBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to revoke API key");
    }
  }

  async deleteApiKey(
    workspaceId: string,
    apiKeyId: string,
  ): Promise<ServiceResult<DeleteApiKeyResponse>> {
    try {
      const result = await this.apiKeyUsecase.deleteApiKey(
        workspaceId,
        apiKeyId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete API key");
    }
  }
}
