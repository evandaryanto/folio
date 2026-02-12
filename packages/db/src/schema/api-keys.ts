import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 12 }).notNull(), // "fol_xxxx"
    keyHash: varchar("key_hash", { length: 255 }).notNull(),
    scopes: jsonb("scopes").default([]).$type<string[]>(), // ["read", "write"]
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
    revokedAt: timestamp("revoked_at"),
    revokedBy: ulidColumn("revoked_by").references(() => users.id),
  },
  (table) => [
    index("api_keys_workspace_id_idx").on(table.workspaceId),
    index("api_keys_key_prefix_idx").on(table.keyPrefix),
  ],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
