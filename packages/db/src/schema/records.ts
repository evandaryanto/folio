import { index, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { collections } from "./collections";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const records = pgTable(
  "records",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    collectionId: ulidColumn("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    data: jsonb("data").notNull().default({}).$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
    updatedBy: ulidColumn("updated_by").references(() => users.id),
  },
  (table) => [
    index("records_workspace_id_idx").on(table.workspaceId),
    index("records_collection_id_idx").on(table.collectionId),
    index("records_workspace_collection_idx").on(
      table.workspaceId,
      table.collectionId,
    ),
    index("records_created_at_idx").on(table.createdAt),
    // GIN index for JSONB queries
    index("records_data_gin_idx").using("gin", table.data),
  ],
);

export type DbRecord = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
