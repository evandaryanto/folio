/**
 * Cursor pagination utilities for Drizzle repositories.
 * Works with ULID primary keys which are lexicographically sortable.
 */

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Builds a paginated result from query results.
 * Expects items to be fetched with limit + 1 to detect if there are more results.
 *
 * @param items - Query results (fetched with limit + 1)
 * @param limit - Requested limit
 * @returns Paginated result with data and pagination info
 *
 * @example
 * ```typescript
 * const items = await db
 *   .select()
 *   .from(accounts)
 *   .where(cursor ? lt(accounts.id, cursor) : undefined)
 *   .orderBy(desc(accounts.id))
 *   .limit(limit + 1);
 *
 * return buildPaginationResult(items, limit);
 * ```
 */
export function buildPaginationResult<T extends { id: string }>(
  items: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: data.length > 0 ? data[data.length - 1].id : null,
    },
  };
}
