import type { ViewUsecase } from "@/usecase/view";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateViewRequest,
  UpdateViewRequest,
  GetViewResponse,
  ListViewsResponse,
  CreateViewResponse,
  UpdateViewResponse,
  DeleteViewResponse,
} from "@folio/contract/view";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface ViewServiceDeps {
  viewUsecase: ViewUsecase;
}

export class ViewService {
  private viewUsecase: ViewUsecase;

  constructor({ viewUsecase }: ViewServiceDeps) {
    this.viewUsecase = viewUsecase;
  }

  async getView(
    workspaceId: string,
    viewId: string,
  ): Promise<ServiceResult<GetViewResponse>> {
    try {
      const result = await this.viewUsecase.getView(workspaceId, viewId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get view");
    }
  }

  async getViewBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ServiceResult<GetViewResponse>> {
    try {
      const result = await this.viewUsecase.getViewBySlug(workspaceId, slug);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get view");
    }
  }

  async listViews(
    workspaceId: string,
  ): Promise<ServiceResult<ListViewsResponse>> {
    try {
      const result = await this.viewUsecase.listViews(workspaceId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list views");
    }
  }

  async createView(
    workspaceId: string,
    input: CreateViewRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateViewResponse>> {
    try {
      const result = await this.viewUsecase.createView(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create view");
    }
  }

  async updateView(
    workspaceId: string,
    viewId: string,
    input: UpdateViewRequest,
  ): Promise<ServiceResult<UpdateViewResponse>> {
    try {
      const result = await this.viewUsecase.updateView(
        workspaceId,
        viewId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update view");
    }
  }

  async deleteView(
    workspaceId: string,
    viewId: string,
  ): Promise<ServiceResult<DeleteViewResponse>> {
    try {
      const result = await this.viewUsecase.deleteView(workspaceId, viewId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete view");
    }
  }
}
