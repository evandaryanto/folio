import { and, eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { apiKeys, type ApiKey } from "@folio/db/schema";
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
  CreateApiKeyInput,
  UpdateApiKeyInput,
  RevokeApiKeyInput,
} from "./types";

interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

export class ApiKeyRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  async findById(id: string): Promise<ResponseResult<ApiKey>> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find API key by id", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByKeyPrefix(keyPrefix: string): Promise<ResponseResult<ApiKey>> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.keyPrefix, keyPrefix))
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to find API key by prefix", {
        error: e,
        keyPrefix,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findByWorkspace(
    workspaceId: string,
  ): Promise<ResponseResult<ApiKey[]>> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.workspaceId, workspaceId));

      return ok(result);
    } catch (e) {
      this.logger.error("Failed to find API keys by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findActiveByWorkspace(
    workspaceId: string,
  ): Promise<ResponseResult<ApiKey[]>> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.workspaceId, workspaceId),
            eq(apiKeys.isActive, true),
            isNull(apiKeys.revokedAt),
          ),
        );

      // Filter out expired keys
      const activeKeys = result.filter(
        (key) => !key.expiresAt || key.expiresAt > now,
      );

      return ok(activeKeys);
    } catch (e) {
      this.logger.error("Failed to find active API keys by workspace", {
        error: e,
        workspaceId,
      });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async findValidByKeyHash(keyHash: string): Promise<ResponseResult<ApiKey>> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyHash, keyHash),
            eq(apiKeys.isActive, true),
            isNull(apiKeys.revokedAt),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      const key = result[0];
      if (key.expiresAt && key.expiresAt < now) {
        return err(createError(ErrorCode.NotFound, "API key expired"));
      }

      return ok(key);
    } catch (e) {
      this.logger.error("Failed to find valid API key by hash", { error: e });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async create(
    data: CreateApiKeyInput,
    tx?: TxType,
  ): Promise<ResponseResult<ApiKey>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor.insert(apiKeys).values(data).returning();

      if (result.length === 0) {
        return err(
          createError(ErrorCode.InternalError, "Failed to create API key"),
        );
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to create API key", { error: e, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async update(
    id: string,
    data: UpdateApiKeyInput,
    tx?: TxType,
  ): Promise<ResponseResult<ApiKey>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(apiKeys)
        .set(data)
        .where(eq(apiKeys.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to update API key", { error: e, id, data });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async revoke(
    id: string,
    data: RevokeApiKeyInput,
    tx?: TxType,
  ): Promise<ResponseResult<ApiKey>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .update(apiKeys)
        .set(data)
        .where(eq(apiKeys.id, id))
        .returning();

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok(result[0]);
    } catch (e) {
      this.logger.error("Failed to revoke API key", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async delete(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      const result = await executor
        .delete(apiKeys)
        .where(eq(apiKeys.id, id))
        .returning({ id: apiKeys.id });

      if (result.length === 0) {
        return err(createError(ErrorCode.NotFound, "API key not found"));
      }

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to delete API key", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }

  async updateLastUsed(id: string, tx?: TxType): Promise<ResponseResult<void>> {
    const executor = tx ?? this.db;
    try {
      await executor
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, id));

      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to update API key last used", { error: e, id });
      return err(createError(ErrorCode.InternalError, "Database error"));
    }
  }
}

export type {
  CreateApiKeyInput,
  UpdateApiKeyInput,
  RevokeApiKeyInput,
} from "./types";
