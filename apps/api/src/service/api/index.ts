import type { ApiUsecase } from "@/usecase/api";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateApiRequest,
  UpdateApiRequest,
  GetApiResponse,
  ListApisResponse,
  CreateApiResponse,
  UpdateApiResponse,
  DeleteApiResponse,
} from "@folio/contract/api";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface ApiServiceDeps {
  apiUsecase: ApiUsecase;
}

export class ApiService {
  private apiUsecase: ApiUsecase;

  constructor({ apiUsecase }: ApiServiceDeps) {
    this.apiUsecase = apiUsecase;
  }

  async getApi(
    workspaceId: string,
    apiId: string,
  ): Promise<ServiceResult<GetApiResponse>> {
    try {
      const result = await this.apiUsecase.getApi(workspaceId, apiId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get API");
    }
  }

  async listApis(
    workspaceId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListApisResponse>> {
    try {
      const result = await this.apiUsecase.listApis(workspaceId, options);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list APIs");
    }
  }

  async createApi(
    workspaceId: string,
    input: CreateApiRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateApiResponse>> {
    try {
      const result = await this.apiUsecase.createApi(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create API");
    }
  }

  async updateApi(
    workspaceId: string,
    apiId: string,
    input: UpdateApiRequest,
  ): Promise<ServiceResult<UpdateApiResponse>> {
    try {
      const result = await this.apiUsecase.updateApi(workspaceId, apiId, input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update API");
    }
  }

  async deleteApi(
    workspaceId: string,
    apiId: string,
  ): Promise<ServiceResult<DeleteApiResponse>> {
    try {
      const result = await this.apiUsecase.deleteApi(workspaceId, apiId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete API");
    }
  }
}
