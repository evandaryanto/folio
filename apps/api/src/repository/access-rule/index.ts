import { and, eq, isNull, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { accessRules, type AccessRule } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateAccessRuleInput, UpdateAccessRuleInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class AccessRuleRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<AccessRule>> {
    try {
      const result = await this.db
        .select()
        .from(accessRules)
        .where(eq(accessRules.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find access rule by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(
    workspaceId: string,
  ): Promise<ResponseResult<AccessRule[]>> {
    try {
      const result = await this.db
        .select()
        .from(accessRules)
        .where(eq(accessRules.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find access rules by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByRole(roleId: string): Promise<ResponseResult<AccessRule[]>> {
    try {
      const result = await this.db
        .select()
        .from(accessRules)
        .where(eq(accessRules.roleId, roleId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find access rules by role", {
        error: e,
        roleId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByResource(
    workspaceId: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<ResponseResult<AccessRule[]>> {
    try {
      const conditions = [
        eq(accessRules.workspaceId, workspaceId),
        eq(accessRules.resourceType, resourceType),
      ];

      // Find rules that apply to specific resource OR all resources of type
      if (resourceId) {
        conditions.push(
          or(
            eq(accessRules.resourceId, resourceId),
            isNull(accessRules.resourceId),
          )!,
        );
      }

      const result = await this.db
        .select()
        .from(accessRules)
        .where(and(...conditions));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find access rules by resource", {
        error: e,
        workspaceId,
        resourceType,
        resourceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByRoleAndResource(
    roleId: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<ResponseResult<AccessRule[]>> {
    try {
      const conditions = [
        eq(accessRules.roleId, roleId),
        eq(accessRules.resourceType, resourceType),
      ];

      if (resourceId) {
        conditions.push(
          or(
            eq(accessRules.resourceId, resourceId),
            isNull(accessRules.resourceId),
          )!,
        );
      }

      const result = await this.db
        .select()
        .from(accessRules)
        .where(and(...conditions));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find access rules by role and resource", {
        error: e,
        roleId,
        resourceType,
        resourceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateAccessRuleInput,
    tx?: TxType,
  ): Promise<ResponseResult<AccessRule>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .insert(accessRules)
        .values(data)
        .returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create access rule"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create access rule", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateAccessRuleInput,
    tx?: TxType,
  ): Promise<ResponseResult<AccessRule>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(accessRules)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(accessRules.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update access rule", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(accessRules)
        .where(eq(accessRules.id, id))
        .returning({ id: accessRules.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Access rule not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete access rule", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByRole(
    roleId: string,
    tx?: TxType,
  ): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor.delete(accessRules).where(eq(accessRules.roleId, roleId));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete access rules by role", {
        error: e,
        roleId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type {
  CreateAccessRuleInput,
  UpdateAccessRuleInput,
  AccessConditions,
} from "./types";
