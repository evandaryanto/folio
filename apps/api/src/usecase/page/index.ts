import type { PageRepository } from "@/repository/page";
import type { WorkspaceRepository } from "@/repository/workspace";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreatePageRequest,
  UpdatePageRequest,
  GetPageResponse,
  ListPagesResponse,
  CreatePageResponse,
  UpdatePageResponse,
  DeletePageResponse,
  PageResponse,
} from "@folio/contract/page";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { Page } from "@folio/db/schema";

interface PageUsecaseDeps {
  pageRepository: PageRepository;
  workspaceRepository: WorkspaceRepository;
  logger: Logger;
}

function toPageResponse(page: Page): PageResponse {
  return {
    id: page.id,
    workspaceId: page.workspaceId,
    slug: page.slug,
    name: page.name,
    description: page.description,
    blocks: page.blocks as PageResponse["blocks"],
    isActive: page.isActive,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    createdBy: page.createdBy,
  };
}

export class PageUsecase {
  private pageRepo: PageRepository;
  private workspaceRepo: WorkspaceRepository;
  private logger: Logger;

  constructor({
    pageRepository,
    workspaceRepository,
    logger,
  }: PageUsecaseDeps) {
    this.pageRepo = pageRepository;
    this.workspaceRepo = workspaceRepository;
    this.logger = logger;
  }

  async getPage(
    workspaceId: string,
    pageId: string,
  ): Promise<ResponseResult<GetPageResponse>> {
    try {
      const pageResult = await this.pageRepo.findById(pageId);
      if (!pageResult.ok) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      const page = pageResult.data;

      if (page.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok({ page: toPageResponse(page) });
    } catch (e) {
      this.logger.error("Failed to get page", {
        error: e,
        workspaceId,
        pageId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get page"));
    }
  }

  async getPageBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<GetPageResponse>> {
    try {
      const pageResult = await this.pageRepo.findByWorkspaceAndSlug(
        workspaceId,
        slug,
      );
      if (!pageResult.ok) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok({ page: toPageResponse(pageResult.data) });
    } catch (e) {
      this.logger.error("Failed to get page by slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get page"));
    }
  }

  async listPages(
    workspaceId: string,
  ): Promise<ResponseResult<ListPagesResponse>> {
    try {
      const pagesResult = await this.pageRepo.findByWorkspace(workspaceId);

      if (!pagesResult.ok) {
        return err(pagesResult.error);
      }

      return ok({
        pages: pagesResult.data.map(toPageResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list pages", { error: e, workspaceId });
      return err(createError(ErrorCode.InternalError, "Failed to list pages"));
    }
  }

  async createPage(
    workspaceId: string,
    input: CreatePageRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreatePageResponse>> {
    try {
      // Check if slug already exists in workspace
      const existingResult = await this.pageRepo.findByWorkspaceAndSlug(
        workspaceId,
        input.slug,
      );

      if (existingResult.ok) {
        return err(
          createError(
            ErrorCode.AlreadyExists,
            "Page with this slug already exists",
          ),
        );
      }

      const createResult = await this.pageRepo.create({
        workspaceId,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        blocks: input.blocks ?? [],
        isActive: input.isActive ?? true,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({ page: toPageResponse(createResult.data) });
    } catch (e) {
      this.logger.error("Failed to create page", {
        error: e,
        workspaceId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to create page"));
    }
  }

  async updatePage(
    workspaceId: string,
    pageId: string,
    input: UpdatePageRequest,
  ): Promise<ResponseResult<UpdatePageResponse>> {
    try {
      const existingResult = await this.pageRepo.findById(pageId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      const updateResult = await this.pageRepo.update(pageId, {
        name: input.name,
        description: input.description,
        blocks: input.blocks,
        isActive: input.isActive,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({ page: toPageResponse(updateResult.data) });
    } catch (e) {
      this.logger.error("Failed to update page", {
        error: e,
        workspaceId,
        pageId,
        input,
      });
      return err(createError(ErrorCode.InternalError, "Failed to update page"));
    }
  }

  async deletePage(
    workspaceId: string,
    pageId: string,
  ): Promise<ResponseResult<DeletePageResponse>> {
    try {
      const existingResult = await this.pageRepo.findById(pageId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      const deleteResult = await this.pageRepo.delete(pageId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete page", {
        error: e,
        workspaceId,
        pageId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to delete page"));
    }
  }

  async getPublicPageBySlug(
    workspaceSlug: string,
    pageSlug: string,
  ): Promise<ResponseResult<GetPageResponse>> {
    try {
      // Resolve workspace by slug
      const workspaceResult =
        await this.workspaceRepo.findBySlug(workspaceSlug);
      if (!workspaceResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      const workspace = workspaceResult.data;

      // Find page by workspace and slug
      const pageResult = await this.pageRepo.findByWorkspaceAndSlug(
        workspace.id,
        pageSlug,
      );
      if (!pageResult.ok) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      const page = pageResult.data;

      // Only active pages are publicly accessible
      if (!page.isActive) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok({ page: toPageResponse(page) });
    } catch (e) {
      this.logger.error("Failed to get public page by slug", {
        error: e,
        workspaceSlug,
        pageSlug,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get page"));
    }
  }
}
