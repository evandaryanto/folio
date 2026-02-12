import type { RecordUsecase } from "@/usecase/record";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateRecordRequest,
  UpdateRecordRequest,
  BulkCreateRecordsRequest,
  GetRecordResponse,
  ListRecordsResponse,
  CreateRecordResponse,
  UpdateRecordResponse,
  DeleteRecordResponse,
  BulkCreateRecordsResponse,
} from "@folio/contract/record";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface RecordServiceDeps {
  recordUsecase: RecordUsecase;
}

export class RecordService {
  private recordUsecase: RecordUsecase;

  constructor({ recordUsecase }: RecordServiceDeps) {
    this.recordUsecase = recordUsecase;
  }

  async getRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
  ): Promise<ServiceResult<GetRecordResponse>> {
    try {
      const result = await this.recordUsecase.getRecord(
        workspaceId,
        collectionId,
        recordId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get record");
    }
  }

  async listRecords(
    workspaceId: string,
    collectionId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListRecordsResponse>> {
    try {
      const result = await this.recordUsecase.listRecords(
        workspaceId,
        collectionId,
        options,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list records");
    }
  }

  async createRecord(
    workspaceId: string,
    collectionId: string,
    input: CreateRecordRequest,
    createdBy: string,
  ): Promise<ServiceResult<CreateRecordResponse>> {
    try {
      const result = await this.recordUsecase.createRecord(
        workspaceId,
        collectionId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create record");
    }
  }

  async updateRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
    input: UpdateRecordRequest,
    updatedBy: string,
  ): Promise<ServiceResult<UpdateRecordResponse>> {
    try {
      const result = await this.recordUsecase.updateRecord(
        workspaceId,
        collectionId,
        recordId,
        input,
        updatedBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update record");
    }
  }

  async deleteRecord(
    workspaceId: string,
    collectionId: string,
    recordId: string,
  ): Promise<ServiceResult<DeleteRecordResponse>> {
    try {
      const result = await this.recordUsecase.deleteRecord(
        workspaceId,
        collectionId,
        recordId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete record");
    }
  }

  async bulkCreateRecords(
    workspaceId: string,
    collectionId: string,
    input: BulkCreateRecordsRequest,
    createdBy: string,
  ): Promise<ServiceResult<BulkCreateRecordsResponse>> {
    try {
      const result = await this.recordUsecase.bulkCreateRecords(
        workspaceId,
        collectionId,
        input,
        createdBy,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to bulk create records");
    }
  }
}
