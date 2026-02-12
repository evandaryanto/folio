import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users, type User } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateUserInput, UpdateUserInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class UserRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<User>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find user by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByEmail(email: string): Promise<ResponseResult<User>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find user by email", { error: e, email });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(workspaceId: string): Promise<ResponseResult<User[]>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find users by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<ResponseResult<User>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(and(eq(users.workspaceId, workspaceId), eq(users.email, email)))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find user by workspace and email", {
        error: e,
        workspaceId,
        email,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateUserInput,
    tx?: TxType,
  ): Promise<ResponseResult<User>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(users).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create user"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create user", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateUserInput,
    tx?: TxType,
  ): Promise<ResponseResult<User>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "User not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update user", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateUserInput, UpdateUserInput } from "./types";
