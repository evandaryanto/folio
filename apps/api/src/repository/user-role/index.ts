import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { userRoles, type UserRole } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateUserRoleInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class UserRoleRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<UserRole>> {
    try {
      const result = await this.db
        .select()
        .from(userRoles)
        .where(eq(userRoles.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User role not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find user role by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByUser(userId: string): Promise<ResponseResult<UserRole[]>> {
    try {
      const result = await this.db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find user roles by user", {
        error: e,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByRole(roleId: string): Promise<ResponseResult<UserRole[]>> {
    try {
      const result = await this.db
        .select()
        .from(userRoles)
        .where(eq(userRoles.roleId, roleId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find user roles by role", {
        error: e,
        roleId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByUserAndRole(
    userId: string,
    roleId: string,
  ): Promise<ResponseResult<UserRole>> {
    try {
      const result = await this.db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User role not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find user role by user and role", {
        error: e,
        userId,
        roleId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateUserRoleInput,
    tx?: TxType,
  ): Promise<ResponseResult<UserRole>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(userRoles).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create user role"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create user role", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(userRoles)
        .where(eq(userRoles.id, id))
        .returning({ id: userRoles.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User role not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete user role", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByUser(
    userId: string,
    tx?: TxType,
  ): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor.delete(userRoles).where(eq(userRoles.userId, userId));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete user roles by user", {
        error: e,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByRole(
    roleId: string,
    tx?: TxType,
  ): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor.delete(userRoles).where(eq(userRoles.roleId, roleId));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete user roles by role", {
        error: e,
        roleId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateUserRoleInput } from "./types";
