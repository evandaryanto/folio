import type { WorkspaceRepository } from "@/repository/workspace";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  UpdateWorkspaceRequest,
  GetWorkspaceResponse,
  ListWorkspacesResponse,
  UpdateWorkspaceResponse,
  DeleteWorkspaceResponse,
} from "@folio/contract/workspace";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";

interface WorkspaceUsecaseDeps {
  workspaceRepository: WorkspaceRepository;
  logger: Logger;
}

export class WorkspaceUsecase {
  private workspaceRepo: WorkspaceRepository;
  private logger: Logger;

  constructor({ workspaceRepository, logger }: WorkspaceUsecaseDeps) {
    this.workspaceRepo = workspaceRepository;
    this.logger = logger;
  }

  async getWorkspace(
    workspaceId: string,
    requestingUserId: string,
  ): Promise<ResponseResult<GetWorkspaceResponse>> {
    try {
      const workspaceResult = await this.workspaceRepo.findById(workspaceId);
      if (!workspaceResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      const workspace = workspaceResult.data;

      return ok({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          settings: workspace.settings,
          isActive: workspace.isActive,
          createdAt: workspace.createdAt.toISOString(),
          updatedAt: workspace.updatedAt.toISOString(),
        },
      });
    } catch (e) {
      this.logger.error("Failed to get workspace", {
        error: e,
        workspaceId,
        requestingUserId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get workspace"),
      );
    }
  }

  async listWorkspaces(
    userId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListWorkspacesResponse>> {
    try {
      // For now, return the user's workspace(s)
      // In a multi-workspace setup, this would query user_workspaces junction table
      // Currently users belong to one workspace

      // This is a simplified implementation - in production you'd have a proper
      // user-workspace relationship table
      return ok({
        workspaces: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list workspaces", { error: e, userId });
      return err(
        createError(ErrorCode.InternalError, "Failed to list workspaces"),
      );
    }
  }

  async updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceRequest,
    requestingUserId: string,
  ): Promise<ResponseResult<UpdateWorkspaceResponse>> {
    try {
      // Verify workspace exists
      const existingResult = await this.workspaceRepo.findById(workspaceId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      // Update workspace
      const updateResult = await this.workspaceRepo.update(workspaceId, {
        name: input.name,
        settings: input.settings,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      const workspace = updateResult.data;

      return ok({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          settings: workspace.settings,
          isActive: workspace.isActive,
          createdAt: workspace.createdAt.toISOString(),
          updatedAt: workspace.updatedAt.toISOString(),
        },
      });
    } catch (e) {
      this.logger.error("Failed to update workspace", {
        error: e,
        workspaceId,
        input,
        requestingUserId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update workspace"),
      );
    }
  }

  async deleteWorkspace(
    workspaceId: string,
    requestingUserId: string,
  ): Promise<ResponseResult<DeleteWorkspaceResponse>> {
    try {
      // Verify workspace exists
      const existingResult = await this.workspaceRepo.findById(workspaceId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      // Soft delete by setting isActive to false
      // Or hard delete - depending on requirements
      const deleteResult = await this.workspaceRepo.update(workspaceId, {
        isActive: false,
      });

      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete workspace", {
        error: e,
        workspaceId,
        requestingUserId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete workspace"),
      );
    }
  }
}
