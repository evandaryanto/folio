import type { CompositionRepository } from "@/repository/composition";
import type { CollectionRepository } from "@/repository/collection";
import type { WorkspaceRepository } from "@/repository/workspace";
import type { RecordRepository } from "@/repository/record";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateCompositionRequest,
  UpdateCompositionRequest,
  GetCompositionResponse,
  ListCompositionsResponse,
  CreateCompositionResponse,
  UpdateCompositionResponse,
  DeleteCompositionResponse,
  CompositionResponse,
  ExecuteCompositionResponse,
  PreviewCompositionRequest,
  PreviewCompositionResponse,
} from "@folio/contract/composition";
import { AccessLevel } from "@folio/contract/enums";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { Composition } from "@folio/db/schema";
import { QueryBuilder } from "@/lib/query-builder";

interface CompositionUsecaseDeps {
  compositionRepository: CompositionRepository;
  collectionRepository: CollectionRepository;
  workspaceRepository: WorkspaceRepository;
  recordRepository: RecordRepository;
  logger: Logger;
}

function toCompositionResponse(composition: Composition): CompositionResponse {
  return {
    id: composition.id,
    workspaceId: composition.workspaceId,
    slug: composition.slug,
    name: composition.name,
    description: composition.description,
    config: composition.config as CompositionResponse["config"],
    accessLevel: composition.accessLevel,
    isActive: composition.isActive,
    createdAt: composition.createdAt.toISOString(),
    updatedAt: composition.updatedAt.toISOString(),
    createdBy: composition.createdBy,
  };
}

export class CompositionUsecase {
  private compositionRepo: CompositionRepository;
  private collectionRepo: CollectionRepository;
  private workspaceRepo: WorkspaceRepository;
  private recordRepo: RecordRepository;
  private logger: Logger;

  constructor({
    compositionRepository,
    collectionRepository,
    workspaceRepository,
    recordRepository,
    logger,
  }: CompositionUsecaseDeps) {
    this.compositionRepo = compositionRepository;
    this.collectionRepo = collectionRepository;
    this.workspaceRepo = workspaceRepository;
    this.recordRepo = recordRepository;
    this.logger = logger;
  }

