import type { ExtractTablesWithRelations } from "drizzle-orm";
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type TxType = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>;

export type DbOrTx = NodePgDatabase | TxType;

/**
 * Creates a transaction wrapper function that can be used to wrap
 * multiple database operations in a single transaction.
 *
 * Usage in usecase:
 * ```typescript
 * async create(data: CreateInput): Promise<ResponseResult<string>> {
 *   return this.txWrapper(async (tx) => {
 *     const workspace = await this.workspaceRepo.create(tx, data);
 *     if (!workspace.ok) return workspace;
 *
 *     const user = await this.userRepo.create(tx, { workspaceId: workspace.data.id, ... });
 *     if (!user.ok) return user;
 *
 *     return { ok: true, data: user.data.id };
 *   });
 * }
 * ```
 */
export const createTransactionWrapper =
  <TSchema extends Record<string, unknown> = Record<string, never>>(
    db: NodePgDatabase<TSchema>,
  ) =>
  async <T>(
    fn: (
      tx: PgTransaction<
        NodePgQueryResultHKT,
        TSchema,
        ExtractTablesWithRelations<TSchema>
      >,
    ) => Promise<T>,
  ): Promise<T> =>
    db.transaction(async (tx) => fn(tx));

export type TransactionWrapper = ReturnType<typeof createTransactionWrapper>;
