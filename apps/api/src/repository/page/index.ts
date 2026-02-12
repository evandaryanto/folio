import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { pages, type Page } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreatePageInput, UpdatePageInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class PageRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Page>> {
    try {
      const result = await this.db
        .select()
        .from(pages)
        .where(eq(pages.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find page by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(workspaceId: string): Promise<ResponseResult<Page[]>> {
    try {
      const result = await this.db
        .select()
        .from(pages)
        .where(eq(pages.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find pages by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndSlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<Page>> {
    try {
      const result = await this.db
        .select()
        .from(pages)
        .where(and(eq(pages.workspaceId, workspaceId), eq(pages.slug, slug)))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find page by workspace and slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreatePageInput,
    tx?: TxType,
  ): Promise<ResponseResult<Page>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(pages).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create page"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create page", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdatePageInput,
    tx?: TxType,
  ): Promise<ResponseResult<Page>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(pages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pages.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update page", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(pages)
        .where(eq(pages.id, id))
        .returning({ id: pages.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Page not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete page", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreatePageInput, UpdatePageInput, PageBlock } from "./types";
