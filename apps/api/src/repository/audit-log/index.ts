import { and, between, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { auditLogs, type AuditLog } from "@folio/db/schema";
import type { Logger } from "@/utils/logger";
import {
  type ResponseResult,
  ok,
  err,
  createError,
} from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";
import type { TxType } from "@/client/postgres/transaction";
import type { CreateAuditLogInput, AuditLogFilter } from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class AuditLogRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<AuditLog>> {
    try {
      const result = await this.db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "Audit log not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find audit log by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByFilter(
    filter: AuditLogFilter,
  ): Promise<ResponseResult<AuditLog[]>> {
    try {
      const conditions = [eq(auditLogs.workspaceId, filter.workspaceId)];

      if (filter.userId) {
        conditions.push(eq(auditLogs.userId, filter.userId));
      }
      if (filter.resourceType) {
        conditions.push(eq(auditLogs.resourceType, filter.resourceType));
      }
      if (filter.resourceId) {
        conditions.push(eq(auditLogs.resourceId, filter.resourceId));
      }
      if (filter.action) {
        conditions.push(eq(auditLogs.action, filter.action));
      }
      if (filter.startDate && filter.endDate) {
        conditions.push(
          between(auditLogs.createdAt, filter.startDate, filter.endDate),
        );
      }

      let query = this.db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt));

      if (filter.limit) {
        query = query.limit(filter.limit) as typeof query;
      }
      if (filter.offset) {
        query = query.offset(filter.offset) as typeof query;
      }

      const result = await query;
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find audit logs by filter", {
        error: e,
        filter,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByResource(
    workspaceId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<ResponseResult<AuditLog[]>> {
    try {
      const result = await this.db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.workspaceId, workspaceId),
            eq(auditLogs.resourceType, resourceType),
            eq(auditLogs.resourceId, resourceId),
          ),
        )
        .orderBy(desc(auditLogs.createdAt));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find audit logs by resource", {
        error: e,
        workspaceId,
        resourceType,
        resourceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByUser(
    workspaceId: string,
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ResponseResult<AuditLog[]>> {
    try {
      let query = this.db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.workspaceId, workspaceId),
            eq(auditLogs.userId, userId),
          ),
        )
        .orderBy(desc(auditLogs.createdAt));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      const result = await query;
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find audit logs by user", {
        error: e,
        workspaceId,
        userId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateAuditLogInput,
    tx?: TxType,
  ): Promise<ResponseResult<AuditLog>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(auditLogs).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create audit log"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create audit log", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async createMany(
    data: CreateAuditLogInput[],
    tx?: TxType,
  ): Promise<ResponseResult<AuditLog[]>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(auditLogs).values(data).returning();
      return ok(result);
    } catch (e) {
      this.logger.error("Failed to create audit logs", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type { CreateAuditLogInput, AuditLogFilter } from "./types";
