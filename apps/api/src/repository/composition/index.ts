import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { compositions, type Composition } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateCompositionInput, UpdateCompositionInput } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class CompositionRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Composition>> {
    try {
      const result = await this.db
        .select()
        .from(compositions)
        .where(eq(compositions.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find composition by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(
    workspaceId: string,
  ): Promise<ResponseResult<Composition[]>> {
    try {
      const result = await this.db
        .select()
        .from(compositions)
        .where(eq(compositions.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find compositions by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspaceAndSlug(
    workspaceId: string,
    slug: string,
  ): Promise<ResponseResult<Composition>> {
    try {
      const result = await this.db
        .select()
        .from(compositions)
        .where(
          and(
            eq(compositions.workspaceId, workspaceId),
            eq(compositions.slug, slug),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find composition by workspace and slug", {
        error: e,
        workspaceId,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateCompositionInput,
    tx?: TxType,
  ): Promise<ResponseResult<Composition>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .insert(compositions)
        .values(data)
        .returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create composition"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create composition", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateCompositionInput,
    tx?: TxType,
  ): Promise<ResponseResult<Composition>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(compositions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(compositions.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update composition", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(compositions)
        .where(eq(compositions.id, id))
        .returning({ id: compositions.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Composition not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete composition", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type {
  CreateCompositionInput,
  UpdateCompositionInput,
  CompositionConfig,
} from "./types";
