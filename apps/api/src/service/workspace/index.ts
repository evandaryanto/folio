import type { WorkspaceUsecase } from "@/usecase/workspace";
import type { ServiceResult } from "@/utils/types/result";
import type {
  UpdateWorkspaceRequest,
  GetWorkspaceResponse,
  ListWorkspacesResponse,
  UpdateWorkspaceResponse,
  DeleteWorkspaceResponse,
} from "@folio/contract/workspace";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface WorkspaceServiceDeps {
  workspaceUsecase: WorkspaceUsecase;
}

export class WorkspaceService {
  private workspaceUsecase: WorkspaceUsecase;

  constructor({ workspaceUsecase }: WorkspaceServiceDeps) {
    this.workspaceUsecase = workspaceUsecase;
  }

  async getWorkspace(
    workspaceId: string,
    requestingUserId: string,
  ): Promise<ServiceResult<GetWorkspaceResponse>> {
    try {
      const result = await this.workspaceUsecase.getWorkspace(
        workspaceId,
        requestingUserId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get workspace");
    }
  }

  async listWorkspaces(
    userId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListWorkspacesResponse>> {
    try {
      const result = await this.workspaceUsecase.listWorkspaces(
        userId,
        options,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list workspaces");
    }
  }

  async updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceRequest,
    requestingUserId: string,
  ): Promise<ServiceResult<UpdateWorkspaceResponse>> {
    try {
      const result = await this.workspaceUsecase.updateWorkspace(
        workspaceId,
        input,
        requestingUserId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update workspace");
    }
  }

  async deleteWorkspace(
    workspaceId: string,
    requestingUserId: string,
  ): Promise<ServiceResult<DeleteWorkspaceResponse>> {
    try {
      const result = await this.workspaceUsecase.deleteWorkspace(
        workspaceId,
        requestingUserId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete workspace");
    }
  }
}
