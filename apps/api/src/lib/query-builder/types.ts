// Re-export CompositionConfig from DB schema (single source of truth)
export type { CompositionConfig } from "@folio/db/schema";

/**
 * Context required for building a query
 */
export interface QueryBuildContext {
  workspaceId: string;
  fromCollectionId: string;
  joinCollectionIds: Map<string, string>; // collectionSlug -> collectionId
  params: Record<string, unknown>; // Query params from request
}

/**
 * Result of building a query - parameterized SQL
 */
export interface BuiltQuery {
  sql: string;
  values: unknown[];
}

/**
 * Parsed field expression (query-builder internal type)
 */
export interface FieldExpression {
  type: "simple" | "function" | "qualified";
  field: string;
  function?: FieldFunction;
  collection?: string; // For qualified fields like "accounts.type"
}

/**
 * Supported date/time functions for field expressions
 */
export type FieldFunction = "month" | "year" | "day" | "date";
