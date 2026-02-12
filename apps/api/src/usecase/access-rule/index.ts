import type { AccessRuleRepository } from "@/repository/access-rule";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type {
  CreateAccessRuleRequest,
  UpdateAccessRuleRequest,
  GetAccessRuleResponse,
  ListAccessRulesResponse,
  CreateAccessRuleResponse,
  UpdateAccessRuleResponse,
  DeleteAccessRuleResponse,
  AccessRuleResponse,
} from "@folio/contract/access-rule";
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";
import type { AccessRule } from "@folio/db/schema";

interface AccessRuleUsecaseDeps {
  accessRuleRepository: AccessRuleRepository;
  logger: Logger;
}

function toAccessRuleResponse(accessRule: AccessRule): AccessRuleResponse {
  return {
    id: accessRule.id,
    workspaceId: accessRule.workspaceId,
    roleId: accessRule.roleId,
    resourceType: accessRule.resourceType,
    resourceId: accessRule.resourceId,
    actions: accessRule.actions,
    conditions: accessRule.conditions as AccessRuleResponse["conditions"],
    createdAt: accessRule.createdAt.toISOString(),
    updatedAt: accessRule.updatedAt.toISOString(),
  };
}

export class AccessRuleUsecase {
  private accessRuleRepo: AccessRuleRepository;
  private logger: Logger;

  constructor({ accessRuleRepository, logger }: AccessRuleUsecaseDeps) {
    this.accessRuleRepo = accessRuleRepository;
    this.logger = logger;
  }

  async getAccessRule(
    workspaceId: string,
    accessRuleId: string,
  ): Promise<ResponseResult<GetAccessRuleResponse>> {
    try {
      const accessRuleResult = await this.accessRuleRepo.findById(accessRuleId);
      if (!accessRuleResult.ok) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      const accessRule = accessRuleResult.data;

      // Verify access rule belongs to workspace
      if (accessRule.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      return ok({
        accessRule: toAccessRuleResponse(accessRule),
      });
    } catch (e) {
      this.logger.error("Failed to get access rule", {
        error: e,
        workspaceId,
        accessRuleId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get access rule"),
      );
    }
  }

  async listAccessRules(
    workspaceId: string,
    _options?: { cursor?: string; limit?: number },
  ): Promise<ResponseResult<ListAccessRulesResponse>> {
    try {
      const accessRulesResult =
        await this.accessRuleRepo.findByWorkspace(workspaceId);

      if (!accessRulesResult.ok) {
        return err(accessRulesResult.error);
      }

      return ok({
        accessRules: accessRulesResult.data.map(toAccessRuleResponse),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    } catch (e) {
      this.logger.error("Failed to list access rules", {
        error: e,
        workspaceId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to list access rules"),
      );
    }
  }

  async createAccessRule(
    workspaceId: string,
    input: CreateAccessRuleRequest,
  ): Promise<ResponseResult<CreateAccessRuleResponse>> {
    try {
      // Create access rule
      const createResult = await this.accessRuleRepo.create({
        workspaceId,
        roleId: input.roleId ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        actions: input.actions ?? [],
        conditions: input.conditions ?? null,
      });

      if (!createResult.ok) {
        return err(createResult.error);
      }

      return ok({
        accessRule: toAccessRuleResponse(createResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to create access rule", {
        error: e,
        workspaceId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to create access rule"),
      );
    }
  }

  async updateAccessRule(
    workspaceId: string,
    accessRuleId: string,
    input: UpdateAccessRuleRequest,
  ): Promise<ResponseResult<UpdateAccessRuleResponse>> {
    try {
      // Verify access rule exists and belongs to workspace
      const existingResult = await this.accessRuleRepo.findById(accessRuleId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      // Update access rule
      const updateResult = await this.accessRuleRepo.update(accessRuleId, {
        actions: input.actions,
        conditions: input.conditions,
      });

      if (!updateResult.ok) {
        return err(updateResult.error);
      }

      return ok({
        accessRule: toAccessRuleResponse(updateResult.data),
      });
    } catch (e) {
      this.logger.error("Failed to update access rule", {
        error: e,
        workspaceId,
        accessRuleId,
        input,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to update access rule"),
      );
    }
  }

  async deleteAccessRule(
    workspaceId: string,
    accessRuleId: string,
  ): Promise<ResponseResult<DeleteAccessRuleResponse>> {
    try {
      // Verify access rule exists and belongs to workspace
      const existingResult = await this.accessRuleRepo.findById(accessRuleId);
      if (!existingResult.ok) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      if (existingResult.data.workspaceId !== workspaceId) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      // Delete access rule
      const deleteResult = await this.accessRuleRepo.delete(accessRuleId);
      if (!deleteResult.ok) {
        return err(deleteResult.error);
      }

      return ok({ success: true });
    } catch (e) {
      this.logger.error("Failed to delete access rule", {
        error: e,
        workspaceId,
        accessRuleId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to delete access rule"),
      );
    }
  }
}
