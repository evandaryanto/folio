import type { ViewRepository } from "@/repository/view";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateViewRequest,
  UpdateViewRequest,
  GetViewResponse,
  ListViewsResponse,
  CreateViewResponse,
  UpdateViewResponse,
  DeleteViewResponse,
  ViewResponse,
} from "@folio/contract/view";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { View } from "@folio/db/schema";

interface ViewUsecaseDeps {
  viewRepository: ViewRepository;
  logger: Logger;
}

function toViewResponse(view: View): ViewResponse {
  return {
    id: view.id,
    workspaceId: view.workspaceId,
    compositionId: view.compositionId,
    slug: view.slug,
    name: view.name,
    description: view.description,
    viewType: view.viewType,
    config: view.config as ViewResponse["config"],
    isActive: view.isActive,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    createdBy: view.createdBy,
  };
}

export class ViewUsecase {
  private viewRepo: ViewRepository;
  private logger: Logger;

  constructor({ viewRepository, logger }: ViewUsecaseDeps) {
    this.viewRepo = viewRepository;
    this.logger = logger;
  }

  async getView(
    workspaceId: string,
    viewId: string,
  ): Promise<ResponseResult<GetViewResponse>> {
    try {
      const viewResult = await this.viewRepo.findById(viewId);
      if (!viewResult.ok) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      const view = viewResult.data;

      if (view.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok({ view: toViewResponse(view) });
    } catch (e) {
      this.logger.error("Failed to get view", {
        error: e,
        workspaceId,
        viewId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get view"));
    }
  }

  async getViewBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<GetViewResponse>> {
    try {
      const viewResult = await this.viewRepo.findByWorkspaceAndSlug(
        workspaceId,
        slug,
      );
      if (!viewResult.ok) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok({ view: toViewResponse(viewResult.data) });
    } catch (e) {
      this.logger.error("Failed to get view by slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get view"));
    }
  }

  async listViews(
    workspaceId: string,
  ): Promise<ResponseResult<ListViewsResponse>> {
    try {
      const viewsResult = await this.viewRepo.findByWorkspace(workspaceId);

      if (!viewsResult.ok) {
        return err(viewsResult.error);
      }

      return ok({
        views: viewsResult.data.map(toViewResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list views", { error: e, workspaceId });
      return err(createError(ErrorCode.InternalError, "Failed to list views"));
    }
  }

  async createView(
    workspaceId: string,
    input: CreateViewRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateViewResponse>> {
    try {
      // Check if slug already exists in workspace
      const existingResult = await this.viewRepo.findByWorkspaceAndSlug(
        workspaceId,
        input.slug,
      );

      if (existingResult.ok) {
        return err(
          createError(
            ErrorCode.AlreadyExists,
            "View with this slug already exists",
          ),
        );
      }

      const createResult = await this.viewRepo.create({
        workspaceId,
        compositionId: input.compositionId,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        viewType: input.viewType,
        config: input.config,
        isActive: input.isActive ?? true,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({ view: toViewResponse(createResult.data) });
    } catch (e) {
      this.logger.error("Failed to create view", {
        error: e,
        workspaceId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to create view"));
    }
  }

  async updateView(
    workspaceId: string,
    viewId: string,
    input: UpdateViewRequest,
  ): Promise<ResponseResult<UpdateViewResponse>> {
    try {
      const existingResult = await this.viewRepo.findById(viewId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      const updateResult = await this.viewRepo.update(viewId, {
        name: input.name,
        description: input.description,
        config: input.config,
        isActive: input.isActive,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({ view: toViewResponse(updateResult.data) });
    } catch (e) {
      this.logger.error("Failed to update view", {
        error: e,
        workspaceId,
        viewId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to update view"));
    }
  }

  async deleteView(
    workspaceId: string,
    viewId: string,
  ): Promise<ResponseResult<DeleteViewResponse>> {
    try {
      const existingResult = await this.viewRepo.findById(viewId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      const deleteResult = await this.viewRepo.delete(viewId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete view", {
        error: e,
        workspaceId,
        viewId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to delete view"));
    }
  }
}
