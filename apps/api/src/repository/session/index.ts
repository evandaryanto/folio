import { and, eq, gt, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sessions, type Session } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateSessionInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class SessionRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Session>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Session not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find session by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByUser(userId: string): Promise<ResponseResult<Session[]>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find sessions by user", {
        error: e,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findValidByUser(userId: string): Promise<ResponseResult<Session[]>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())),
        );

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find valid sessions by user", {
        error: e,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<ResponseResult<Session>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.refreshTokenHash, refreshTokenHash),
            gt(sessions.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Session not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find session by refresh token hash", {
        error: e,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateSessionInput,
    tx?: TxType,
  ): Promise<ResponseResult<Session>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(sessions).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create session"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create session", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor.delete(sessions).where(eq(sessions.id, id));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete session", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByUser(
    userId: string,
    tx?: TxType,
  ): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor.delete(sessions).where(eq(sessions.userId, userId));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete sessions by user", {
        error: e,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteExpired(tx?: TxType): Promise<ResponseResult<number>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()))
        .returning({ id: sessions.id });

      return ok(result.length);
    } catch (e) {
      this.logger.error("Failed to delete expired sessions", { error: e });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateSessionInput } from "./types";
