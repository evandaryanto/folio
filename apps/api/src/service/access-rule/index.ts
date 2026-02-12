import type { AccessRuleUsecase } from "@/usecase/access-rule";
import type { ServiceResult } from "@/utils/types/result";
import type {
  CreateAccessRuleRequest,
  UpdateAccessRuleRequest,
  GetAccessRuleResponse,
  ListAccessRulesResponse,
  CreateAccessRuleResponse,
  UpdateAccessRuleResponse,
  DeleteAccessRuleResponse,
} from "@folio/contract/access-rule";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface AccessRuleServiceDeps {
  accessRuleUsecase: AccessRuleUsecase;
}

export class AccessRuleService {
  private accessRuleUsecase: AccessRuleUsecase;

  constructor({ accessRuleUsecase }: AccessRuleServiceDeps) {
    this.accessRuleUsecase = accessRuleUsecase;
  }

  async getAccessRule(
    workspaceId: string,
    accessRuleId: string,
  ): Promise<ServiceResult<GetAccessRuleResponse>> {
    try {
      const result = await this.accessRuleUsecase.getAccessRule(
        workspaceId,
        accessRuleId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get access rule");
    }
  }

  async listAccessRules(
    workspaceId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<ServiceResult<ListAccessRulesResponse>> {
    try {
      const result = await this.accessRuleUsecase.listAccessRules(
        workspaceId,
        options,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to list access rules");
    }
  }

  async createAccessRule(
    workspaceId: string,
    input: CreateAccessRuleRequest,
  ): Promise<ServiceResult<CreateAccessRuleResponse>> {
    try {
      const result = await this.accessRuleUsecase.createAccessRule(
        workspaceId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to create access rule");
    }
  }

  async updateAccessRule(
    workspaceId: string,
    accessRuleId: string,
    input: UpdateAccessRuleRequest,
  ): Promise<ServiceResult<UpdateAccessRuleResponse>> {
    try {
      const result = await this.accessRuleUsecase.updateAccessRule(
        workspaceId,
        accessRuleId,
        input,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to update access rule");
    }
  }

  async deleteAccessRule(
    workspaceId: string,
    accessRuleId: string,
  ): Promise<ServiceResult<DeleteAccessRuleResponse>> {
    try {
      const result = await this.accessRuleUsecase.deleteAccessRule(
        workspaceId,
        accessRuleId,
      );

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to delete access rule");
    }
  }
}
