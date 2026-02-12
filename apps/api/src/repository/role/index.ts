import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { roles, type Role } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateRoleInput, UpdateRoleInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class RoleRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Role>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Role not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find role by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(workspaceId: string): Promise<ResponseResult<Role[]>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(eq(roles.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find roles by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndName(
    workspaceId: string,
    name: string,
  ): Promise<ResponseResult<Role>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(and(eq(roles.workspaceId, workspaceId), eq(roles.name, name)))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Role not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find role by workspace and name", {
        error: e,
        workspaceId,
        name,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateRoleInput,
    tx?: TxType,
  ): Promise<ResponseResult<Role>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(roles).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create role"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create role", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateRoleInput,
    tx?: TxType,
  ): Promise<ResponseResult<Role>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Role not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update role", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(roles)
        .where(eq(roles.id, id))
        .returning({ id: roles.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Role not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete role", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateRoleInput, UpdateRoleInput } from "./types";
