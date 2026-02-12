import type { CollectionUsecase } from "@/usecase/collection";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  GetCollectionResponse,
  ListCollectionsResponse,
  CreateCollectionResponse,
  UpdateCollectionResponse,
  DeleteCollectionResponse,
} from "@folio/contract/collection";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface CollectionServiceDeps {
  collectionUsecase: CollectionUsecase;
}

export class CollectionService {
  private collectionUsecase: CollectionUsecase;

  constructor({ collectionUsecase }: CollectionServiceDeps) {
    this.collectionUsecase = collectionUsecase;
  }

  async getCollection(
    workspaceId: string,
    collectionId: string,
  ): Promise<ServiceResult<GetCollectionResponse>> {
    try {
      const result = await this.collectionUsecase.getCollection(
        workspaceId,
        collectionId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get collection");
    }
  }

  async getCollectionBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ServiceResult<GetCollectionResponse>> {
    try {
      const result = await this.collectionUsecase.getCollectionBySlug(
        workspaceId,
        slug,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get collection");
    }
  }

  async listCollections(
    workspaceId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListCollectionsResponse>> {
    try {
      const result = await this.collectionUsecase.listCollections(
        workspaceId,
        options,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list collections");
    }
  }

  async createCollection(
    workspaceId: string,
    input: CreateCollectionRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateCollectionResponse>> {
    try {
      const result = await this.collectionUsecase.createCollection(
        workspaceId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create collection");
    }
  }

  async updateCollection(
    workspaceId: string,
    collectionId: string,
    input: UpdateCollectionRequest,
  ): Promise<ServiceResult<UpdateCollectionResponse>> {
    try {
      const result = await this.collectionUsecase.updateCollection(
        workspaceId,
        collectionId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update collection");
    }
  }

  async deleteCollection(
    workspaceId: string,
    collectionId: string,
  ): Promise<ServiceResult<DeleteCollectionResponse>> {
    try {
      const result = await this.collectionUsecase.deleteCollection(
        workspaceId,
        collectionId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete collection");
    }
  }
}
