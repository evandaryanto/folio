import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { collections, type Collection } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateCollectionInput, UpdateCollectionInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class CollectionRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Collection>> {
    try {
      const result = await this.db
        .select()
        .from(collections)
        .where(eq(collections.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find collection by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(
    workspaceId: string,
  ): Promise<ResponseResult<Collection[]>> {
    try {
      const result = await this.db
        .select()
        .from(collections)
        .where(eq(collections.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find collections by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndSlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<Collection>> {
    try {
      const result = await this.db
        .select()
        .from(collections)
        .where(
          and(
            eq(collections.workspaceId, workspaceId),
            eq(collections.slug, slug),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find collection by workspace and slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateCollectionInput,
    tx?: TxType,
  ): Promise<ResponseResult<Collection>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .insert(collections)
        .values(data)
        .returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create collection"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create collection", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateCollectionInput,
    tx?: TxType,
  ): Promise<ResponseResult<Collection>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(collections)
        .set({
          ...data,
          updatedAt: new Date(),
          version: sql`${collections.version} + 1`,
        })
        .where(eq(collections.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update collection", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(collections)
        .where(eq(collections.id, id))
        .returning({ id: collections.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Collection not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete collection", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateCollectionInput, UpdateCollectionInput } from "./types";
