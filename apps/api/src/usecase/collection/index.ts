import type { CollectionRepository } from "@/repository/collection";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  GetCollectionResponse,
  ListCollectionsResponse,
  CreateCollectionResponse,
  UpdateCollectionResponse,
  DeleteCollectionResponse,
} from "@folio/contract/collection";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { Collection } from "@folio/db/schema";

interface CollectionUsecaseDeps {
  collectionRepository: CollectionRepository;
  logger: Logger;
}

function toCollectionResponse(collection: Collection) {
  return {
    id: collection.id,
    workspaceId: collection.workspaceId,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    icon: collection.icon,
    isActive: collection.isActive,
    version: collection.version,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    createdBy: collection.createdBy,
  };
}

export class CollectionUsecase {
  private collectionRepo: CollectionRepository;
  private logger: Logger;

  constructor({ collectionRepository, logger }: CollectionUsecaseDeps) {
    this.collectionRepo = collectionRepository;
    this.logger = logger;
  }

  async getCollection(
    workspaceId: string,
    collectionId: string,
  ): Promise<ResponseResult<GetCollectionResponse>> {
    try {
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      const collection = collectionResult.data;

      // Verify collection belongs to workspace
      if (collection.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok({
        collection: toCollectionResponse(collection),
      });
    } catch (e) {
      this.logger.error("Failed to get collection", {
        error: e,
        workspaceId,
        collectionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get collection"),
      );
    }
  }

  async getCollectionBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<GetCollectionResponse>> {
    try {
      const collectionResult = await this.collectionRepo.findByWorkspaceAndSlug(
        workspaceId,
        slug,
      );

      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok({
        collection: toCollectionResponse(collectionResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to get collection by slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get collection"),
      );
    }
  }

  async listCollections(
    workspaceId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListCollectionsResponse>> {
    try {
      const collectionsResult =
        await this.collectionRepo.findByWorkspace(workspaceId);

      if (!collectionsResult.ok) {
        return err(collectionsResult.error);
      }

      return ok({
        collections: collectionsResult.data.map(toCollectionResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list collections", {
        error: e,
        workspaceId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to list collections"),
      );
    }
  }

  async createCollection(
    workspaceId: string,
    input: CreateCollectionRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateCollectionResponse>> {
    try {
      // Check if slug already exists in workspace
      const existingResult = await this.collectionRepo.findByWorkspaceAndSlug(
        workspaceId,
        input.slug,
      );

      if (existingResult.ok) {
        return err(
          createError(
            ErrorCode.AlreadyExists,
            "Collection slug already exists",
          ),
        );
      }

      // Create collection
      const createResult = await this.collectionRepo.create({
        workspaceId,
        slug: input.slug,
        name: input.name,
        description: input.description,
        icon: input.icon,
        createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        collection: toCollectionResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create collection", {
        error: e,
        workspaceId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create collection"),
      );
    }
  }

  async updateCollection(
    workspaceId: string,
    collectionId: string,
    input: UpdateCollectionRequest,
  ): Promise<ResponseResult<UpdateCollectionResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const existingResult = await this.collectionRepo.findById(collectionId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Update collection
      const updateResult = await this.collectionRepo.update(collectionId, {
        name: input.name,
        description: input.description,
        icon: input.icon,
        isActive: input.isActive,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        collection: toCollectionResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update collection", {
        error: e,
        workspaceId,
        collectionId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update collection"),
      );
    }
  }

  async deleteCollection(
    workspaceId: string,
    collectionId: string,
  ): Promise<ResponseResult<DeleteCollectionResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const existingResult = await this.collectionRepo.findById(collectionId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Delete collection
      const deleteResult = await this.collectionRepo.delete(collectionId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete collection", {
        error: e,
        workspaceId,
        collectionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete collection"),
      );
    }
  }
}
