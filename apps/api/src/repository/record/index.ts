import { and, desc, eq, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { records, type DbRecord } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type {
  CreateRecordInput,
  UpdateRecordInput,
  RecordFilter,
} from "./types";

interface Deps {
  db: NodePgDatabase;
  pool: Pool;
  logger: Logger;
}

export class RecordRepository {
  private db: NodePgDatabase;
  private pool: Pool;
  private logger: Logger;

  constructor({ db, pool, logger }: Deps) {
    this.db = db;
    this.pool = pool;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<DbRecord>> {
    try {
      const result = await this.db
        .select()
        .from(records)
        .where(eq(records.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find record by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByFilter(
    filter: RecordFilter,
  ): Promise<ResponseResult<DbRecord[]>> {
    try {
      const conditions = [
        eq(records.workspaceId, filter.workspaceId),
        eq(records.collectionId, filter.collectionId),
      ];

      if (filter.cursor) {
        conditions.push(lt(records.id, filter.cursor));
      }

      let query = this.db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(desc(records.id));

      if (filter.limit) {
        query = query.limit(filter.limit) as typeof query;
      }

      const result = await query;
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find records by filter", {
        error: e,
        filter,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByCollection(
    collectionId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<ResponseResult<DbRecord[]>> {
    try {
      const conditions = [eq(records.collectionId, collectionId)];

      if (options?.cursor) {
        conditions.push(lt(records.id, options.cursor));
      }

      let query = this.db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(desc(records.id));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }

      const result = await query;
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find records by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateRecordInput,
    tx?: TxType,
  ): Promise<ResponseResult<DbRecord>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(records).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create record"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create record", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async createMany(
    data: CreateRecordInput[],
    tx?: TxType,
  ): Promise<ResponseResult<DbRecord[]>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(records).values(data).returning();
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to create records", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateRecordInput,
    tx?: TxType,
  ): Promise<ResponseResult<DbRecord>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(records)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(records.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update record", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(records)
        .where(eq(records.id, id))
        .returning({ id: records.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Record not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete record", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByCollection(
    collectionId: string,
    tx?: TxType,
  ): Promise<ResponseResult<number>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(records)
        .where(eq(records.collectionId, collectionId))
        .returning({ id: records.id });

      return ok(result.length);
    } catch (e) {
      this.logger.error("Failed to delete records by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async countByCollection(
    collectionId: string,
  ): Promise<ResponseResult<number>> {
    try {
      const result = await this.db
        .select()
        .from(records)
        .where(eq(records.collectionId, collectionId));

      return ok(result.length);
    } catch (e) {
      this.logger.error("Failed to count records by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  /**
   * Executes a raw SQL query with parameterized values.
   * Used for dynamic composition queries.
   *
   * @param sqlQuery - The SQL query string with $1, $2, etc. placeholders
   * @param values - The values to bind to the placeholders
   */
  async executeRaw(
    sqlQuery: string,
    values: unknown[],
  ): Promise<ResponseResult<Record<string, unknown>[]>> {
    try {
      // Use the pg pool directly for parameterized raw queries
      const result = await this.pool.query(sqlQuery, values);
      return ok(result.rows as Record<string, unknown>[]);
    } catch (e) {
      this.logger.error("Failed to execute raw query", {
        error: e,
        // Don't log values in production - may contain sensitive data
      });
      return err(
        createError(ErrorCode.InternalError, "Query execution failed"),
      );
    }
  }
}

export type {
  CreateRecordInput,
  UpdateRecordInput,
  RecordFilter,
  DbRecord,
} from "./types";
