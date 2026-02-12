import type { FieldUsecase } from "@/usecase/field";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateFieldRequest,
  UpdateFieldRequest,
  GetFieldResponse,
  ListFieldsResponse,
  CreateFieldResponse,
  UpdateFieldResponse,
  DeleteFieldResponse,
} from "@folio/contract/field";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface FieldServiceDeps {
  fieldUsecase: FieldUsecase;
}

export class FieldService {
  private fieldUsecase: FieldUsecase;

  constructor({ fieldUsecase }: FieldServiceDeps) {
    this.fieldUsecase = fieldUsecase;
  }

  async getField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
  ): Promise<ServiceResult<GetFieldResponse>> {
    try {
      const result = await this.fieldUsecase.getField(
        workspaceId,
        collectionId,
        fieldId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get field");
    }
  }

  async listFields(
    workspaceId: string,
    collectionId: string,
  ): Promise<ServiceResult<ListFieldsResponse>> {
    try {
      const result = await this.fieldUsecase.listFields(
        workspaceId,
        collectionId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list fields");
    }
  }

  async createField(
    workspaceId: string,
    collectionId: string,
    input: CreateFieldRequest,
  ): Promise<ServiceResult<CreateFieldResponse>> {
    try {
      const result = await this.fieldUsecase.createField(
        workspaceId,
        collectionId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create field");
    }
  }

  async updateField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
    input: UpdateFieldRequest,
  ): Promise<ServiceResult<UpdateFieldResponse>> {
    try {
      const result = await this.fieldUsecase.updateField(
        workspaceId,
        collectionId,
        fieldId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update field");
    }
  }

  async deleteField(
    workspaceId: string,
    collectionId: string,
    fieldId: string,
  ): Promise<ServiceResult<DeleteFieldResponse>> {
    try {
      const result = await this.fieldUsecase.deleteField(
        workspaceId,
        collectionId,
        fieldId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete field");
    }
  }
}
