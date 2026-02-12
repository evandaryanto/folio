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
import { users } from "./users";
import { accessLevelEnum } from "./enums";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";
import { AccessLevel } from "@folio/contract/enums";

export interface CompositionConfig {
  // Source collection
  from: string; // collection slug
  // Joins
  joins?: Array<{
    collection: string;
    on: { left: string; right: string };
    type: "inner" | "left" | "right";
  }>;
  // Filtering
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
    value?: unknown;
    param?: string;
  }>;
  // Aggregation
  groupBy?: string[];
  aggregations?: Array<{
    field: string;
    function: "count" | "sum" | "avg" | "min" | "max";
    alias: string;
  }>;
  // Output
  select?: string[];
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  limit?: number;
}

export const compositions = pgTable(
  "compositions",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    config: jsonb("config").notNull().$type<CompositionConfig>(),
    accessLevel: accessLevelEnum("access_level")
      .default(AccessLevel.Private)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("compositions_workspace_slug_idx").on(
      table.workspaceId,
      table.slug,
    ),
    index("compositions_workspace_id_idx").on(table.workspaceId),
  ],
);

export type Composition = typeof compositions.$inferSelect;
export type NewComposition = typeof compositions.$inferInsert;
