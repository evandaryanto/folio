import type { CompositionUsecase } from "@/usecase/composition";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateCompositionRequest,
  UpdateCompositionRequest,
  GetCompositionResponse,
  ListCompositionsResponse,
  CreateCompositionResponse,
  UpdateCompositionResponse,
  DeleteCompositionResponse,
  ExecuteCompositionResponse,
  PreviewCompositionRequest,
  PreviewCompositionResponse,
} from "@folio/contract/composition";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface CompositionServiceDeps {
  compositionUsecase: CompositionUsecase;
}

export class CompositionService {
  private compositionUsecase: CompositionUsecase;

  constructor({ compositionUsecase }: CompositionServiceDeps) {
    this.compositionUsecase = compositionUsecase;
  }

  async getComposition(
    workspaceId: string,
    compositionId: string,
  ): Promise<ServiceResult<GetCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.getComposition(
        workspaceId,
        compositionId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get composition");
    }
  }

  async getCompositionBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ServiceResult<GetCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.getCompositionBySlug(
        workspaceId,
        slug,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get composition");
    }
  }

  async listCompositions(
    workspaceId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListCompositionsResponse>> {
    try {
      const result = await this.compositionUsecase.listCompositions(
        workspaceId,
        options,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list compositions");
    }
  }

  async createComposition(
    workspaceId: string,
    input: CreateCompositionRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.createComposition(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create composition");
    }
  }

  async updateComposition(
    workspaceId: string,
    compositionId: string,
    input: UpdateCompositionRequest,
  ): Promise<ServiceResult<UpdateCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.updateComposition(
        workspaceId,
        compositionId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update composition");
    }
  }

  async deleteComposition(
    workspaceId: string,
    compositionId: string,
  ): Promise<ServiceResult<DeleteCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.deleteComposition(
        workspaceId,
        compositionId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete composition");
    }
  }

  /**
   * Execute a composition by workspace and composition slugs.
   */
  async execute(
    workspaceSlug: string,
    compositionSlug: string,
    params: Record<string, unknown>,
    userId?: string,
  ): Promise<ServiceResult<ExecuteCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.execute(
        workspaceSlug,
        compositionSlug,
        params,
        userId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to execute composition");
    }
  }

  /**
   * Preview/test a composition config without saving.
   */
  async preview(
    workspaceId: string,
    input: PreviewCompositionRequest,
  ): Promise<ServiceResult<PreviewCompositionResponse>> {
    try {
      const result = await this.compositionUsecase.preview(workspaceId, input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to preview composition");
    }
  }
}
