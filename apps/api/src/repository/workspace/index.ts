import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { workspaces, type Workspace, type NewWorkspace } from "@folio/db";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import { ok, err, createError } from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";

interface WorkspaceRepositoryDeps {
  db: NodePgDatabase;
  logger: Logger;
}

export type CreateWorkspaceInput = Omit<
  NewWorkspace,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;

export class WorkspaceRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: WorkspaceRepositoryDeps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<Workspace>> {
    try {
      const result = await this.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find workspace by ID", {
        error: e,
        workspaceId: id,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findBySlug(slug: string): Promise<ResponseResult<Workspace>> {
    try {
      const result = await this.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.slug, slug))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find workspace by slug", {
        error: e,
        slug,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    input: CreateWorkspaceInput,
    tx?: TxType,
  ): Promise<ResponseResult<Workspace>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .insert(workspaces)
        .values(input)
        .returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create workspace"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create workspace", { error: e, input });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    input: UpdateWorkspaceInput,
  ): Promise<ResponseResult<Workspace>> {
    try {
      const result = await this.db
        .update(workspaces)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(workspaces.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update workspace", {
        error: e,
        workspaceId: id,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string): Promise<ResponseResult<void>> {
    try {
      const result = await this.db
        .delete(workspaces)
        .where(eq(workspaces.id, id))
        .returning({ id: workspaces.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete workspace", {
        error: e,
        workspaceId: id,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}
