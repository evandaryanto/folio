import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { collections } from "./collections";
import { users } from "./users";
import { apiMethodEnum, apiTypeEnum, accessLevelEnum } from "./enums";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";
import { AccessLevel } from "@folio/contract/enums";

export interface ApiConfig {
  // For query/crud
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
    value?: unknown;
    param?: string; // e.g., "{{params.status}}"
  }>;
  sort?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
  // For aggregation
  aggregations?: Array<{
    field: string;
    function: "count" | "sum" | "avg" | "min" | "max";
    alias: string;
  }>;
  groupBy?: string[];
  // Response shaping
  select?: string[];
  exclude?: string[];
  // CRUD specifics
  allowCreate?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;
}

export const apis = pgTable(
  "apis",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    collectionId: ulidColumn("collection_id").references(() => collections.id, {
      onDelete: "cascade",
    }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    method: apiMethodEnum("method").notNull(),
    apiType: apiTypeEnum("api_type").notNull(),
    config: jsonb("config").notNull().default({}).$type<ApiConfig>(),
    accessLevel: accessLevelEnum("access_level")
      .default(AccessLevel.Private)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("apis_workspace_slug_method_idx").on(
      table.workspaceId,
      table.slug,
      table.method,
    ),
    index("apis_workspace_id_idx").on(table.workspaceId),
    index("apis_collection_id_idx").on(table.collectionId),
  ],
);

export type Api = typeof apis.$inferSelect;
export type NewApi = typeof apis.$inferInsert;
