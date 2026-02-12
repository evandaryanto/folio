import type { PageUsecase } from "@/usecase/page";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreatePageRequest,
  UpdatePageRequest,
  GetPageResponse,
  ListPagesResponse,
  CreatePageResponse,
  UpdatePageResponse,
  DeletePageResponse,
} from "@folio/contract/page";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface PageServiceDeps {
  pageUsecase: PageUsecase;
}

export class PageService {
  private pageUsecase: PageUsecase;

  constructor({ pageUsecase }: PageServiceDeps) {
    this.pageUsecase = pageUsecase;
  }

  async getPage(
    workspaceId: string,
    pageId: string,
  ): Promise<ServiceResult<GetPageResponse>> {
    try {
      const result = await this.pageUsecase.getPage(workspaceId, pageId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get page");
    }
  }

  async getPageBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ServiceResult<GetPageResponse>> {
    try {
      const result = await this.pageUsecase.getPageBySlug(workspaceId, slug);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get page");
    }
  }

  async listPages(
    workspaceId: string,
  ): Promise<ServiceResult<ListPagesResponse>> {
    try {
      const result = await this.pageUsecase.listPages(workspaceId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list pages");
    }
  }

  async createPage(
    workspaceId: string,
    input: CreatePageRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreatePageResponse>> {
    try {
      const result = await this.pageUsecase.createPage(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create page");
    }
  }

  async updatePage(
    workspaceId: string,
    pageId: string,
    input: UpdatePageRequest,
  ): Promise<ServiceResult<UpdatePageResponse>> {
    try {
      const result = await this.pageUsecase.updatePage(
        workspaceId,
        pageId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update page");
    }
  }

  async deletePage(
    workspaceId: string,
    pageId: string,
  ): Promise<ServiceResult<DeletePageResponse>> {
    try {
      const result = await this.pageUsecase.deletePage(workspaceId, pageId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete page");
    }
  }

  async getPublicPageBySlug(
    workspaceSlug: string,
    pageSlug: string,
  ): Promise<ServiceResult<GetPageResponse>> {
    try {
      const result = await this.pageUsecase.getPublicPageBySlug(
        workspaceSlug,
        pageSlug,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get page");
    }
  }
}