  async getComposition(
    workspaceId: string,
    compositionId: string,
  ): Promise<ResponseResult<GetCompositionResponse>> {
    try {
      const compositionResult =
        await this.compositionRepo.findById(compositionId);
      if (!compositionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      const composition = compositionResult.data;

      // Verify composition belongs to workspace
      if (composition.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok({
        composition: toCompositionResponse(composition),
      });
    } catch (e) {
      this.logger.error("Failed to get composition", {
        error: e,
        workspaceId,
        compositionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get composition"),
      );
    }
  }

  async getCompositionBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<GetCompositionResponse>> {
    try {
      const compositionResult =
        await this.compositionRepo.findByWorkspaceAndSlug(workspaceId, slug);
      if (!compositionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok({
        composition: toCompositionResponse(compositionResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to get composition by slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get composition"),
      );
    }
  }

  async listCompositions(
    workspaceId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListCompositionsResponse>> {
    try {
      const compositionsResult =
        await this.compositionRepo.findByWorkspace(workspaceId);

      if (!compositionsResult.ok) {
        return err(compositionsResult.error);
      }

      return ok({
        compositions: compositionsResult.data.map(toCompositionResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list compositions", {
        error: e,
        workspaceId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to list compositions"),
      );
    }
  }

  async createComposition(
    workspaceId: string,
    input: CreateCompositionRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateCompositionResponse>> {
    try {
      // Check if slug already exists in workspace
      const existingResult = await this.compositionRepo.findByWorkspaceAndSlug(
        workspaceId,
        input.slug,
      );

      if (existingResult.ok) {
        return err(
          createError(
            ErrorCode.AlreadyExists,
            "Composition with this slug already exists",
          ),
        );
      }

      // Create composition
      const createResult = await this.compositionRepo.create({
        workspaceId,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        config: input.config,
        accessLevel: input.accessLevel,
        isActive: input.isActive ?? true,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        composition: toCompositionResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create composition", {
        error: e,
        workspaceId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create composition"),
      );
    }
  }

  async updateComposition(
    workspaceId: string,
    compositionId: string,
    input: UpdateCompositionRequest,
  ): Promise<ResponseResult<UpdateCompositionResponse>> {
    try {
      // Verify composition exists and belongs to workspace
      const existingResult = await this.compositionRepo.findById(compositionId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      // Update composition
      const updateResult = await this.compositionRepo.update(compositionId, {
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
        composition: toCompositionResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update composition", {
        error: e,
        workspaceId,
        compositionId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update composition"),
      );
    }
  }

  async deleteComposition(
    workspaceId: string,
    compositionId: string,
  ): Promise<ResponseResult<DeleteCompositionResponse>> {
    try {
      // Verify composition exists and belongs to workspace
      const existingResult = await this.compositionRepo.findById(compositionId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      // Delete composition
      const deleteResult = await this.compositionRepo.delete(compositionId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete composition", {
        error: e,
        workspaceId,
        compositionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete composition"),
      );
    }
  }

  /**
   * Execute a composition by workspace and composition slugs.
   * This is used by the public /api/v1/c/:workspaceSlug/:compositionSlug endpoint.
   */
  async execute(
    workspaceSlug: string,
    compositionSlug: string,
    params: Record<string, unknown>,
    userId?: string,
  ): Promise<ResponseResult<ExecuteCompositionResponse>> {
    try {
      // 1. Resolve workspace by slug
      const workspaceResult =
        await this.workspaceRepo.findBySlug(workspaceSlug);
      if (!workspaceResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }
      const workspace = workspaceResult.data;

      // 2. Resolve composition by workspace and slug
      const compositionResult =
        await this.compositionRepo.findByWorkspaceAndSlug(
          workspace.id,
          compositionSlug,
        );
      if (!compositionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }
      const composition = compositionResult.data;

      // 3. Check access level
      if (composition.accessLevel === AccessLevel.Private) {
        return err(createError(ErrorCode.Forbidden, "Composition is private"));
      }
      if (composition.accessLevel === AccessLevel.Internal && !userId) {
        return err(
          createError(ErrorCode.Unauthorized, "Authentication required"),
        );
      }

      // 4. Check if composition is active
      if (!composition.isActive) {
        return err(
          createError(ErrorCode.Forbidden, "Composition is not active"),
        );
      }

      // 5. Resolve source collection by slug
      const fromCollectionResult =
        await this.collectionRepo.findByWorkspaceAndSlug(
          workspace.id,
          composition.config.from,
        );
      if (!fromCollectionResult.ok) {
        return err(
          createError(
            ErrorCode.NotFound,
            `Source collection not found: ${composition.config.from}`,
          ),
        );
      }

      // 6. Resolve join collections (if any)
      const joinCollectionIds = new Map<string, string>();
      if (composition.config.joins?.length) {
        for (const join of composition.config.joins) {
          const joinCollectionResult =
            await this.collectionRepo.findByWorkspaceAndSlug(
              workspace.id,
              join.collection,
            );
          if (!joinCollectionResult.ok) {
            return err(
              createError(
                ErrorCode.NotFound,
                `Join collection not found: ${join.collection}`,
              ),
            );
          }
          joinCollectionIds.set(join.collection, joinCollectionResult.data.id);
        }
      }

      // 7. Build query
      const queryBuilder = new QueryBuilder(composition.config, {
        workspaceId: workspace.id,
        fromCollectionId: fromCollectionResult.data.id,
        joinCollectionIds,
        params,
      });
      const { sql, values } = queryBuilder.build();

      // 8. Execute query
      const queryResult = await this.recordRepo.executeRaw(sql, values);
      if (!queryResult.ok) {
        return err(queryResult.error);
      }

      // 9. Return results
      return ok({
        data: queryResult.data,
        metadata: {
          count: queryResult.data.length,
          compositionId: composition.id,
          executedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      this.logger.error("Failed to execute composition", {
        error: e,
        workspaceSlug,
        compositionSlug,
      });

      // Handle query builder validation errors
      if (e instanceof Error && e.message.includes("Invalid field")) {
        return err(createError(ErrorCode.ValidationError, e.message));
      }

      return err(
        createError(ErrorCode.InternalError, "Failed to execute composition"),
      );
    }
  }

  /**
   * Preview/test a composition config without saving.
   * Returns query results to validate the config before creating.
   * Always returns success with success: true/false in the response body.
   */
  async preview(
    workspaceId: string,
    input: PreviewCompositionRequest,
  ): Promise<ResponseResult<PreviewCompositionResponse>> {
    try {
      const { config, params = {} } = input;

      // 1. Resolve source collection by slug
      const fromCollectionResult =
        await this.collectionRepo.findByWorkspaceAndSlug(
          workspaceId,
          config.from,
        );
      if (!fromCollectionResult.ok) {
        return ok({
          success: false,
          error: {
            message: `Source collection not found: ${config.from}`,
            field: "from",
          },
        });
      }

      // 2. Resolve join collections (if any)
      const joinCollectionIds = new Map<string, string>();
      if (config.joins?.length) {
        for (const join of config.joins) {
          const joinCollectionResult =
            await this.collectionRepo.findByWorkspaceAndSlug(
              workspaceId,
              join.collection,
            );
          if (!joinCollectionResult.ok) {
            return ok({
              success: false,
              error: {
                message: `Join collection not found: ${join.collection}`,
                field: "joins",
              },
            });
          }
          joinCollectionIds.set(join.collection, joinCollectionResult.data.id);
        }
      }

      // 3. Build query
      let sql: string;
      let values: unknown[];
      try {
        const queryBuilder = new QueryBuilder(config, {
          workspaceId,
          fromCollectionId: fromCollectionResult.data.id,
          joinCollectionIds,
          params,
        });
        const built = queryBuilder.build();
        sql = built.sql;
        values = built.values;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to build query";
        return ok({
          success: false,
          error: { message },
        });
      }

      // 4. Execute query
      const queryResult = await this.recordRepo.executeRaw(sql, values);
      if (!queryResult.ok) {
        return ok({
          success: false,
          error: { message: "Failed to execute query" },
        });
      }

      // 5. Return results
      return ok({
        success: true,
        data: queryResult.data,
        metadata: {
          count: queryResult.data.length,
          executedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      this.logger.error("Failed to preview composition", {
        error: e,
        workspaceId,
        config: input.config,
      });

      const message =
        e instanceof Error ? e.message : "Failed to preview composition";
      return ok({
        success: false,
        error: { message },
      });
    }
  }
}
