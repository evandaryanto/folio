import type { FieldRepository } from "@/repository/field";
import type { CollectionRepository } from "@/repository/collection";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateFieldRequest,
  UpdateFieldRequest,
  GetFieldResponse,
  ListFieldsResponse,
  CreateFieldResponse,
  UpdateFieldResponse,
  DeleteFieldResponse,
} from "@folio/contract/field";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { Field } from "@folio/db/schema";

interface FieldUsecaseDeps {
  fieldRepository: FieldRepository;
  collectionRepository: CollectionRepository;
  logger: Logger;
}

function toFieldResponse(field: Field) {
  return {
    id: field.id,
    collectionId: field.collectionId,
    slug: field.slug,
    name: field.name,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    isUnique: field.isUnique,
    defaultValue: field.defaultValue,
    options: field.options,
    sortOrder: field.sortOrder,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  };
}

export class FieldUsecase {
  private fieldRepo: FieldRepository;
  private collectionRepo: CollectionRepository;
  private logger: Logger;

  constructor({
    fieldRepository,
    collectionRepository,
    logger,
  }: FieldUsecaseDeps) {
    this.fieldRepo = fieldRepository;
    this.collectionRepo = collectionRepository;
    this.logger = logger;
  }

  async getField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
  ): Promise<ResponseResult<GetFieldResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      const fieldResult = await this.fieldRepo.findById(fieldId);
      if (!fieldResult.ok) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      const field = fieldResult.data;

      // Verify field belongs to collection
      if (field.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      return ok({
        field: toFieldResponse(field),
      });
    } catch (e) {
      this.logger.error("Failed to get field", {
        error: e,
        workspaceId,
        collectionId,
        fieldId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get field"));
    }
  }

  async listFields(
    workspaceId: string,
    collectionId: string,
  ): Promise<ResponseResult<ListFieldsResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      const fieldsResult = await this.fieldRepo.findByCollection(collectionId);
      if (!fieldsResult.ok) {
        return err(fieldsResult.error);
      }

      return ok({
        fields: fieldsResult.data.map(toFieldResponse),
      });
    } catch (e) {
      this.logger.error("Failed to list fields", {
        error: e,
        workspaceId,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to list fields"));
    }
  }

  async createField(
    workspaceId: string,
    collectionId: string,
    input: CreateFieldRequest,
  ): Promise<ResponseResult<CreateFieldResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Check if slug already exists in collection
      const existingResult = await this.fieldRepo.findByCollectionAndSlug(
        collectionId,
        input.slug,
      );
      if (existingResult.ok) {
        return err(
          createError(ErrorCode.AlreadyExists, "Field slug already exists"),
        );
      }

      // Create field
      const createResult = await this.fieldRepo.create({
        collectionId,
        slug: input.slug,
        name: input.name,
        fieldType: input.fieldType,
        isRequired: input.isRequired ?? false,
        isUnique: input.isUnique ?? false,
        defaultValue: input.defaultValue ?? null,
        options: input.options ?? null,
        sortOrder: input.sortOrder ?? 0,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        field: toFieldResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create field", {
        error: e,
        workspaceId,
        collectionId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create field"),
      );
    }
  }

  async updateField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
    input: UpdateFieldRequest,
  ): Promise<ResponseResult<UpdateFieldResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Verify field exists and belongs to collection
      const existingResult = await this.fieldRepo.findById(fieldId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }
      if (existingResult.data.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      // Update field
      const updateResult = await this.fieldRepo.update(fieldId, {
        name: input.name,
        isRequired: input.isRequired,
        isUnique: input.isUnique,
        defaultValue: input.defaultValue,
        options: input.options,
        sortOrder: input.sortOrder,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        field: toFieldResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update field", {
        error: e,
        workspaceId,
        collectionId,
        fieldId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update field"),
      );
    }
  }

  async deleteField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
  ): Promise<ResponseResult<DeleteFieldResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Verify field exists and belongs to collection
      const existingResult = await this.fieldRepo.findById(fieldId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }
      if (existingResult.data.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      // Delete field
      const deleteResult = await this.fieldRepo.delete(fieldId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete field", {
        error: e,
        workspaceId,
        collectionId,
        fieldId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete field"),
      );
    }
  }
}
