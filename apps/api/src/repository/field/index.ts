import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { fields, type Field } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateFieldInput, UpdateFieldInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class FieldRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Field>> {
    try {
      const result = await this.db
        .select()
        .from(fields)
        .where(eq(fields.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find field by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByCollection(
    collectionId: string,
  ): Promise<ResponseResult<Field[]>> {
    try {
      const result = await this.db
        .select()
        .from(fields)
        .where(eq(fields.collectionId, collectionId))
        .orderBy(asc(fields.sortOrder));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find fields by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByCollectionAndSlug(
    collectionId: string,
    slug: string,
  ): Promise<ResponseResult<Field>> {
    try {
      const result = await this.db
        .select()
        .from(fields)
        .where(
          and(eq(fields.collectionId, collectionId), eq(fields.slug, slug)),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find field by collection and slug", {
        error: e,
        collectionId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateFieldInput,
    tx?: TxType,
  ): Promise<ResponseResult<Field>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(fields).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create field"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create field", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async createMany(
    data: CreateFieldInput[],
    tx?: TxType,
  ): Promise<ResponseResult<Field[]>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(fields).values(data).returning();
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to create fields", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateFieldInput,
    tx?: TxType,
  ): Promise<ResponseResult<Field>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(fields)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fields.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update field", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(fields)
        .where(eq(fields.id, id))
        .returning({ id: fields.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Field not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete field", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async deleteByCollection(
    collectionId: string,
    tx?: TxType,
  ): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor
        .delete(fields)
        .where(eq(fields.collectionId, collectionId));
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete fields by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateFieldInput, UpdateFieldInput, FieldOptions } from "./types";
