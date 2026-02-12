import type { RecordRepository } from "@/repository/record";
import type { CollectionRepository } from "@/repository/collection";
import type { FieldRepository } from "@/repository/field";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateRecordRequest,
  UpdateRecordRequest,
  GetRecordResponse,
  ListRecordsResponse,
  CreateRecordResponse,
  UpdateRecordResponse,
  DeleteRecordResponse,
} from "@folio/contract/record";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { DbRecord } from "@folio/db/schema";
import { validateRecord } from "@/lib/record-validator";

interface RecordUsecaseDeps {
  recordRepository: RecordRepository;
  collectionRepository: CollectionRepository;
  fieldRepository: FieldRepository;
  logger: Logger;
}

function toRecordResponse(record: DbRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    collectionId: record.collectionId,
    data: record.data as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
  };
}

export class RecordUsecase {
  private recordRepo: RecordRepository;
  private collectionRepo: CollectionRepository;
  private fieldRepo: FieldRepository;
  private logger: Logger;

  constructor({
    recordRepository,
    collectionRepository,
    fieldRepository,
    logger,
  }: RecordUsecaseDeps) {
    this.recordRepo = recordRepository;
    this.collectionRepo = collectionRepository;
    this.fieldRepo = fieldRepository;
    this.logger = logger;
  }

  async getRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
  ): Promise<ResponseResult<GetRecordResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      const recordResult = await this.recordRepo.findById(recordId);
      if (!recordResult.ok) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      const record = recordResult.data;

      // Verify record belongs to collection
      if (record.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      return ok({
        record: toRecordResponse(record),
      });
    } catch (e) {
      this.logger.error("Failed to get record", {
        error: e,
        workspaceId,
        collectionId,
        recordId,
      });
      return err(createError(ErrorCode.InternalError, "Failed to get record"));
    }
  }

  async listRecords(
    workspaceId: string,
    collectionId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListRecordsResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      const limit = options?.limit ?? 50;
      const recordsResult = await this.recordRepo.findByFilter({
        workspaceId,
        collectionId,
        cursor: options?.cursor,
        limit: limit + 1, // Fetch one extra to determine hasMore
      });

      if (!recordsResult.ok) {
        return err(recordsResult.error);
      }

      const records = recordsResult.data;
      const hasMore = records.length > limit;
      const resultRecords = hasMore ? records.slice(0, limit) : records;
      const nextCursor =
        hasMore && resultRecords.length > 0
          ? resultRecords[resultRecords.length - 1].id
          : null;

      return ok({
        records: resultRecords.map(toRecordResponse),
        pagination: {
          hasMore,
          nextCursor,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list records", {
        error: e,
        workspaceId,
        collectionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to list records"),
      );
    }
  }

  async createRecord(
    workspaceId: string,
    collectionId: string,
    input: CreateRecordRequest,
    createdBy: string,
  ): Promise<ResponseResult<CreateRecordResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Fetch fields for validation (schema-first approach)
      const fieldsResult = await this.fieldRepo.findByCollection(collectionId);
      if (!fieldsResult.ok) {
        return err(fieldsResult.error);
      }

      const fields = fieldsResult.data;

      // Require at least one field to be defined (schema-first)
      if (fields.length === 0) {
        return err(
          createError(
            ErrorCode.ValidationError,
            "Collection has no fields defined. Please define a schema before creating records.",
          ),
        );
      }

      // Validate record data against field schema
      const validation = validateRecord(input.data, fields);
      if (!validation.valid) {
        const errorMessages = validation.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join("; ");
        return err(createError(ErrorCode.ValidationError, errorMessages));
      }

      // Create record with normalized data (defaults applied)
      const createResult = await this.recordRepo.create({
        workspaceId,
        collectionId,
        data: validation.data,
        createdBy,
        updatedBy: createdBy,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        record: toRecordResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create record", {
        error: e,
        workspaceId,
        collectionId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create record"),
      );
    }
  }

  async updateRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
    input: UpdateRecordRequest,
    updatedBy: string,
  ): Promise<ResponseResult<UpdateRecordResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Verify record exists and belongs to collection
      const existingResult = await this.recordRepo.findById(recordId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }
      if (existingResult.data.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      // Fetch fields for validation
      const fieldsResult = await this.fieldRepo.findByCollection(collectionId);
      if (!fieldsResult.ok) {
        return err(fieldsResult.error);
      }

      // Validate record data against field schema (isUpdate allows partial data)
      const validation = validateRecord(input.data, fieldsResult.data, {
        isUpdate: true,
      });
      if (!validation.valid) {
        const errorMessages = validation.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join("; ");
        return err(createError(ErrorCode.ValidationError, errorMessages));
      }

      // Update record with validated data
      const updateResult = await this.recordRepo.update(recordId, {
        data: validation.data,
        updatedBy,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        record: toRecordResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update record", {
        error: e,
        workspaceId,
        collectionId,
        recordId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update record"),
      );
    }
  }

  async deleteRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
  ): Promise<ResponseResult<DeleteRecordResponse>> {
    try {
      // Verify collection exists and belongs to workspace
      const collectionResult = await this.collectionRepo.findById(collectionId);
      if (!collectionResult.ok) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }
      if (collectionResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      // Verify record exists and belongs to collection
      const existingResult = await this.recordRepo.findById(recordId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }
      if (existingResult.data.collectionId !== collectionId) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      // Delete record
      const deleteResult = await this.recordRepo.delete(recordId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete record", {
        error: e,
        workspaceId,
        collectionId,
        recordId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete record"),
      );
    }
  }
}
