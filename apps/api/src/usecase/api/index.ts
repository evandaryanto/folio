import type { ApiRepository } from "@/repository/api";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateApiRequest,
  UpdateApiRequest,
  GetApiResponse,
  ListApisResponse,
  CreateApiResponse,
  UpdateApiResponse,
  DeleteApiResponse,
} from "@folio/contract/api";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { Api } from "@folio/db/schema";
import type { ApiResponse } from "@folio/contract/api";

interface ApiUsecaseDeps {
  apiRepository: ApiRepository;
  logger: Logger;
}

function toApiResponse(api: Api): ApiResponse {
  return {
    id: api.id,
    workspaceId: api.workspaceId,
    collectionId: api.collectionId,
    slug: api.slug,
    name: api.name,
    description: api.description,
    method: api.method,
    apiType: api.apiType,
    config: api.config as ApiResponse["config"],
    accessLevel: api.accessLevel,
    isActive: api.isActive,
    createdAt: api.createdAt.toISOString(),
    updatedAt: api.updatedAt.toISOString(),
    createdBy: api.createdBy,
  };
}

export class ApiUsecase {
  private apiRepo: ApiRepository;
  private logger: Logger;

  constructor({ apiRepository, logger }: ApiUsecaseDeps) {
    this.apiRepo = apiRepository;
    this.logger = logger;
  }

  async getApi(
    workspaceId: string,
    apiId: string,
  ): Promise<ResponseResult<GetApiResponse>> {
    try {
      const apiResult = await this.apiRepo.findById(apiId);
      if (!apiResult.ok) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      const api = apiResult.data;

      // Verify API belongs to workspace
      if (api.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      return ok({
        api: toApiResponse(api),
      });
    } catch (e) {
      this.logger.error("Failed to get API", {
        error: e,
        workspaceId,
        apiId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get API"));
    }
  }

  async listApis(
    workspaceId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListApisResponse>> {
    try {
      const apisResult = await this.apiRepo.findByWorkspace(workspaceId);

      if (!apisResult.ok) {
        return err(apisResult.error);
      }

      return ok({
        apis: apisResult.data.map(toApiResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list APIs", { error: e, workspaceId });
      return err(createError(ErrorCode.InternalError, "Failed to list APIs"));
    }
  }

  async createApi(
    workspaceId: string,
    input: CreateApiRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateApiResponse>> {
    try {
      // Check if slug+method combination already exists in workspace
      const existingResult = await this.apiRepo.findByWorkspaceSlugMethod(
        workspaceId,
        input.slug,
        input.method,
      );

      if (existingResult.ok) {
        return err(
          createError(
            ErrorCode.AlreadyExists,
            "API with this slug and method already exists",
          ),
        );
      }

      // Create API
      const createResult = await this.apiRepo.create({
        workspaceId,
        collectionId: input.collectionId ?? null,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        method: input.method,
        apiType: input.apiType,
        config: input.config ?? {},
        accessLevel: input.accessLevel,
        isActive: input.isActive ?? true,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        api: toApiResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create API", {
        error: e,
        workspaceId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to create API"));
    }
  }

  async updateApi(
    workspaceId: string,
    apiId: string,
    input: UpdateApiRequest,
  ): Promise<ResponseResult<UpdateApiResponse>> {
    try {
      // Verify API exists and belongs to workspace
      const existingResult = await this.apiRepo.findById(apiId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      // Update API
      const updateResult = await this.apiRepo.update(apiId, {
        name: input.name,
        description: input.description,
        config: input.config,
        accessLevel: input.accessLevel,
        isActive: input.isActive,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        api: toApiResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update API", {
        error: e,
        workspaceId,
        apiId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to update API"));
    }
  }

  async deleteApi(
    workspaceId: string,
    apiId: string,
  ): Promise<ResponseResult<DeleteApiResponse>> {
    try {
      // Verify API exists and belongs to workspace
      const existingResult = await this.apiRepo.findById(apiId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      // Delete API
      const deleteResult = await this.apiRepo.delete(apiId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete API", {
        error: e,
        workspaceId,
        apiId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to delete API"));
    }
  }
}
