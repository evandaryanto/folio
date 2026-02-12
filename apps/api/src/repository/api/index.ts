import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { apis, type Api } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateApiInput, UpdateApiInput } from "./types";
import type { ApiMethod } from "@folio/contract/enums";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class ApiRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Api>> {
    try {
      const result = await this.db
        .select()
        .from(apis)
        .where(eq(apis.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find API by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(workspaceId: string): Promise<ResponseResult<Api[]>> {
    try {
      const result = await this.db
        .select()
        .from(apis)
        .where(eq(apis.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find APIs by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceSlugMethod(
    workspaceId: string,
    slug: string,
    method: ApiMethod,
  ): Promise<ResponseResult<Api>> {
    try {
      const result = await this.db
        .select()
        .from(apis)
        .where(
          and(
            eq(apis.workspaceId, workspaceId),
            eq(apis.slug, slug),
            eq(apis.method, method),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find API by workspace, slug, and method", {
        error: e,
        workspaceId,
        slug,
        method,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByCollection(collectionId: string): Promise<ResponseResult<Api[]>> {
    try {
      const result = await this.db
        .select()
        .from(apis)
        .where(eq(apis.collectionId, collectionId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find APIs by collection", {
        error: e,
        collectionId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateApiInput,
    tx?: TxType,
  ): Promise<ResponseResult<Api>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(apis).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create API"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create API", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateApiInput,
    tx?: TxType,
  ): Promise<ResponseResult<Api>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(apis)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(apis.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update API", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(apis)
        .where(eq(apis.id, id))
        .returning({ id: apis.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete API", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateApiInput, UpdateApiInput, ApiConfig } from "./types";
