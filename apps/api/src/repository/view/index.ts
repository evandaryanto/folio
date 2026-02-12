import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { views, type View } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateViewInput, UpdateViewInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class ViewRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<View>> {
    try {
      const result = await this.db
        .select()
        .from(views)
        .where(eq(views.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find view by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(workspaceId: string): Promise<ResponseResult<View[]>> {
    try {
      const result = await this.db
        .select()
        .from(views)
        .where(eq(views.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find views by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndSlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<View>> {
    try {
      const result = await this.db
        .select()
        .from(views)
        .where(and(eq(views.workspaceId, workspaceId), eq(views.slug, slug)))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find view by workspace and slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateViewInput,
    tx?: TxType,
  ): Promise<ResponseResult<View>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(views).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create view"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create view", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateViewInput,
    tx?: TxType,
  ): Promise<ResponseResult<View>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(views)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(views.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update view", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(views)
        .where(eq(views.id, id))
        .returning({ id: views.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "View not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete view", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateViewInput, UpdateViewInput, ViewConfig } from "./types";
